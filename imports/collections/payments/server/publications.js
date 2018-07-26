import PaymentRequests from "../payment-requests"
import UserCards from '../user-cards';

Meteor.publish("approvedPayments", function () {
	return PaymentRequests.find({userId: Meteor.userId()});
});

Meteor.publish("userCards", function() {
  return UserCards.find({userId: Meteor.userId()});
});
