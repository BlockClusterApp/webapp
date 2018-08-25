import { RZPlan, RZSubscription, RZPayment } from '../../../collections/razorpay';
import UserCards from '../../../collections/payments/user-cards';
import PaymentRequest from '../../../collections/payments/payment-requests';
const debug = require('debug')('bull:razorpay');

const PaymentRequestReverseMap = {
  'authorized': 1,
  'captured': 2,
  'refunded': 3,
  'failed': 4
}

async function getUserFromEmail(email) {
  const user = Meteor.users.find({
    "email.address": email
  }).fetch()[0];

  return user;
}

async function safeUpdateUser(userId, updateObject) {
  delete updateObject.emails;
  delete updateObject.services;
  delete updateObject.createdAt;
  delete updateObject.admin;

  const updateResult = Meteor.users.update({
    _id: userId
  }, {
    $set: updateObject
  });
  return updateResult;
}

async function updateRZPaymentToUser(user, payment) {
  const updateObject = {};
  if(payment.contact) {
    if(!user.profile.mobiles){
      updateObject.profile = {
        mobiles: [
          {
            number: payment.contact,
            verified: true,
            from: 'razorpay'
          }
        ]
      }
    } else if (!(user.profile.mobiles && user.profile.mobiles.map(m => m.number).includes(payment.contact))) {
      updateObject.$push = {
        "profile.mobiles": {
          number: payment.contact,
          verified: true,
          from: 'razorpay'
        }
      }
    }
  }
  if(payment.customer_id && (!user.rzCustomerId || !(user.rzCustomerId && user.rzCustomerId.includes(payment.customer_id)))) {
    if(!updateObject.$push) {
      updateObject.$push = {};
    }
    updateObject.$push.rzCustomerId = payment.customer_id;
  }
  if(Object.keys(updateObject).length > 0) {
    await safeUpdateUser(user._id, updateObject);
  }

  if(payment.card){
    const userCards = UserCards.find({
      userId: user._id,
    }).fetch()[0];
    if(userCards){
      if(userCards.cards && !userCards.cards.map(c => c.id).includes(payment.card.id)) {
        UserCards.update({
          _id: userCards._id
        }, {
          $push: {
            cards: payment.card
          }
        });
      }
    } else {
      UserCards.insert({
        userId: user._id,
        cards: [
          {...payment.card}
        ]
      });
    }
  }

  return true;
}

async function attachPaymentToRequest(payment) {
  if(!payment.notes.paymentRequestId){
    return true;
  }
  const paymentRequest = PaymentRequest.find({
    _id: payment.notes.paymentRequestId
  }).fetch()[0];
  if(!paymentRequest.pgResponse || !(paymentRequest.pgResponse && paymentRequest.pgResponse.map(p => p.id).includes(payment.id))){
    PaymentRequest.update({
      _id: paymentRequest._id
    }, {
      $push: {
        pgResponse: payment
      },
      paymentStatus: PaymentRequestReverseMap[payment.status]
    });
  }
  return true;
}

async function insertOrUpdatePayment(userId, payment) {

  if(payment.notes.paymentRequestId) {
    try{
    await attachPaymentToRequest(payment);
    }catch(err){
      debug('Attaching to Request err', err);
    }
  }

  const rzPaymentCount = RZPayment.find(payment.id).count();
  if(rzPaymentCount > 0) {
    return true;
  }
  RZPayment.insert({
    userId,
    ...payment
  });
  return true;
}

async function insertOrUpdateSubscription(subscription) {

}

const HandlerFunctions = {
  "payments.authorized": async ({data}) => {
    const payment = data.payload.payment.entity;
    const user = await getUserFromEmail(payment.email);
    updateRZPaymentToUser(user, data.payload.payment.entity);
    await insertOrUpdatePayment(user._id, payment);
  },
  "payments.captured": async ({data}) => {
    const payment = data.payload.payment.entity;
    const user = await getUserFromEmail(payment.email);
    updateRZPaymentToUser(user, data.payload.payment.entity);
  },
  "payments.failed": async ({data}) => {
    const payment = data.payload.payment.entity;
    const user = await getUserFromEmail(payment.email);
    insertOrUpdatePayment()
  },
  "subscription.pending": async ({data}) => {

  },
  "subscription.activated": async ({data}) => {

  },
  "subscription.charged": async ({data}) => {

  }
}


module.exports = function(bullSystem) {
  const processFunction = function(job) {
    return new Promise(Meteor.bindEnvironment(async resolve => {
      const data = job.data;
      if(typeof HandlerFunctions[data.event] === "function"){
        await HandlerFunctions[data.event]({data});
      } else {
        console.log("Razorpay webhook not handled", data.event);
      }
      return resolve(true);
    }));
  };

  bullSystem.bullJobs.process('razorpay-webhook', processFunction);
};
