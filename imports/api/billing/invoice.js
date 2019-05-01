import Invoice from '../../collections/payments/invoice';
import PaymentRequest from '../../collections/payments/payment-requests';
import RazorPay from '../../api/payments/payment-gateways/razorpay';
import Payment from '../../api/payments/';
import Email from '../emails/email-sender';
import moment from 'moment';
import fs from 'fs';
import Future from 'fibers/future';
import atob from 'atob';
import pdf from 'html-pdf';
import Bluebird from 'bluebird';

const uuidv4 = require('uuid/v4');

const debug = require('debug')('api:invoice');
import { getEJSTemplate } from '../../modules/helpers/server';
import writtenNumber from 'written-number';
import BullSystem from '../../modules/schedulers/bull';
import { RZPaymentLink } from '../../collections/razorpay';
import RZPTAddon from '../../collections/razorpay/trasient-addon';
import Credits from '../../collections/payments/credits';
import User from '../server-functions/user';
import Communication from '../communication/slack';
import Stripe from '../payments/payment-gateways/stripe';
import StripeCustomer from '../../collections/stripe/customer';
import Payments from '../../api/payments/';
import Config from '../../modules/config/server';

const InvoiceObj = {};

function fetchApplicableAmount(credit, totalAmount) {
  if (!credit.invoices) {
    return Math.min(credit.amount, totalAmount);
  }
  const usedAmount = credit.invoices.reduce((sum, invoice) => Number(sum) + Number(invoice.amount), 0);
  const usableAmount = Math.min(Number(credit.amount) - Number(usedAmount), totalAmount);

  if (usableAmount <= 0) {
    return 0;
  }

  return usableAmount;
}

function fetchEligibleCredits(credits, totalAmount) {
  const result = [];
  let amount = totalAmount;
  credits.forEach(credit => {
    const usableAmount = fetchApplicableAmount(credit, amount);
    if (amount <= 0) {
      return;
    }
    if (usableAmount > 0) {
      result.push({
        credit,
        amount: Number(Number(usableAmount).toFixed(2)),
      });
      amount = amount - usableAmount;
    }
  });
  return { credits: result.filter(r => !!r.amount), remainingAmount: amount };
}

InvoiceObj.fetchCreditsRedemption = async ({ userId, totalAmount, invoiceObject }) => {
  // Credits application
  let eligibleCredits = [];
  const _credits = Credits.find({ userId }, { sort: { createdAt: 1 } }).fetch();
  if (_credits.length > 0) {
    const totalCredits = _credits.reduce((sumTillNow, credit) => sumTillNow + credit.amount, 0);
    if (totalCredits > 0) {
      const { credits, remainingAmount } = fetchEligibleCredits(_credits, totalAmount);
      if (credits.length > 0) {
        totalAmount = remainingAmount;
        if (invoiceObject) {
          invoiceObject.totalAmount = remainingAmount;
        }
        eligibleCredits = credits;
      }
    }
  }

  return { _totalAmount: totalAmount, eligibleCredits };
};

