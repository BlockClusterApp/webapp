import { Networks } from '../../collections/networks/networks';
import UserCards from '../../collections/payments/user-cards';
import { RZPlan, RZSubscription, RZAddOn } from '../../collections/razorpay';
import moment, { invalid } from 'moment';
import Invoice from '../../collections/payments/invoice';
import helpers from '../../modules/helpers';
import { Hyperion } from '../../collections/hyperion/hyperion';
import HyperionPricing from '../../collections/pricing/hyperion';
import HyperionApis from '../hyperion.js';
import PaymeterApis from '../paymeter/index.js';
import ChargeableAPI from '../../collections/chargeable-apis';
import InvoiceApis from './invoice';

const Billing = {};

const FreeNodesPerUser = {
  Micro: 2,
};

// Price per hour in $
const Price = {
  lightNode: 0.1375, // $99 a month
  powerNode: 0.4158, // $299
  extraDisk: 0.3,
};
const POWER_NODE_INCLUDED_STORAGE = 200;

const FreeHoursPerUser = {
  Micro: 0,
};

function convertMilliseconds(ms) {
  const seconds = Math.round(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  return { seconds, minutes, hours, days };
}

Billing.generateBill = async function({ userId, month, year, isFromFrontend }) {
  month = month || moment().month();
  year = year || moment().year();

  const selectedMonth = moment()
    .year(year)
    .month(month);
  const currentTime = moment();

  let calculationEndDate = selectedMonth.endOf('month').toDate();
  if (currentTime.isBefore(selectedMonth)) {
    calculationEndDate = currentTime.toDate();
  }

  const result = {
    totalAmount: 0,
  };
  if (!(selectedMonth.month() === moment().month() && selectedMonth.year() === moment().year()) && isFromFrontend) {
    const prevMonthInvoice = Invoice.find({
      userId: userId,
      billingPeriodLabel: selectedMonth.format('MMM-YYYY'),
    }).fetch()[0];
    if (prevMonthInvoice) {
      result.networks = prevMonthInvoice.items;
      result.totalAmount = prevMonthInvoice.totalAmount;
      result.invoiceStatus = prevMonthInvoice.paymentStatus;
      result.invoiceId = prevMonthInvoice._id;
      result.creditClaims = prevMonthInvoice.creditClaims;
      return result;
    }
  }

  const userNetworks = Networks.find({
    user: userId,
    createdAt: {
      $lt: calculationEndDate,
    },
    $or: [
      { deletedAt: null },
      {
        deletedAt: {
          $gte: selectedMonth
            .startOf('month')
            .toDate()
            .getDate(),
        },
      },
    ],
  }).fetch();

  const nodeTypeCount = {
    Micro: 0,
  };
  const nodeUsageCountMinutes = {
    Micro: 0,
  };

  result.networks = userNetworks
    .map(network => {
      let isMicroNode = network.networkConfig && network.networkConfig.cpu === 500;

      let thisCalculationEndDate = calculationEndDate;
      if (network.deletedAt && moment(network.deletedAt).isBefore(calculationEndDate.getTime())) {
        thisCalculationEndDate = new Date(network.deletedAt);
      }

      const networkConfig = network.metadata && network.metadata.networkConfig;
      if (networkConfig && networkConfig._id) {
        isMicroNode = isMicroNode || networkConfig.name === 'Light';
      }

      let billingStartDate = selectedMonth.startOf('month').toDate();
      if (moment(billingStartDate).isBefore(moment(network.createdAt))) {
        billingStartDate = moment(network.createdAt).toDate();
      }

      let price = isMicroNode ? Price.lightNode : Price.powerNode;
      if (network.metadata && network.metadata.networkConfig && network.metadata.networkConfig.cost) {
        price = Number(network.metadata.networkConfig.cost.hourly);
      }
      if (network.metadata && network.metadata.voucher && network.metadata.voucher.metadata && network.metadata.networkConfig && network.metadata.networkConfig.cost) {
        price = Number(network.metadata.networkConfig.cost.hourly);
      }

      const time = convertMilliseconds(thisCalculationEndDate.getTime() - billingStartDate.getTime());
      const rate = price; // per month
      const ratePerHour = rate;
      const ratePerMinute = ratePerHour / 60;

      const voucher = network.metadata && network.metadata.voucher;

      /**
       * First Time inside Voucher Object voucher_claim_status array is of length 0.
       * when we generate bill after month check if recurring type voucher of not.
       * if recurring type voucher:
       *         check the `voucher.usability.no_months` field conatins value for recurring.
       *         now on applying voucher insert a doc in voucher.voucher_claim_status.
       *         and every time before applying voucher in bill, check this if `voucher.usability.no_months` is less than
       *         the inserted docs in `voucher_claim_status` or not.
       *          if not then understad, limit of recurring is over, dont consider.
       * if not recuring:
       *         after applying voucher we are inserting a doc in the same voucher_claim_status field.
       *         and also every time before applying ,checking if voucher_claim_status legth is 0 or more.
       *         if 0 then that means first time, good to go. if there is any. then dont consider to apply.
       *
       * And Also check for expiry date.
       */
      let vouchar_usable;
      let voucher_expired;
      if (voucher) {
        if (!voucher.usability) {
          voucher.usability = {
            recurring: false,
            no_months: 0,
            once_per_user: true,
            no_times_per_user: 1,
          };
        }
        if (!voucher.availability) {
          voucher.availability = {
            card_vfctn_needed: true,
            for_all: false,
            email_ids: [],
          };
        }
        if (!voucher.discount) {
          voucher.discount = {
            value: 0,
            percent: false,
          };
        }

        vouchar_usable =
          voucher.usability.recurring == true
            ? voucher.usability.no_months > (voucher.voucher_claim_status ? voucher.voucher_claim_status.length : 0)
              ? true
              : false
            : (voucher.voucher_claim_status
              ? voucher.voucher_claim_status.length
              : false)
            ? false
            : true;

        voucher_expired = voucher.expiryDate ? new Date(voucher.expiryDate) <= new Date() : false;
      }
      let cost = Number(time.hours * ratePerHour + (time.minutes % 60) * ratePerMinute).toFixed(2);

      if (voucher && voucher._id && !isMicroNode && vouchar_usable) {
        const hoursFree = voucher.discountedDays * 24;
        const paidHours = Math.max(time.hours - hoursFree, 0);
        const paidMinutes = time.hours > 0 && paidHours < 1 ? time.minutes % 60 : 0;
        cost = Number(paidHours * ratePerHour + paidMinutes * ratePerMinute).toFixed(2);

        let discount = voucher.discount.value || 0;
        if (voucher.discount.percent) {
          //in this case discout value will be percentage of discount.
          cost = cost * ((100 - discount) / 100);
        } else {
          cost = cost - discount;
        }

        //so that we can track record how many times he used.
        //and also helps to validate if next time need to consider voucher or not.
        if (!isFromFrontend) {
          Networks.update(
            { _id: network._id },
            {
              $push: {
                'metadata.voucher.voucher_claim_status': {
                  claimedBy: userId,
                  claimedOn: new Date(),
                  claimed: true,
                },
              },
            }
          );
        }
      }
      let label = voucher ? voucher.code : null;

      // if(isMicroNode && network.active){
      //   nodeTypeCount.Micro += 1;
      // }
      let extraDiskAmount = 0;
      let extraDiskStorage = 0;
      if (isMicroNode) {
        // calculate hours
        let endTime = network.deletedAt ? network.deletedAt : new Date();
        if (moment(endTime).isBefore(moment(network.createdAt))) {
          return undefined;
        }
        const usedTime = convertMilliseconds(
          moment(endTime)
            .toDate()
            .getTime() - billingStartDate.getTime()
        );
        const freeHoursLeft = 0;
        let paidHours = 0,
          paidMinutes = 0;
        if (freeHoursLeft < usedTime.hours) {
          paidHours = usedTime.hours - freeHoursLeft;
        }
        if (paidHours >= 0) {
          paidMinutes = usedTime.minutes % 60;
        }

        paidHours = Math.max(0, paidHours);

        cost = Number(paidHours * ratePerHour + paidMinutes * ratePerMinute).toFixed(2);

        const runtimeStart = moment(network.createdOn);
        const runtime = convertMilliseconds(
          moment(endTime)
            .toDate()
            .getTime() - runtimeStart.toDate().getTime()
        );
        nodeUsageCountMinutes.Micro += runtime.hours * 60;
        nodeUsageCountMinutes.Micro += runtime.minutes % 60;
      } else {
        if (network.networkConfig.disk > 200) {
          extraDiskStorage = Math.max(network.networkConfig.disk - POWER_NODE_INCLUDED_STORAGE, 0);
          extraDiskAmount = Price.extraDisk * extraDiskStorage;
          cost = cost + extraDiskAmount;
        }
      }

      // if(isMicroNode && nodeTypeCount.Micro > FreeNodesPerUser.Micro) {
      //   cost = Number(time.hours * ratePerHour + ((time.minutes) % 60) * ratePerMinute).toFixed(2);
      //   label = undefined;
      // }

      if (network.deletedAt && moment(network.deletedAt).isBefore(selectedMonth.startOf('month'))) {
        return undefined;
      }
      result.totalAmount += Number(cost);
      function floorFigure(figure, decimals) {
        if (!decimals) decimals = 3;
        var d = Math.pow(10, decimals);
        return (parseInt(figure * d) / d).toFixed(decimals);
      }
      return {
        name: network.name,
        instanceId: network.instanceId,
        createdOn: new Date(network.createdOn),
        rate: ` $ ${floorFigure(rate, 3)} / hr `, //taking upto 3 decimals , as shown in pricing page
        runtime: `${time.hours}:${time.minutes % 60 < 10 ? `0${time.minutes % 60}` : time.minutes % 60} hrs | ${extraDiskStorage} GB extra`,
        cost,
        time,
        deletedAt: network.deletedAt,
        voucher: voucher,
        networkConfig,
        label,
        timeperiod: `Started at: ${moment(network.createdOn).format('DD-MMM-YYYY kk:mm')} ${
          network.deletedAt ? ` to ${moment(network.deletedAt).format('DD-MMM-YYYY kk:mm:ss')}` : 'and still running'
        }`,
      };
    })
    .filter(n => !!n);

  /*Calculate Hyperion Usage Bill*/
  //start
  let total_hyperion_cost = 0; //add this value to invoice amount
  const hyperion_stats = Hyperion.find({
    userId: userId,
  }).fetch();

  if (hyperion_stats.length === 1) {
    const hyperionPricing = HyperionPricing.find({ active: true }).fetch()[0];
    total_hyperion_cost = await HyperionApis.getBill({ userId, isFromFrontEnd: isFromFrontend, selectedMonth });
    result.networks = result.networks || [];
    result.networks.push({
      name: 'Hyperion Cost',
      instanceId: '',
      createdOn: isFromFrontend
        ? moment()
            .startOf('month')
            .toDate()
        : moment()
            .subtract(1, 'month')
            .startOf('month')
            .toDate(),
      rate: `$ ${hyperionPricing.perGBCost} / GB-month `,
      runtime: '',
      cost: Number(total_hyperion_cost).toFixed(2),
    });
    result.totalAmount += Number(total_hyperion_cost);

    if (hyperionPricing.perApiCost) {
      const apiCalls = ChargeableAPI.find({
        userId,
        createdAt: {
          $gte: selectedMonth.toDate(),
          $lte: calculationEndDate,
        },
      }).fetch();

      const totalApiCallCost = hyperionPricing.perApiCost * apiCalls.length;
      result.networks.push({
        name: 'Hyperion API Cost',
        instanceId: '',
        createdOn: isFromFrontend
          ? moment()
              .startOf('month')
              .toDate()
          : moment()
              .subtract(1, 'month')
              .startOf('month')
              .toDate(),
        rate: `$ ${hyperionPricing.perApiCost} / request`,
        runtime: `${apiCalls.length} requests`,
        cost: totalApiCallCost,
      });

      result.totalAmount += Number(totalApiCallCost);
    }
  }

  const paymeterCost = await PaymeterApis.getBill({ userId, isFromFrontEnd: isFromFrontend, selectedMonth });
  // if (Math.floor(Number(paymeterCost)) > 0) {
  result.networks = result.networks || [];
  result.networks.push({
    name: 'Paymeter Cost',
    instanceId: '',
    createdOn: '',
    rate: '',
    runtime: '',
    cost: Number(paymeterCost).toFixed(2),
  });

  result.totalAmount += Number(paymeterCost);
  // }

  // Fetch redeemable credits
  if (isFromFrontend) {
    const { eligibleCredits } = await InvoiceApis.fetchCreditsRedemption({ userId, totalAmount: result.totalAmount });
    eligibleCredits.forEach(ec => {
      result.networks.push({
        name: `Credit Redemption`,
        instanceId: ec.credit.code,
        createdOn: '',
        rate: `$ ${ec.credit.amount}`,
        cost: `-${ec.amount}`,
      });
      result.totalAmount -= ec.amount;
    });
  }

  if (!(selectedMonth.month() === moment().month() && selectedMonth.year() === moment().year()) && isFromFrontend) {
    const prevMonthInvoice = Invoice.find({
      userId: userId,
      billingPeriodLabel: selectedMonth.format('MMM-YYYY'),
    }).fetch()[0];
    if (!prevMonthInvoice) {
      result.networks = [];
      result.totalAmount = 0;
    } else {
      result.networks = prevMonthInvoice.items;
      result.totalAmount = prevMonthInvoice.totalAmount;
      result.invoiceStatus = prevMonthInvoice.paymentStatus;
      result.invoiceId = prevMonthInvoice._id;
      result.creditClaims = prevMonthInvoice.creditClaims;
    }
  }

  result.totalFreeMicroHours = convertMilliseconds(nodeUsageCountMinutes.Micro * 60 * 1000);
  result.totalAmount = Math.max(result.totalAmount, 0);

  return result;
};

Billing.isPaymentMethodVerified = async function(userId) {
  if (!RemoteConfig.features.CardToCreateNetwork) {
    return true;
  }
  userId = userId || Meteor.userId();

  if (!userId) {
    return false;
  }

  let userCards = UserCards.find({ userId: userId }).fetch()[0];
  if (userCards) {
    userCards = userCards.cards && userCards.cards[0];
  }
  const verificationPlan = RZPlan.find({ identifier: 'verification' }).fetch()[0];
  const userRZSubscription = RZSubscription.find({ userId: userId, plan_id: verificationPlan.id, bc_status: 'active' }).fetch()[0];

  // debit card
  if (userCards && !userRZSubscription) {
    return true;
  }

  if (!userCards && !userRZSubscription) {
    return false;
  }

  return true;
};

Meteor.methods({
  fetchBilling: Billing.generateBill,
  shouldShowCreditCardVerification: Billing.isPaymentMethodVerified,
});

export default Billing;
