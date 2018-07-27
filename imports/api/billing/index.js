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
      isMicroNode = isMicroNode || networkConfig.name === 'Micro';
    }


    const time = convertMilliseconds(thisCalculationEndDate.getTime() - new Date(network.createdOn).getTime());
    const rate = isMicroNode ? 0.05 * 24 * 30 : 199; // per month
    let rateString = isMicroNode ? `$ 0.05 / hr` : `$ ${rate} / month `;
    const ratePerHour = rate / (30 * 24);
    const ratePerMinute = ratePerHour / 60;

    const voucher = network.metadata && network.metadata.voucher;

    let cost = Number(time.hours * ratePerHour + ((time.minutes) % 60) * ratePerMinute).toFixed(2);

    if(voucher && voucher._id && !isMicroNode) {
      const hoursFree = voucher.discountedDays * 24;
      const paidHours = Math.max(time.hours - hoursFree, 0);
      const paidMinutes = time.hours > 0 && paidHours < 1 ? time.minutes % 60 : 0;
      cost = Number(paidHours * ratePerHour + paidMinutes * ratePerMinute).toFixed(2);
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
      label = label || 'micro';
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

  if(networks.length > 2){
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