InvoiceObj.generateInvoice = async ({ billingMonth, bill, userId, rzSubscription, stripeCustomer }) => {
  let totalAmount = Number(bill.totalAmount).toFixed(2);
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
    stripeCustomerId: user.stripeCustomerId,
    paymentStatus: user.demoUser ? Invoice.PaymentStatusMapping.DemoUser : user.offlineUser ? Invoice.PaymentStatusMapping.OfflineUser : Invoice.PaymentStatusMapping.Pending,
    billingPeriod: billingMonth,
    billingPeriodLabel: moment(billingMonth).format('MMM-YYYY'),
    billingAmount: totalAmount,
    totalAmount,
  };

  if (rzSubscription && rzSubscription.bc_status === 'active') {
    invoiceObject.rzSubscriptionId = rzSubscription.id;
  }

  if (rzSubscription) {
    const existingInvoice = Invoice.find({
      billingPeriodLabel: invoiceObject.billingPeriodLabel,
      rzSubscriptionId: invoiceObject.rzSubscriptionId,
    }).fetch()[0];
    if (existingInvoice) {
      ElasticLogger.log(`Bill already exists`, { ...invoiceObject });
      return true;
    }
  } else {
    const existingInvoice = Invoice.find({
      billingPeriodLabel: invoiceObject.billingPeriodLabel,
      userId,
    }).fetch()[0];
    if (existingInvoice) {
      ElasticLogger.log(`Bill already exists`, { ...invoiceObject });
      return true;
    }
  }

  // Credits application
  const { _totalAmount, eligibleCredits } = await InvoiceObj.fetchCreditsRedemption({ userId, totalAmount, invoiceObject });

  const items = bill.networks;

  invoiceObject.items = items;

  invoiceObject.dynamos = bill.dynamos;
  invoiceObject.privateHives = bill.privateHives;
  invoiceObject.hyperions = bill.hyperions;
  invoiceObject.paymeters = bill.paymeters;

  const conversion = await Payment.getConversionToINRRate({});

  invoiceObject.conversionRate = conversion;

  const previousInvoices = Invoice.find({ userId, paymentStatus: { $in: [Invoice.PaymentStatusMapping.Pending, Invoice.PaymentStatusMapping.Failed] } }).fetch();

  const previousPendingInvoiceIds = [];
  previousInvoices.forEach(pi => {
    previousPendingInvoiceIds.push(pi._id);
  });

  invoiceObject.previousPendingInvoiceIds = previousPendingInvoiceIds;

  const invoiceId = Invoice.insert(invoiceObject);
  let creditClaims = [];

  totalAmount = _totalAmount;
  invoiceObject.totalAmountINR = Math.max(Math.floor(Number(totalAmount) * 100 * conversion), 0);

  eligibleCredits.forEach(ec => {
    const { credit } = ec;
    const id = Credits.update(
      {
        _id: credit._id,
      },
      {
        $push: {
          invoices: {
            invoiceId,
            amount: ec.amount,
            claimedOn: new Date(),
          },
        },
      }
    );
    creditClaims.push({ id, code: credit.code, amount: ec.amount });
  });

  if (rzSubscription && rzSubscription.bc_status === 'active') {
    await Bluebird.map(
      previousInvoices,
      async pi => {
        RZPTAddon.insert({
          subscriptionId: rzSubscription.id,
          addOn: {
            name: `Pending dues for ${pi.billingPeriodLabel}`,
            description: 'Pending Invoice',
            amount: Number(pi.totalAmountINR),
            currency: 'INR',
          },
          userId,
          invoiceId,
          billingPeriodLabel: invoiceObject.billingPeriodLabel,
          pendingInvoiceId: pi._id,
        });
        return true;
      },
      {
        concurrency: 2,
      }
    );
  }

  if (!user.demoUser && !user.offlineUser && Math.round(invoiceObject.totalAmountINR) > 100 && rzSubscription && rzSubscription.bc_status === 'active') {
    RZPTAddon.insert({
      subscriptionId: rzSubscription.id,
      addOn: {
        name: `Bill for ${moment(billingMonth).format('MMM-YYYY')}`,
        description: `Platform Charges`,
        amount: Math.floor(Number(totalAmount) * 100 * conversion - 100), // Since we are already charging Rs 1 for subscription so deduct Rs 1 from final here
        currency: 'INR',
      },
      userId,
      invoiceId,
      billingPeriodLabel: invoiceObject.billingPeriodLabel,
    });
  }

  if (Number(invoiceObject.totalAmountINR) <= 0) {
    Invoice.update(
      {
        _id: invoiceId,
      },
      {
        $set: {
          paymentStatus: Invoice.PaymentStatusMapping.Settled,
        },
      }
    );
    return true;
  }

  if (!stripeCustomer) {
    const linkId = await RazorPay.createPaymentLink({
      amount: invoiceObject.totalAmountINR,
      description: `Bill for ${invoiceObject.billingPeriodLabel}`,
      user,
    });

    const rzPaymentLink = RZPaymentLink.find({
      _id: linkId,
    }).fetch()[0];
    debug('RZPaymentLink', rzPaymentLink);

    Invoice.update(
      { _id: invoiceId },
      {
        $set: {
          paymentLink: {
            id: rzPaymentLink ? rzPaymentLink._id : '',
            link: rzPaymentLink ? rzPaymentLink.short_url : '',
          },
          totalAmountINR: invoiceObject.totalAmountINR,
          totalAmount,
          creditClaims,
        },
      }
    );
  } else {
    const request = await Payments.createRequest({
      paymentGateway: 'stripe',
      reason: `Platform usage charges for ${invoiceObject.billingPeriodLabel}`,
      amount: totalAmount,
      userId: invoiceObject.userId,
    });
    Invoice.update(
      { _id: invoiceId },
      {
        $set: {
          paymentLink: {
            id: `stripe_${request.paymentRequestId}`,
            link: `${Config.apiHost.replace(':3000/', ':3000')}/payments/collect/${request.paymentRequestId}`,
          },
          totalAmountINR: invoiceObject.totalAmountINR,
          totalAmount,
          creditClaims,
        },
      }
    );
  }

  BullSystem.addJob('invoice-created-email', {
    invoiceId,
  });

  return invoiceId;
};

