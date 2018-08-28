import PaymentRequests from "../payment-requests"
import RZPayment from '../../razorpay/payments';
import UserCards from '../user-cards';

Meteor.publish("userPayments", function () {
	return [PaymentRequests.find({userId: Meteor.userId()}, {
    fields: {
      pgReference: 0
    }
  }), RZPayment.find({
    userId: Meteor.userId()
  })];
});

Meteor.publish("userCards", function() {
  return UserCards.find({userId: Meteor.userId()});
});
