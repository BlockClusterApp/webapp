import razorpay from "razorpay";
import Config from "../../../modules/config/server";
import UserCards from "../../../collections/payments/user-cards";
import PaymentRequests from "../../../collections/payments/payment-requests";
import request from "request";
import { resolve } from "dns";

const debug = require("debug")("Razorpay");

const RazorPayInstance = new razorpay({
  key_id: Config.RazorPay.id,
  key_secret: Config.RazorPay.secret
});

const RazorPay = {};

const RZ_URL = `https://${Config.RazorPay.id}:${
  Config.RazorPay.secret
}@api.razorpay.com`;

RazorPay.capturePayment = async paymentResponse => {
  let rzpayment = { notes: {} };
  debug("Razorpay response", paymentResponse);
  try {
    // First update payment status
    rzpayment = await RazorPayInstance.payments.fetch(
      paymentResponse.razorpay_payment_id
    );
    debug("Razorpay payment", rzpayment);
    if (!rzpayment) {
      throw new Error("Invalid razorpay payment id");
    }
    const paymentRequest = PaymentRequests.find({
      _id: rzpayment.notes.paymentRequestId
    }).fetch()[0];

    if (!paymentRequest) {
      throw new Error(
        "Invalid payment request id for rzpayment ",
        paymentResponse
      );
    }

    PaymentRequests.update(
      {
        _id: rzpayment.notes.paymentRequestId
      },
      {
        $set: {
          paymentStatus: PaymentRequests.StatusMapping.Approved,
          pgReference: paymentResponse.razorpay_payment_id,
        },
        $push: {
          pgResponse: rzpayment
        }
      }
    );
    const amount = paymentRequest.amount || 100;
    const captureResponse = await RazorPayInstance.payments.capture(
      paymentResponse.razorpay_payment_id,
      amount
    );
    debug("Capture response ", captureResponse);

    PaymentRequests.update(
      {
        _id: rzpayment.notes.paymentRequestId
      },
      {
        $push: {
          pgResponse: captureResponse
        }
      }
    );
  } catch (err) {
    // rollback
    debug("Error capturing", err);
    PaymentRequests.update(
      {
        _id: rzpayment.notes.paymentRequestId
      },
      {
        $set: {
          paymentStatus: PaymentRequests.StatusMapping.Pending
        }
      }
    );
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

  if (!paymentRequest) {
    throw new Error(`Invalid payment Id ${paymentId}`);
  }

  if (!options.amount) {
    options.amount = paymentRequest.amount;
  }

  options.notes = options.notes || {};
  options.notes.reason = options.notes.reason || "Refund from backend";

  try {
    const refundResponse = await RazorPayInstance.payments.refund(
      paymentId,
      options
    );
    debug("refund response ", refundResponse);

    const updateResult = PaymentRequests.update(
      {
        pgReference: paymentId
      },
      {
        $set: {
          paymentStatus: PaymentRequests.StatusMapping.Refunded,
          refundedAt: new Date()
        },
        $push: {
          pgResponse: refundResponse
        }
      }
    );

    debug("Refund updated", updateResult)

    return updateResult;
  } catch (err) {
    debug("Refund error", err);
    // rollback
  }
};

RazorPay.fetchCard = paymentId => {
  return new Promise((resolve, reject) => {
    request.get(`${RZ_URL}/v1/payments/${paymentId}/card`, (err, res, body) => {
      if (err) {
        return reject(err);
      }
      resolve(JSON.parse(body));
    });
  });
};

RazorPay.applyCardVerification = async paymentId => {
  debug("Applying card verification");
  try {
    const rzpayment = await RazorPayInstance.payments.fetch(paymentId);
    await RazorPay.refundPayment(paymentId, {
      amount: rzpayment.amount,
      notes: { reason: "Refund for card verification" }
    });
    const cardUsed = await RazorPay.fetchCard(paymentId);
    debug("Card used", cardUsed);
    if (!cardUsed) {
      return new Meteor.Error("Payment method was not card");
    }

    if (cardUsed.error) {
      return new Meteor.Error("Payment method was not card");
    }

    UserCards.update(
      {
        userId: Meteor.userId()
      },
      {
        $push: {
          cards: cardUsed
        },
        $set: {
          updatedAt: new Date()
        }
      },
      {
        upsert: true
      }
    );

    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};

Meteor.methods({
  getRazorPayId: async () => {
    return Config.RazorPay.id
  }
});

export default RazorPay;