InvoiceObj.settleInvoice = async ({ rzSubscriptionId, rzCustomerId, billingMonth, billingMonthLabel, invoiceId, rzPayment, stripePayment }) => {
  const spanId = uuidv4();
  billingMonthLabel = billingMonthLabel || moment(billingMonth).format('MMM-YYYY');

  let selector = {
    paymentStatus: {
      $in: [Invoice.PaymentStatusMapping.Pending, Invoice.PaymentStatusMapping.Settled],
    },
    billingPeriodLabel: billingMonthLabel,
  };
  if (rzSubscriptionId) {
    selector.rzSubscriptionId = rzSubscriptionId;
  }

  if (invoiceId) {
    selector = {
      _id: invoiceId,
    };
  }

  ElasticLogger.log('Trying to settle invoice', { selector, billingMonth, billingMonthLabel, rzPayment, stripePayment, id: spanId });

  if (!selector._id && !selector.rzSubscriptionId && !selector.rzCustomerId && !selector._id) {
    RavenLogger.log('Trying to settle unspecific', { ...selector });
    throw new Meteor.Error('bad-request', 'No valid selector');
  }

  const invoice = Invoice.find(selector).fetch()[0];

  if (!invoice) {
    Communication.sendNotification({
      type: 'refund-required',
      message: `Refund required for payment ${rzPayment.id}. Reason: Invoice does not exists \n\nDetails:\n${JSON.stringify(
        {
          invoiceId,
          rzPaymentId: rzPayment.id,
          id: spanId,
        },
        null,
        2
      )}`,
    });
    // await RazorPay.refundPayment(rzPayment.id, { noPaymentRequest: true, amount: rzPayment.amount });
    ElasticLogger.log('Refunded not existing invoice', {
      invoiceId,
      paymentId: rzPayment ? rzPayment.id : stripePayment ? stripePayment.id : null,
      id: spanId,
    });
    RavenLogger.log(`Error settling invoice: Does not exists`, { ...selector, at: new Date() });
    return true;
  }

  if (invoice.paymentStatus === Invoice.PaymentStatusMapping.Settled || invoice.paymentStatus === Invoice.PaymentStatusMapping.OfflineUser) {
    ElasticLogger.log('Invoice already settled', {
      invoiceId: invoice._id,
      id: spanId,
      status: invoice.paymentStatus,
    });
    return invoice._id;
  }

  if ([Invoice.PaymentStatusMapping.WaivedOff].includes(invoice.paymentStatus) || invoice.totalAmount <= 0) {
    Communication.sendNotification({
      type: 'refund-required',
      message: `Refund required for payment ${rzPayment.id}. Reason: Invoice already waivedOff. \n\nDetails:\n${JSON.stringify(
        {
          invoiceId,
          rzPaymentId: rzPayment.id,
          id: spanId,
        },
        null,
        2
      )}`,
    });
    // await RazorPay.refundPayment(rzPayment.id, { noPaymentRequest: true, amount: rzPayment.amount });
    ElasticLogger.log('Refunded waived off invoice', {
      invoiceId,
      rzPaymentId: rzPayment.id,
      id: spanId,
    });
    return invoice._id;
  }

  const payment = (() => {
    if (rzPayment) {
      return { id: rzPayment.id, source: 'razorpay', amount: rzPayment.amount, currency: 'INR' };
    }
    if (stripePayment) {
      return { id: stripePayment.id, source: 'stripe', amount: stripePayment.amount, currency: 'USD' };
    }
    return {};
  })();

  Invoice.update(selector, {
    $set: {
      paymentStatus: Invoice.PaymentStatusMapping.Settled,
      payment,
    },
    $unset: {
      paymentPending: '',
      paymentPendingForInvoiceId: '',
      paymentPendingOn: '',
    },
  });

  if (invoice.previousPendingInvoiceIds && invoice.previousPendingInvoiceIds.length > 0 && rzPayment) {
    await Bluebird.map(
      invoice.previousPendingInvoiceIds,
      async pid => {
        Invoice.update(
          { _id: pid },
          {
            $set: {
              paymentStatus: Invoice.PaymentStatusMapping.Settled,
              paymentId: rzPayment.id,
              paidAmount: rzPayment.amount,
            },
            $unset: {
              paymentPending: '',
              paymentPendingForInvoiceId: '',
              paymentPendingOn: '',
            },
          }
        );
        return true;
      },
      {
        concurrency: 2,
      }
    );
  } else {
    invoice.previousPendingInvoiceIds = [];
  }

  ElasticLogger.log('Settled invoice', { invoiceId: invoice._id, id: spanId });

  try {
    Invoice.update(
      {
        _id: { $in: [invoice._id, ...invoice.previousPendingInvoiceIds] },
        'paymentFailedStatus.status': {
          $in: ['failed-warning'],
        },
        'paymentFailedStatus.status': {
          $nin: ['payment-made'],
        },
      },
      {
        $push: {
          paymentFailedStatus: {
            status: 'payment-made',
            on: new Date(),
          },
        },
      },
      {
        multi: true,
      }
    );

    await User.enableFunctions({ userId: invoice.userId });
    ElasticLogger.log('Enabling user', { invoiceId: invoice._id, id: spanId });
  } catch (err) {
    RavenLogger.log(err);
  }

  return invoice._id;
};

