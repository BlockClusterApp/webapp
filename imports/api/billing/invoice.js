import Invoice from '../../collections/payments/invoice';
import RazorPay from '../../api/payments/payment-gateways/razorpay';
import Payment from '../../api/payments/';
import { RZPlan, RZSubscription, RZAddOn } from '../../collections/razorpay';
import moment from 'moment';
const debug = require('debug')('api:invoice')

const InvoiceObj = {};

InvoiceObj.generateInvoice = async ({ billingMonth, bill, userId, rzSubscription }) => {
  const totalAmount = Number(bill.totalAmount).toFixed(2);
  const user = Meteor.users
    .find({
      _id: userId,
    })
    .fetch()[0];

  const invoiceObject = {
    userId: user._id,
    user: {
      email: user.emails[0].address,
      mobile: user.profile.mobiles && user.profile.mobiles[0].number,
      name: `${user.profile.firstName} ${user.profile.lastName}`,
      billingAddress: '',
    },
    rzCustomerId: user.rzCustomerId,
    paymentStatus: user.demoUser ? Invoice.PaymentStatusMapping.DemoUser : Invoice.PaymentStatusMapping.Pending,
    billingPeriod: billingMonth,
    billingPeriodLabel: moment(billingMonth).format('MMM-YYYY'),
    totalAmount,
    rzSubscriptionId: rzSubscription.id
  };


  const existingInvoice = Invoice.find({
    billingPeriodLabel: invoiceObject.billingPeriodLabel,
    rzSubscriptionId: invoiceObject.rzSubscriptionId
  }).fetch()[0];
  if(existingInvoice) {
    console.log(`Bill already exists for ${invoiceObject.rzSubscriptionId} for ${invoiceObject.billingPeriodLabel}`);
    return true;
  }

  const items = bill.networks;

  invoiceObject.items = items;

  const conversion = await Payment.getConversionToINRRate({});
  invoiceObject.totalAmountINR = Math.max(Math.floor(Number(totalAmount) * 100 * conversion - 100), 0 );

  if (!user.demoUser && Math.round(invoiceObject.totalAmountINR) > 100) {
    const rzAddOn = await RazorPay.createAddOn({
      subscriptionId: rzSubscription.id,
      addOn: {
        name: `Bill for ${moment(billingMonth).format('MMM-YYYY')}`,
        description: `Node usage charges `,
        amount: Math.floor(Number(totalAmount) * 100 * conversion - 100),  // Since we are already charging Rs 1 for subscription so deduct Rs 1 from final here
        currency: 'INR',
      },
      userId,
    });
    invoiceObject.rzAddOnId = rzAddOn._id;
  }


  invoiceObject.conversionRate = conversion;


  const invoiceId = Invoice.insert(invoiceObject);

  return invoiceId;
};

InvoiceObj.settleInvoice = async ({rzSubscriptionId, rzCustomerId, billingMonth, rzPayment}) => {
  const billingMonthLabel = moment(billingMonth).format('MMM-YYYY');
  console.log("Billing month", billingMonthLabel);
  debug("Fetching invoice", {
    paymentStatus: Invoice.PaymentStatusMapping.Pending,
    rzCustomerId,
    rzSubscriptionId
  });

  const invoice = Invoice.find({
    paymentStatus: Invoice.PaymentStatusMapping.Pending,
    rzCustomerId,
    rzSubscriptionId
  }).fetch()[0];

  console.log("Settling invoice", invoice);

  Invoice.update({
    paymentStatus: Invoice.PaymentStatusMapping.Pending,
    rzCustomerId,
    rzSubscriptionId
  }, {
    $set: {
      paymentStatus: Invoice.PaymentStatusMapping.Settled,
      paymentId: rzPayment.id,
      padiAmount: rzPayment.amount
    }
  });

  return true;
}

export default InvoiceObj;
