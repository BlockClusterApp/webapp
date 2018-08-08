import { Networks } from '../../collections/networks/networks';
import UserCards from '../../collections/payments/user-cards';
import {UserInvitation} from '../../collections/user-invitation';
import PaymentRequests from '../../collections/payments/payment-requests';
import Voucher from '../../collections/vouchers/voucher';
import Billing from '../billing';
import Bluebird from 'bluebird';

const User = {};

User.fetchAdminDashboardDetails = async (userId) => {
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

Meteor.methods({
  fetchAdminDashboardDetails: User.fetchAdminDashboardDetails
});

export default User;