InvoiceObj.generateHTML = async invoiceId => {
  const invoice = Invoice.find({
    _id: invoiceId,
  }).fetch()[0];
  if (!invoice) {
    RavenLogger.log(`Tried to generate html of non existent invoice ${invoiceId}`, {
      user: Meteor.user(),
    });
    throw new Meteor.Error('bad-request', 'Invalid invoice id');
  }

  const items = invoice.items.map(item => {
    if (item.networkConfig) {
      // is a node
      return {
        ...item,
        uom: 'Time (Hours)',
        discount: '$ 0.00',
        cost: `$ ${item.cost}`,
        discount: `$ ${Number(item.discount || 0).toFixed(2)}`,
        duration: `${item.runtime && item.runtime.split('|')[0].trim()}${item.runtime.split('|')[1].trim() === '0 GB extra' ? '' : ' | ' + item.runtime.split('|')[1].trim()}`,
      };
    } else {
      return {
        ...item,
        cost: `$ ${item.cost}`,
        discount: `$ ${Number(item.discount || 0).toFixed(2)}`,
      };
    }
  });

  if (invoice.creditClaims) {
    invoice.creditClaims.forEach(claim => {
      items.push({
        name: 'Promotional Credits Redemption',
        instanceId: claim.code === 'BLOCKCLUSTER' ? 'Welcome Bonus' : claim.code,
        duration: '',
        rate: '',
        discount: '',
        cost: `$ -${claim.amount}`,
      });
    });
  }

  const user = Meteor.user();

  if (!user.profile.mobiles) {
    user.profile.mobiles = [
      {
        number: '',
      },
    ];
  }

  const ejsTemplate = await getEJSTemplate({ fileName: 'invoice.ejs' });
  const finalHTML = ejsTemplate({
    invoice: {
      _id: invoice._id,
      date: moment(invoice.createdAt).format('DD-MMM-YYYYY'),
      totalAmount: `$ ${invoice.totalAmount}`,
      totalAmountInWords: `${writtenNumber(Math.round(invoice.totalAmount))} dollars and ${writtenNumber(Number(String(invoice.totalAmount).split('.')[1]))} cents only`,
    },
    user: {
      name: `${user.profile.firstName} ${user.profile.lastName}`,
      profile: user.profile,
    },
    items,
  });
  var fut = new Future();

  var fileName = `blockcluster-bill-report-${invoiceId}.pdf`;

  var options = {
    //renderDelay: 2000,
    paperSize: {
      format: 'Letter',
      orientation: 'portrait',
      margin: '1cm',
    },
    siteType: 'html',
  };

  // Commence Webshot
  // console.log("Commencing webshot...");

  pdf
    .create(finalHTML, {
      format: 'Tabloid',
      orientation: 'landscape',
      timeout: '100000',
      border: {
        top: '0.5in', // default is 0, units: mm, cm, in, px
        right: '0in',
        bottom: '0.5in',
        left: '0in',
      },
    })
    .toFile(fileName, function(err, res) {
      if (err) return console.log(err);
      console.log(res);
      fs.readFile(fileName, function(err, data) {
        if (err) {
          return console.log(err);
        }

        fs.unlink(fileName);
        fut.return(data);
      });
    });
  // webshot(finalHTML, fileName, options, function(error,success) {
  //   if(error){
  //     return console.log(error);
  //   }
  //   console.log(success);
  //     fs.readFile(fileName, function (err, data) {
  //         if (err) {
  //             return console.log(err);
  //         }

  //         fs.unlinkSync(fileName);
  //         fut.return(data);

  //     });
  // });

  let pdfData = fut.wait();
  let base64String = new Buffer(pdfData).toString('base64');
  return base64String;
  // return base64ToUint8Array(base64String);
};

