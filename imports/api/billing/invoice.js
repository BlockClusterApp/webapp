import Invoice from '../../collections/payments/invoice';
import RazorPay from '../../api/payments/payment-gateways/razorpay';
import Payment from '../../api/payments/';
import { RZPlan, RZSubscription, RZAddOn } from '../../collections/razorpay';
import moment from 'moment';

const InvoiceObj = {};

InvoiceObj.generateInvoice = async ({
  billingMonth,
  bill,
  userId,
  rzSubscription
}) => {
  const totalAmount = Number(bill.totalAmount).toFixed(2);
  const user = Meteor.users.find({
    _id: userId
  }).fetch()[0];
  if(Math.round(bill.totalAmount) === 0){
    console.log(`Not generating invoice for ${userId} as amount is 0 `);
    return true;
  }
  const items = [];
  const invoiceObject = {
    user: {
      email: user.emails[0].address,
      mobile: user.profile.mobiles && user.profile.mobiles[0].number,
      name: `${user.profile.firstName} ${user.profile.lastName}`,
      billingAddress: ''
    },
    rzCustomerId: user.rzCustomerId,
    paymentStatus: Invoice.PaymentStatusMapping.Pending,
    billingPeriod: billingMonth,
    billingPeriodLabel: moment(billingMonth).format('MMM-YYYY'),
    totalAmount,
  };

  bill.networks.forEach(network => {
    items.push({
      name: `${network.name} - ${network.instanceId}`,
      runtime: network.runtime,
      createdOn: network.createdOn,
      deletedAt: network.deletedAt,
      rate: network.rate,
      networkConfig: network.networkConfig,
      voucher: network.voucher,
      cost: network.cost,
      time: network.time
    })
  });

  invoiceObject.items = items;

  const conversion = await Payment.getConversionToINRRate({});

  const rzAddOn = await RazorPay.createAddOn({
    subscriptionId: rzSubscription.id,
    addOn: {
      name: `Bill for ${moment(billingMonth).format('MMM-YYYY')}`,
      description: `Node usage charges`,
      amount: ((Number(totalAmount) * 100 * conversion) - 100),
      currency: 'INR'
    },
    userId
  });

  invoiceObject.conversionRate = conversion;

  invoiceObject.rzAddOnId = rzAddOn._id;

  const invoiceId = Invoice.insert(invoiceObject);

  return invoiceId;
}

export default InvoiceObj;
