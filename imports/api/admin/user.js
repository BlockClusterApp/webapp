import { Networks } from '../../collections/networks/networks';
import UserCards from '../../collections/payments/user-cards';
import {UserInvitation} from '../../collections/user-invitation';
import PaymentRequests from '../../collections/payments/payment-requests';
import Voucher from '../../collections/vouchers/voucher';
import Billing from '../billing';
import Bluebird from 'bluebird';

const User = {};
const ADMIN_LEVEL = 0;

User.fetchAdminDashboardDetails = async (userId) => {
  if(Meteor.user().admin <= ADMIN_LEVEL) {
    return reject(new Meteor.Error("Unauthorized"));
  }
  const result = await Bluebird.props({
    details: Meteor.users.find({_id: userId}, {fields: {services: 0}}).fetch()[0],
    networks : Networks.find({user: userId}).fetch(),
    invitations : UserInvitation.find({inviteFrom: userId}).fetch(),
    cards : UserCards.find({userId}).fetch(),
    payments : PaymentRequests.find({userId}).fetch(),
    vouchers : Voucher.find({claimedBy: userId}).fetch(),
    bill : Billing.generateBill(userId)
  })

  return result;
};

User.updateAdmin = async (userId, updateQuery) => {
  if(Meteor.userId() === userId || Meteor.user().admin <= ADMIN_LEVEL) {
    return false;
  }
  console.log("Updating admin for", userId, updateQuery);
  Meteor.users.update({
    _id: userId
  }, {
    $set: {
      admin: updateQuery.admin
    }
  });
  return true;
}

Meteor.methods({
  fetchAdminDashboardDetails: User.fetchAdminDashboardDetails,
  updateUserAdmin: User.updateAdmin
});

export default User;
