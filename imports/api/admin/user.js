import { Networks } from '../../collections/networks/networks';
import UserCards from '../../collections/payments/user-cards';
import {UserInvitation} from '../../collections/user-invitation';
import PaymentRequests from '../../collections/payments/payment-requests';
import Voucher from '../../collections/vouchers/voucher';
import Billing from '../billing';

const User = {};

User.fetchAdminDashboardDetails = async (userId) => {
  const result = {};
  result.details = Meteor.users.find({_id: userId}).fetch()[0];
  result.networks = Networks.find({user: userId}).fetch();
  result.invitations = UserInvitation.find({inviteFrom: userId}).fetch();
  result.cards = UserCards.find({userId}).fetch();
  result.payments = PaymentRequests.find({userId}).fetch();
  result.vouchers = Voucher.find({claimedBy: userId}).fetch();
  result.bill = await Billing.generateBill(userId);

  return result;
};

Meteor.methods({
  fetchAdminDashboardDetails: User.fetchAdminDashboardDetails
});

export default User;
