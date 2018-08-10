import { Networks } from '../../../collections/networks/networks';
import UserCards from '../../../collections/payments/user-cards';
import Email from "../../../api/emails/email-sender";
import moment from 'moment';
import {
  getEJSTemplate
} from "../../helpers/server";

async function fetchUsersWithVouchers(){
  const networks = Networks.find({
    createdAt: {
      $gte: moment().subtract(10, 'days').toDate(),
      $lte: moment().subtract(3, 'days').toDate()
    },
    voucherId: {
      $ne: null
    },
    deletedAt: {
      $ne: null
    }
  }).fetch();

  return networks;
}

async function fetchUsers(networks) {
  const userIds = [];
  networks.forEach(network => {
    console.log("Got networks", network.insanceId);
    if(!userIds.includes(network.user)) {
      userIds.push(network.user)
    }
  });

  const cards = UserCards.find({
    userId: {
      $in: userIds
    }
  }).fetch().map(i => i.userId);

  const finalUsers = [];
  userIds.forEach(id => {
    if(!finalUsers.includes(id) && !cards.includes(id)) {
      finalUsers.push(id);
    }
  });

  const users = Meteor.users.find({
    _id: {
      $in: finalUsers
    }
  });

  console.log("Emails to be sent to ", finalUsers);
  return users;
}

async function sendEmails(users){
  const ejsTemplate = await getEJSTemplate({fileName: "credit-card-link-reminder.ejs"});
  const promises = [];
  users.forEach(user => {
    const name = `${user.profile.firstName} ${user.profile.lastName}`;
    const email = user.emails[0].address;
    console.log("Sending email to ", email);
    const finalHTML = ejsTemplate({
      user: {
        email,
        name
      }
    });
    const emailProps = {
      from: {email: "no-reply@blockcluster.io", name: "Blockcluster"},
      to: email,
      subject: `Action Required | BlockCluster`,
      text: `Kindly verify your credit card to continue using your nodes`,
      html: finalHTML
    };
    promises.push(Email.sendEmail(emailProps));
  });

  await Promise.all(promises);
  return true;
}


Migrations.add({
  version: 5,
  up: function() {
    fetchUsersWithVouchers()
    .then(fetchUsers)
    .then(sendEmails)
    .then(() => {
      console.log("Finished");
    })
  },
  down: function(){}
});

