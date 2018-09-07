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
    bill : Billing.generateBill(userId)
  })

  return result;
};

User.updateAdmin = async (userId, updateQuery) => {
  if((Meteor.userId() === userId && updateQuery.admin !== undefined) || Meteor.user().admin <= ADMIN_LEVEL) {
    return false;
  }
  const update = {};
  if(updateQuery.admin !== undefined) {
    update.admin = updateQuery.admin
  }
  if(updateQuery.demo !== undefined) {
    update.demoUser = updateQuery.demo;
  }
  console.log("Updating admin for", userId, updateQuery);
  Meteor.users.update({
    _id: userId
  }, {
    $set: update
  });
  return true;
}

Meteor.methods({
  fetchAdminDashboardDetails: User.fetchAdminDashboardDetails,
  updateUserAdmin: User.updateAdmin
});

export default User;
