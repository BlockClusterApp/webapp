import { Networks } from '../../collections/networks/networks';
import UserCards from '../../collections/payments/user-cards';
import moment from 'moment';

const Billing = {};

const FreeNodesPerUser = {
  Micro: 2
}

const FreeHoursPerUser = {
  Micro: 1490 * 2
}

function convertMilliseconds(ms) {
  const seconds = Math.round(ms/1000);
  const minutes = Math.floor(seconds/60);
  const hours = Math.floor(minutes/60);
  const days = Math.floor(hours/24);

  return { seconds, minutes, hours, days }
}

Billing.generateBill = async function(userId, month, year) {
  month = month || moment().month();
  year = year || moment().year();

  const selectedMonth = moment().month(month).year(year);
  const currentMonth = moment();

  let calculationEndDate = selectedMonth.endOf('month').toDate();
  if(currentMonth.isBefore(selectedMonth)){
    calculationEndDate = currentMonth.toDate();
  }

  const userNetworks = Networks.find({
    user: userId,
    createdOn: {
      $lt: selectedMonth.endOf('month').toDate().getTime(),
      $gte: selectedMonth.startOf('month').toDate().getTime()
    }
  }).fetch();

  const result = {
    totalAmount: 0
  };

  const nodeTypeCount = {
    Micro: 0
  };

  const nodeUsageCountMinutes = {
    Micro: 0
  }

  result.networks =  userNetworks.map(network => {

    let isMicroNode = network.networkConfig && network.networkConfig.cpu === 500;

    let thisCalculationEndDate = calculationEndDate;
    if (network.deletedAt < calculationEndDate.getTime()) {
      thisCalculationEndDate = new Date(network.deletedAt);
    }

    const networkConfig = network.metadata && network.metadata.networkConfig;
    if(networkConfig && networkConfig._id){
      isMicroNode = isMicroNode || networkConfig.name === 'Light';
    }


    const time = convertMilliseconds(thisCalculationEndDate.getTime() - new Date(network.createdOn).getTime());
    const rate = isMicroNode ? 0.05 * 24 * 30 : 199; // per month
    let rateString = isMicroNode ? `$ 0.05 / hr` : `$ ${rate} / month `;
    const ratePerHour = rate / (30 * 24);
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

    const vouchar_usable = (voucher.usability.recurring == true) ? ( (voucher.usability.no_months > voucher.voucher_claim_status.length) ? true:false ) : (voucher.voucher_claim_status.length ? false : true);
    const voucher_expired = voucher.expiryDate ? new Date(voucher.expiryDate) <= new Date() : false

    let cost = Number(time.hours * ratePerHour + ((time.minutes) % 60) * ratePerMinute).toFixed(2);

    if(voucher && voucher._id && !isMicroNode && vouchar_usable && voucher_expired) {
      const hoursFree = voucher.discountedDays * 24;
      const paidHours = Math.max(time.hours - hoursFree, 0);
      const paidMinutes = time.hours > 0 && paidHours < 1 ? time.minutes % 60 : 0;
      cost = Number(paidHours * ratePerHour + paidMinutes * ratePerMinute).toFixed(2);

      let discount = voucher.discount.value || 0;
      if(voucher.discount.percent){
        //in this case discout value will be percentage of discount.
        cost = cost* ( (100-discount) / 100 );
      }else{
        cost = cost-discount;
      }

      //so that we can track record how many times he used.
      //and also helps to validate if next time need to consider voucher or not.
      Networks.update(
        { _id: network._id },
        {
          $push: {
            voucher_claim_status: {
              claimedBy: Meteor.userId(),
              claimedOn: new Date(),
              claimed: true
            }
          }
        }
      );
      
    }
    let label = voucher ? voucher.code : networkConfig && networkConfig.name === 'Micro free' ? networkConfig.name : null;

    // if(isMicroNode && network.active){
    //   nodeTypeCount.Micro += 1;
    // }

    if(isMicroNode){
      // calculate hours
      let endTime = network.deletedAt ? network.deletedAt : new Date();
      const usedTime =  convertMilliseconds(moment(endTime).toDate().getTime() - moment(network.createdOn).toDate().getTime());
      const freeHoursLeft = Math.max(FreeHoursPerUser.Micro - (nodeUsageCountMinutes.Micro / 60), 0);
      let paidHours = -1, paidMinutes = 0;
      if(freeHoursLeft < usedTime.hours) {
        paidHours = usedTime.hours - freeHoursLeft;
      }
      if(paidHours >= 0){
        paidMinutes = usedTime.minutes % 60;
      }

      paidHours = Math.max(0, paidHours);

      cost = Number(paidHours * ratePerHour + paidMinutes * ratePerMinute).toFixed(2);
      nodeUsageCountMinutes.Micro += usedTime.hours * 60;
      nodeUsageCountMinutes.Micro += usedTime.minutes % 60;
      label = label || 'light';
    }

    // if(isMicroNode && nodeTypeCount.Micro > FreeNodesPerUser.Micro) {
    //   cost = Number(time.hours * ratePerHour + ((time.minutes) % 60) * ratePerMinute).toFixed(2);
    //   label = undefined;
    // }

    result.totalAmount += Number(cost);


    return {
      name: network.name,
      instanceId: network.instanceId,
      createdOn: new Date(network.createdOn),
      rate: rateString,
      runtime: `${time.hours}:${(time.minutes % 60) < 10 ? `0${time.minutes % 60}`: time.minutes % 60}`,
      cost,
      voucher: voucher,
      networkConfig,
      label,
      timeperiod: `Started at: ${moment(network.createdOn).format('DD-MMM-YYYY HH:mm')} ${network.deletedAt ? ` to ${moment(network.deletedAt).format('DD-MMM-YYYY HH:mm:SS')}` : 'and still running'}`
    };
  });

  result.totalFreeMicroHours = convertMilliseconds(nodeUsageCountMinutes.Micro * 60 * 1000);

  return result;
}

Billing.shouldHideCreditCardVerification = async function() {
  const userId = Meteor.userId();

  if(!userId){
    return false;
  }

  const userCards = UserCards.find({userId: userId}).fetch()[0];
  const networks = Networks.find({user: userId, active: true}).fetch();

  if(networks.length > 2 && !(userCards && userCards.cards.length > 0)){
    return false;
  }

  if(!userCards){
    return false;
  }

  if(userCards.cards && userCards.cards.length > 0){
    return true;
  }

  return false;

}

Meteor.methods({
  fetchBilling: Billing.generateBill,
  shouldShowCreditCardVerification: Billing.shouldHideCreditCardVerification
});

export default Billing;
