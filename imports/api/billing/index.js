import { Networks } from '../../collections/networks/networks';
import moment from 'moment';

const Billing = {};

function convertMilliseconds(ms) {
  const seconds = Math.round(ms/1000);
  const minutes = Math.floor(seconds/60);
  const hours = Math.floor(minutes/60);

  return { seconds, minutes, hours }
}

Billing.generateBill = function(userId, month, year) {
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

  result.networks =  userNetworks.map(network => {
    let thisCalculationEndDate = calculationEndDate;
    if (network.deletedAt < calculationEndDate.getTime()) {
      thisCalculationEndDate = new Date(network.deletedAt);
    }
    const time = convertMilliseconds(thisCalculationEndDate.getTime() - new Date(network.createdOn).getTime());
    const rate = 199; // per month
    const ratePerHour = rate / (30 * 24);
    const ratePerMinute = ratePerHour / 60;

    const cost = Number(time.hours * ratePerHour + time.minutes * ratePerMinute).toFixed(2);

    result.totalAmount += Number(cost);

    return {
      name: network.name,
      instanceId: network.instanceId,
      createdOn: new Date(network.createdOn),
      rate: `$${rate} / month`,
      runtime: `${time.hours}:${(time.minutes % 60) < 10 ? `0${time.minutes % 60}`: time.minutes % 60}`,
      cost,
      timeperiod: `Started at: ${moment(network.createdOn).format('DD-MMM-YYYY HH:mm')} ${network.deletedAt ? ` to ${moment(network.deletedAt).format('DD-MMM-YYYY HH:mm:SS')}` : 'and still running'}`
    };
  });

  return result;
}

Meteor.methods({
  fetchBilling: Billing.generateBill
});

export default Billing;