function base64ToUint8Array(base64) {
  var raw = atob(base64);
  var uint8Array = new Uint8Array(raw.length);
  for (var i = 0; i < raw.length; i++) {
    uint8Array[i] = raw.charCodeAt(i);
  }
  return uint8Array;
}

InvoiceObj.sendInvoiceCreatedEmail = async invoice => {
  if (invoice.totalAmountINR <= 0) {
    ElasticLogger.log('Zero amount invoice. Not sending created email', { invoice });
    return true;
  }

  const ejsTemplate = await getEJSTemplate({ fileName: 'invoice-created.ejs' });
  const finalHTML = ejsTemplate({
    invoice,
    paymentLink: invoice.paymentLink ? invoice.paymentLink.link : 'https://app.blockcluster.io/app/payments/cards',
  });

  const emailProps = {
    from: { email: 'no-reply@blockcluster.io', name: 'Blockcluster' },
    to: invoice.user.email,
    subject: `Your invoice for ${invoice.billingPeriodLabel}`,
    text: `Visit the following link to pay your bill https://app.blockcluster.io/app/payments`,
    html: finalHTML,
  };

  await Email.sendEmail(emailProps);
  Invoice.update(
    {
      _id: invoice._id,
    },
    {
      $push: {
        emailsSent: Invoice.EmailMapping.Created,
      },
    }
  );

  return true;
};

