import RazorPay from './payment-gateways/razorpay';


Meteor.methods({
    "capturePaymentRazorPay": (response) => {
        throw new Error("Need to implement capture payment");
    }
});