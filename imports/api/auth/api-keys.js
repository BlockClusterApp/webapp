import ApiKeys from '../../collections/api-keys';
const Apis = {};

const API_KEY_LENGTH = 28;
const allowed = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnop:qrstuvwxyz1234567890@#$%&';

async function generateApiKey() {
  let result = [];
  for (let i = 0; i < API_KEY_LENGTH; i++) {
    result.push(allowed[Math.floor(Math.random() * allowed.length)]);
  }
  const key = Buffer.from(result.join('')).toString('base64');

  const alreadyExists = ApiKeys.find({ key }).fetch()[0];
  if (alreadyExists) {
    return generateApiKey();
  }
  return key;
}

Apis.createNewApiKey = async function() {
  const existingKeys = ApiKeys.find({ active: true, userId: Meteor.userId() }).fetch();

  if (existingKeys.length > 2) {
    throw new Meteor.Error('bad-request', 'Can have a maximum of only 3 active API Keys');
  }

  const token = await generateApiKey();

  const apiKeyId = ApiKeys.insert({
    key: token,
    userId: Meteor.userId(),
  });

  return ApiKeys.find({ apiKeyId }).fetch()[0];
};

Apis.deleteApiKey = async function(id) {
  const key = ApiKeys.find({
    _id: id,
    userId: Meteor.userId()
  }).fetch()[0];

  if (!key){
    throw new Meteor.Error("bad-request", "Invalid api key to be deleted");
  }

  ApiKeys.update({
    _id: key._id
  }, {
    $set: {
      active: false
    }
  });

  return true;
};

Meteor.methods({
  generateApiKey: Apis.createNewApiKey,
  deleteApiKey: Apis.deleteApiKey,
});

export default Apis;
