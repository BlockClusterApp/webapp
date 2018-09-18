import Invoice from '../../collections/payments/invoice';
import RazorPay from '../../api/payments/payment-gateways/razorpay';
import Payment from '../../api/payments/';
import Payments from '../payments';
import { RZPlan, RZSubscription, RZAddOn } from '../../collections/razorpay';
import moment from 'moment';
const debug = require('debug')('api:invoice');
import {
  getEJSTemplate
} from "../../modules/helpers/server";
import writtenNumber from 'written-number'

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
  };

  if (rzSubscription) {
    invoiceObject.rzSubscriptionId = rzSubscription.id;
  }

  if (rzSubscription) {
    const existingInvoice = Invoice.find({
      billingPeriodLabel: invoiceObject.billingPeriodLabel,
      rzSubscriptionId: invoiceObject.rzSubscriptionId,
    }).fetch()[0];
    if (existingInvoice) {
      console.log(`Bill already exists for ${invoiceObject.rzSubscriptionId} for ${invoiceObject.billingPeriodLabel}`);
      return true;
    }
  } else {
    const existingInvoice = Invoice.find({
      billingPeriodLabel: invoiceObject.billingPeriodLabel,
      userId,
    }).fetch()[0];
    if (existingInvoice) {
      console.log(`Bill already exists for ${invoiceObject.userId} for ${invoiceObject.billingPeriodLabel}`);
      return true;
    }
  }

  const items = bill.networks;

  invoiceObject.items = items;

  const conversion = await Payment.getConversionToINRRate({});
  invoiceObject.totalAmountINR = Math.max(Math.floor(Number(totalAmount) * 100 * conversion - 100), 0);

  if (!user.demoUser && Math.round(invoiceObject.totalAmountINR) > 100 && !user.byPassOnlinePayment && rzSubscription) {
    const rzAddOn = await RazorPay.createAddOn({
      subscriptionId: rzSubscription.id,
      addOn: {
        name: `Bill for ${moment(billingMonth).format('MMM-YYYY')}`,
        description: `Node usage charges `,
        amount: Math.floor(Number(totalAmount) * 100 * conversion - 100), // Since we are already charging Rs 1 for subscription so deduct Rs 1 from final here
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

InvoiceObj.settleInvoice = async ({ rzSubscriptionId, rzCustomerId, billingMonth, billingMonthLabel, invoiceId, rzPayment }) => {
  billingMonthLabel = billingMonthLabel || moment(billingMonth).format('MMM-YYYY');
  debug('Fetching invoice', {
    paymentStatus: Invoice.PaymentStatusMapping.Pending,
    rzCustomerId,
    rzSubscriptionId,
  });

  const selector = {
    paymentStatus: Invoice.PaymentStatusMapping.Pending,
  };
  if (rzSubscriptionId) {
    selector.rzSubscriptionId = rzSubscriptionId;
  }
  if (rzCustomerId) {
    selector.rzCustomerId = rzCustomerId;
  }

  if(invoiceId) {
    selector._id = invoiceId;
  }

  if(!selector._id && !selector.rzSubscriptionId && !selector.rzCustomerId) {
    RavenLogger.log('Trying to settle unspecific', {...selector});
    throw new Meteor.Error('bad-request', 'No valid selector');
  }

  const invoice = Invoice.find(selector).fetch()[0];

  if (!invoice) {
    RavenLogger.log(`Error settling invoice: Does not exists`, { ...selector, userId: Meteor && typeof Meteor.userId === 'function' && Meteor.userId(), at: new Date() });
    throw new Meteor.Error(`Error settling invoice: Does not exists ${JSON.stringify(selector)}`)
  }

  console.log('Settling invoice', invoice);

  Invoice.update(
    {
      paymentStatus: Invoice.PaymentStatusMapping.Pending,
      rzCustomerId,
      rzSubscriptionId,
    },
    {
      $set: {
        paymentStatus: Invoice.PaymentStatusMapping.Settled,
        paymentId: rzPayment.id,
        paidAmount: rzPayment.amount,
      },
    }
  );

  return invoice._id;
};

InvoiceObj.generateHTML = async (invoiceId) => {
  const invoice = Invoice.find({
    _id: invoiceId
  }).fetch()[0];
  if(!invoice) {
    RavenLogger.log(`Tried to generate html of non existent invoice ${invoiceId}`, {
      user: Meteor.user()
    });
    throw new Meteor.Error('bad-request', 'Invalid invoice id');
  }

  const items = invoice.items.map(item => {
    if(item.networkConfig) {
      // is a node
      return { ...item, uom: 'Time (Hours)', discount: '$ 0.00', cost: `$ ${item.cost}`, duration: `${item.runtime.split('|')[0].trim()}${item.runtime.split('|')[1].trim() === '0 GB extra' ? '' : ' | ' + item.runtime.split('|')[1].trim()}`}
    }
    return item;
  });

  const user = Meteor.user();

  const ejsTemplate = await getEJSTemplate({fileName: "invoice.ejs"})
  const finalHTML = ejsTemplate({
    invoice: {
      _id: invoice._id,
      date: moment(invoice.createdAt).format('DD-MMM-YYYYY'),
      totalAmount: `$ ${invoice.totalAmount}`,
      totalAmountInWords: `${writtenNumber(Math.round(invoice.totalAmount))} dollars and ${writtenNumber(Number(String(invoice.totalAmount).split('.')[1]))} cents only`
    },
    user: {
      name: `${user.profile.firstName} ${user.profile.lastName}`,
      profile: user.profile
    },
    items
  });

  return finalHTML;
}

Meteor.methods({
  generateInvoiceHTML: InvoiceObj.generateHTML
});

export default InvoiceObj;
