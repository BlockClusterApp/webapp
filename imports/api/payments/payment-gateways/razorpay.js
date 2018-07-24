import razorpay from 'razorpay';
import Config from '../../../modules/config/server';
import PaymentRequests from '../../../collections/payments/payment-requests';

const debug = require('debug')('Razorpay');

const RazorPayInstance = new razorpay({
  key_id: Config.RazorPay.id,
  key_secret: Config.RazorPay.secret
});

const RazorPay = {};

RazorPay.capturePayment = async paymentResponse => {
  // const url = `https://${Config.RazorPay.id}:${Config.RazorPay.secret}@api.razorpay.com/v1/payments/${paymentId}/capture`
  debug("Razorpay response", paymentResponse)
  try {
    // First update payment status
    const rzpayment = await RazorPayInstance.payments.fetch(paymentResponse.razorpay_payment_id);
    debug("Razorpay payment", rzpayment);
    if(!rzpayment) {
      throw new Error("Invalid razorpay payment id");
    }
    const paymentRequest = PaymentRequests.find({
        _id: rzpayment.notes.paymentRequestId
    }).fetch()[0];

    if(!paymentRequest){
        throw new Error("Invalid payment request id for rzpayment ", paymentResponse);
    }

    PaymentRequests.update({
        _id: rzpayment.notes.paymentRequestId
    }, {
        $set: {
            paymentStatus: PaymentRequests.StausMapping.Approved,
            pgReference: paymentResponse.razorpay_payment_id,
            pgResponse: rzpayment
        }
    });
    const amount = paymentRequest.amount || 100;
    const captureResponse = await RazorPayInstance.payments.capture(
      paymentResponse.razorpay_payment_id,
      amount
    );
    debug("Capture response ", captureResponse);

    PaymentRequests.update({
      _id: rzpayment.notes.paymentRequestId
    }, {
      $set: {
        pgResponse: captureResponse
      }
    });
  } catch (err) {
    // rollback
    debug("Error capturing", err);
    PaymentRequests.update({
        _id: rzpayment.notes.paymentRequestId
    }, {
        $set: {
            paymentStatus: PaymentRequests.StatusMapping.Pending
        }
    })
  }

  return true;
};

/**
 *
 * @param {string} paymentId
 * @param {object} options
 * @property {number} options.amount
 * @property {object} options.notes
 */
RazorPay.refundPayment = async (paymentId, options) => {
  if (!options.amount) {
    throw new Error("Amount not specified for refund");
  }

  const paymentRequest = PaymentRequests.find({
    pgReference: paymentId,
    "pgResponse.status": "captured"
  });

  if(!paymentRequest){
    throw new Error(`Invalid payment Id ${paymentId}`)
  }

  if(!options.amount) {
    options.amount = paymentRequest.amount
  }

  options.notes =  options.notes || {};
  options.notes.reason = options.notes.reason || "Refund from backend";

  try{
    const refundResponse = await RazorPayInstance.payments.refund(
      paymentId,
      options
    );
  }catch(err) {
    // rollback
  }
};

export default RazorPay;