InvoiceObj.sendInvoicePending = async (invoice, reminderCode) => {
  ElasticLogger.log('Sending reminder invoice', { invoiceId: invoice._id, user: invoice.user.email, reminderCode });

  const ejsTemplate = await getEJSTemplate({ fileName: 'invoice-pending.ejs' });
  const finalHTML = ejsTemplate({
    invoice,
    paymentLink: invoice.paymentLink.link,
  });

  const emailProps = {
    from: { email: 'no-reply@blockcluster.io', name: 'Blockcluster' },
    to: invoice.user.email,
    subject: `IMP: Your invoice for ${invoice.billingPeriodLabel} is Pending`,
    text: `Visit the following link to pay your bill https://app.blockcluster.io/app/payments`,
    html: finalHTML,
  };

  await Email.sendEmail(emailProps);
  Invoice.update(
    {
      _id: invoice._id,
    },
    {
      $push: {
        emailsSent: { reminderCode, at: new Date() },
      },
    }
  );

  return true;
};

InvoiceObj.adminSendInvoiceReminder = async invoiceId => {
  if (Meteor.user().admin < 2) {
    throw new Meteor.Error('bad-request', 'Unauthorized');
  }
  const invoice = Invoice.find({ _id: invoiceId }).fetch()[0];

  if (!invoice) {
    throw new Meteor.Error('bad-request', 'Invoice not found' + invoiceId);
  }

  if (invoice.paymentStatus === 2) {
    throw new Meteor.Error('bad-request', 'Invoice already paid');
  }

  ElasticLogger.log('Admin sending invoice reminder', { invoiceId, user: Meteor.userId() });
  return InvoiceObj.sendInvoicePending(invoice, Invoice.EmailMapping.Reminder2);
};

InvoiceObj.waiveOffInvoice = async ({ invoiceId, reason, userId, user }) => {
  user = user || Meteor.user();
  if (!(user && user.admin >= 2)) {
    throw new Meteor.Error('Unauthorized', 'Unauthorized');
  }

  if (!(reason && reason.length > 5)) {
    throw new Meteor.Error('bad-request', 'Reason should be atleast 5 characters');
  }

  if (!(invoiceId && reason && user)) {
    throw new Meteor.Error('bad-request', 'Cannot waive off with incomplete details');
  }

  const invoice = Invoice.find({ _id: invoiceId }).fetch()[0];

  if (!invoice) {
    throw new Meteor.Error('Invalid invoice id');
  }

  ElasticLogger.log('Invoice waive off', { invoice, reason, userId });

  Invoice.update(
    {
      _id: invoiceId,
    },
    {
      $set: {
        paymentStatus: Invoice.PaymentStatusMapping.WaivedOff,
        waiveOff: {
          reason,
          by: user._id,
          byEmail: user.emails[0].address,
        },
      },
    }
  );

  if (invoice.paymentLink && invoice.paymentLink.link) {
    await RazorPay.cancelPaymentLink({ paymentLinkId: invoice.paymentLink.id, reason: `Invoice ${invoice._id} waived off`, userId });
  }

  return true;
};

InvoiceObj.changeToOfflinePayment = async ({ invoiceId }) => {
  const user = Meteor.user();
  if (!(user && user.admin >= 2)) {
    throw new Meteor.Error('Unauthorized', 'Unauthorized');
  }

  const invoice = Invoice.find({ _id: invoiceId }).fetch()[0];

  if ([Invoice.PaymentStatusMapping.Paid, Invoice.PaymentStatusMapping.Refunded, Invoice.PaymentStatusMapping.OfflineUser].includes(invoice.paymentStatus)) {
    throw new Meteor.Error('bad-request', 'Cannot make paid/refunded/offline invoice offline');
  }

  ElasticLogger.log('Changing invoice to Offline payment', { invoiceId, user: { email: user.emails[0].address, _id: user._id } });

  Invoice.update(
    {
      _id: invoiceId,
    },
    {
      $set: {
        paymentStatus: Invoice.PaymentStatusMapping.OfflineUser,
        offlinePaymentMarkedBy: user._id,
        offlinePaymentMarkedAt: new Date(),
      },
    }
  );

  return true;
};

