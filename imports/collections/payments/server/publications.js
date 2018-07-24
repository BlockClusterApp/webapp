import PaymentRequests from "../payment-requests"

Meteor.publish("approvedPayments", function (instanceId) {
	return PaymentRequests.find({userId: Meteor.userId()});
});
