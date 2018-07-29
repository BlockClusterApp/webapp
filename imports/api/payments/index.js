import RazorPay from './payment-gateways/razorpay';
import PaymentRequests from '../../collections/payments/payment-requests';

const Payments = {};

Payments.createRequest = async ({paymentGateway, reason, amount}) => {
  const insertResult =  PaymentRequests.insert({
    userId: Meteor.userId(),
    paymentGateway,
    reason,
    amount
  });
  return insertResult;
};

Meteor.methods({
    capturePaymentRazorPay: RazorPay.capturePayment,
    applyRZCardVerification: RazorPay.applyCardVerification,
    createPaymentRequest: Payments.createRequest
});
