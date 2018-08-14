import Mongo from 'meteor/mongo';
import SimpleSchema from "simpl-schema";
import AttachBaseHooks from "../../modules/helpers/model-helpers";

const randomChars = 'ABCDEFGHJKLMNPRSTUVWXYZ';
const padToFive = number => number <= 99999 ? ("0000"+number).slice(-4) : number;

const SupportTicket = new Mongo.Collection("userInvitation");
AttachBaseHooks(SupportTicket);

SupportTicket.StatusMapping = {
  Filed: 1,
  BlockclusterActionPending: 2,
  CustomerActionPending: 3,
  Cancelled: 4,
  Resolved: 5,
  SystemNoResponse: 6,
  SystemClosed: 7
}

SupportTicket.before.insert((userId, doc) => {
  doc.createdAt = new Date();
  doc.active = true;

  doc.createdBy = userId;
  doc.status = SupportTicket.StatusMapping.Filed;

  const count = SupportTicket.find().count();
  const randomChar = randomChars[Math.floor(Math.random() * randomChars.length)];
  doc.caseId = `${randomChar}${padToFive(count)}`;
});

SupportTicket.before.update((userId, doc, fieldNames, modifier, options) => {
  modifier.$set = modifier.$set || {};
  modifier.$set.updatedAt = new Date();

  const user = Meteor.users.find({_id: userId});
  if(modifier.$push) {
    if(typeof modifier.$push.history === "object") {
      modifier.$push.history.createdAt = new Date();
      modifier.$push.history.updatedBy = {
        userId,
        user: {
          name: `${user.profile.firstName} ${user.profile.lastName}`,
          email: user.emails[0].address
        }
      }
    }
    if(typeof modifier.$push.attachments === "object") {
      modifier.$push.attachments.createdAt = new Date();
      modifier.$push.attachments.uploadedBy = {
        userId,
        user: {
          name: `${user.profile.firstName} ${user.profile.lastName}`,
          email: user.emails[0].address
        }
      }
    }
  }
});


SupportTicket.Schema = new SimpleSchema({
  caseId: {
    type: String
  },
  title: {
    type: String
  },
  description: {
    type: String,
  },
  attachments: {
    type: Array
  },
  "attachments.$": {
    type: Object
  },
  history: {
    type: Array
  },
  "history.$": {
    type: Object
  },
  status: {
    type: Object
  },
  createdBy: {
    type: String
  }
});

SupportTicket._ensureIndex({
  caseId: 1
}, {
  unique: true
});

export default SupportTicket;