InvoiceObj.adminChargeStripeInvoice = async ({ invoiceId, adminUserId }) => {
  if (!adminUserId && Meteor.user().admin < 2) {
    throw new Meteor.Error(401, 'Unauthorized');
  }
  const invoice = Invoice.find({ _id: invoiceId }).fetch()[0];
  const stripeCustomer = StripeCustomer.find({ userId: invoice.userId }).fetch()[0];
  if (!invoice) {
    throw new Meteor.Error(403, 'Invalid invoiceid');
  }

  if (!invoice.stripeCustomerId || !stripeCustomer) {
    throw new Meteor.Error(403, 'Cannot charge this invoice');
  }

  if (![Invoice.PaymentStatusMapping.Pending, Invoice.PaymentStatusMapping.Failed].includes(invoice.paymentStatus)) {
    throw new Meteor.Error(403, 'Bad request');
  }

  const paymentRequest = await Payment.createRequest({
    paymentGateway: 'stripe',
    reason: `Platform usage charges for ${invoice.billingPeriodLabel}`,
    amount: Number(invoice.totalAmount),
    userId: invoice.userId,
    metadata: {
      from: 'admin',
      by: adminUserId || Meteor.userId(),
      invoiceId: invoice._id,
    },
  });
  try {
    const response = await Stripe.chargeCustomer({
      customerId: stripeCustomer.id,
      amountInDollars: invoice.totalAmount,
      description: `Platform usage charges for ${invoice.billingPeriodLabel}`,
      idempotencyKey: `${invoiceId}_${invoice.userId}${process.env.NODE_ENV === 'development' ? `${new Date().getTime()}` : ''}`,
      userId: invoice.userId,
    });
    await InvoiceObj.settleInvoice({ billingMonthLabel: invoice.billingPeriodLabel, invoiceId: invoice._id });
    ElasticLogger.log(adminUserId ? 'System Charge Stripe' : 'Admin charge invoice', {
      response,
      invoiceId,
      paymentRequest,
    });
    PaymentRequest.update(
      {
        _id: paymentRequest.paymentRequestId,
      },
      {
        $push: {
          pgResponse: response,
        },
        $set: {
          status: PaymentRequest.StatusMapping.Approved,
          paymentStatus: PaymentRequest.StatusMapping.Approved,
        },
      }
    );
  } catch (err) {
    ElasticLogger.log(adminUserId ? 'System Charge Stripe' : 'Admin charge invoice', {
      error: err.toString(),
      invoiceId,
      paymentRequest,
    });

    PaymentRequest.update(
      {
        _id: paymentRequest.paymentRequestId,
      },
      {
        $set: {
          paymentStatus: PaymentRequest.StatusMapping.Failed,
          failedReason: err.toString().replace('Error: ', ''),
        },
      }
    );
    throw new Meteor.Error(403, err.toString());
  }

  return true;
};

Meteor.methods({
  generateInvoiceHTML: InvoiceObj.generateHTML,
  sendInvoiceReminder: InvoiceObj.adminSendInvoiceReminder,
  waiveOffInvoice: InvoiceObj.waiveOffInvoice,
  changeToOfflinePayment: InvoiceObj.changeToOfflinePayment,
  adminChargeStripeInvoice: async ({ invoiceId }) => InvoiceObj.adminChargeStripeInvoice({ invoiceId }),
});

export default InvoiceObj;
