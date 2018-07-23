import RazorPay from './payment-gateways/razorpay';


Meteor.methods({
    "capturePaymentRazorPay": RazorPay.capturePayment
});