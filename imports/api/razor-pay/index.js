import razorpay from 'razorpay';
import Config from '../../modules/config/server';

const RazorPayInstance = new razorpay({
    key_id: Config.RazorPay.id,
    key_secret: Config.RazorPay.secret
});

const RazorPay = {};

RazorPay.capturePayment = async () => {

};

RazorPay.refundPayment = async () => {

}

RazorPay.requestPayment = async () => {

}

export default RazorPay;