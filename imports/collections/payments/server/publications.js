import PaymentRequests from "../payment-requests"
import UserCards from '../user-cards';

Meteor.publish("userPayments", function () {
	return PaymentRequests.find({userId: Meteor.userId()}, {
    fields: {
      pgResponse: 0,
      pgReference: 0
    }
  });
});

Meteor.publish("userCards", function() {
  return UserCards.find({userId: Meteor.userId()});
});
