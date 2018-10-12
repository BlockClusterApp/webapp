import Invoice from '../../collections/payments/invoice';
import RazorPay from '../../api/payments/payment-gateways/razorpay';
import Payment from '../../api/payments/';
import Email from '../emails/email-sender';
import moment from 'moment';

const uuidv4 = require('uuid/v4');

const debug = require('debug')('api:invoice');
import {
  getEJSTemplate
} from "../../modules/helpers/server";
import writtenNumber from 'written-number'
import BullSystem from '../../modules/schedulers/bull';
import { RZPaymentLink } from '../../collections/razorpay';

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

  const linkId = await RazorPay.createPaymentLink({
    amount: invoiceObject.totalAmountINR,
    description: `Bill for ${invoiceObject.billingPeriodLabel}`,
    user
  });

  const rzPaymentLink = RZPaymentLink.find({
    _id: linkId
  }).fetch()[0];

  debug('RZPaymentLink', rzPaymentLink);

  Invoice.update({_id: invoiceId}, {
    $set: {
      paymentLink: {
        id: rzPaymentLink._id,
        link: rzPaymentLink.short_url
      }
    }
  });

  BullSystem.addJob('invoice-created-email', {
    invoiceId
  });

  return invoiceId;
};

InvoiceObj.settleInvoice = async ({ rzSubscriptionId, rzCustomerId, billingMonth, billingMonthLabel, invoiceId, rzPayment }) => {
  const spanId = uuidv4();
  billingMonthLabel = billingMonthLabel || moment(billingMonth).format('MMM-YYYY');


  let selector = {
    paymentStatus: Invoice.PaymentStatusMapping.Pending,
  };
  if (rzSubscriptionId) {
    selector.rzSubscriptionId = rzSubscriptionId;
  }
  if (rzCustomerId) {
    selector.rzCustomerId = rzCustomerId;
  }

  if(invoiceId) {
    selector = {
      _id : invoiceId
    }
  }


  ElasticLogger.log('Trying to settle invoice', {selector, billingMonth, billingMonthLabel, rzPayment, id: spanId},);

  if(!selector._id && !selector.rzSubscriptionId && !selector.rzCustomerId && !selector._id) {
    RavenLogger.log('Trying to settle unspecific', {...selector});
    throw new Meteor.Error('bad-request', 'No valid selector');
  }

  const invoice = Invoice.find(selector).fetch()[0];

  if (!invoice) {
    RavenLogger.log(`Error settling invoice: Does not exists`, { ...selector, at: new Date() });
    throw new Meteor.Error(`Error settling invoice: Does not exists ${JSON.stringify(selector)}`)
  }

  Invoice.update(
    selector,
    {
      $set: {
        paymentStatus: Invoice.PaymentStatusMapping.Settled,
        paymentId: rzPayment.id,
        paidAmount: rzPayment.amount,
      },
    }
  );

  ElasticLogger.log('Settled invoice', {invoiceId: invoice._id, id: spanId});

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

  if(!user.profile.mobiles) {
    user.profile.mobiles = [
      {
        number: ''
      }
    ]
  }

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

InvoiceObj.sendInvoiceCreatedEmail = async (invoice) => {

  const user = Meteor.users.find({_id: invoice.userId}).fetch()[0];


  const ejsTemplate = await getEJSTemplate({fileName: "invoice-created.ejs"});
  const finalHTML = ejsTemplate({
    invoice,
    paymentLink: invoice.paymentLink.link
  });

  const emailProps = {
    from: {email: "no-reply@blockcluster.io", name: "Blockcluster"},
    to: invoice.user.email,
    subject: `Your invoice for ${invoice.billingPeriodLabel}`,
    text: `Visit the following link to pay your bill https://app.blockcluster.io/app/payments`,
    html: finalHTML
  };

  await Email.sendEmail(emailProps);
  Invoice.update({
    _id: invoice._id
  }, {
    $push: {
      emailsSent: Invoice.EmailMapping.Created
    }
  });

  return true;
}


InvoiceObj.sendInvoicePending = async (invoice, reminderCode) => {

  ElasticLogger.log("Sending reminder invoice", {invoiceId: invoice._id, user: invoice.user.email, reminderCode});

  const ejsTemplate = await getEJSTemplate({fileName: "invoice-pending.ejs"});
  const finalHTML = ejsTemplate({
    invoice,
    paymentLink: invoice.paymentLink.link
  });

  const emailProps = {
    from: {email: "no-reply@blockcluster.io", name: "Blockcluster"},
    to: invoice.user.email,
    subject: `IMP: Your invoice for ${invoice.billingPeriodLabel} is Pending`,
    text: `Visit the following link to pay your bill https://app.blockcluster.io/app/payments`,
    html: finalHTML
  };

  await Email.sendEmail(emailProps);
  Invoice.update({
    _id: invoice._id
  }, {
    $push: {
      emailsSent: reminderCode
    }
  });

  return true;
}

InvoiceObj.adminSendInvoiceReminder = async (invoiceId) => {
  if(Meteor.user().admin < 2) {
    throw new Meteor.Error('bad-request', "Unauthorized");
  }
  const invoice = Invoice.find({_id: invoiceId}).fetch()[0];

  if(!invoice) {
    throw new Meteor.Error('bad-request', "Invoice not found"+invoiceId);
  }

  if(invoice.paymentStatus === 2) {
    throw new Meteor.Error('bad-request', 'Invoice already paid');
  }

  ElasticLogger.log("Admin sending invoice reminder", {invoiceId, user: Meteor.userId()});
  return InvoiceObj.sendInvoicePending(invoice, Invoice.EmailMapping.Reminder2);
}

Meteor.methods({
  generateInvoiceHTML: InvoiceObj.generateHTML,
  sendInvoiceReminder: InvoiceObj.adminSendInvoiceReminder
});

export default InvoiceObj;
