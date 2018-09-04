if (!Meteor.isTest) {
  return;
}

const users = [
  {
    _id: 'wH4LtZQbxKcZ7a5iN',
    createdAt: '2018-08-20T07:10:48.747Z',
    services: {
      password: {
        bcrypt: '$2a$10$L8y78WDW5fPjZZfEdOkfGen4.8.xp7x3RscZL8tGvXZphkNl3WlQu',
      },
      resume: {
        loginTokens: [],
      },
    },
    emails: [
      {
        address: 'jibin.mathews@blockcluster.io',
        verified: true,
      },
    ],
    firstLogin: false,
    profile: {
      firstName: 'Jibin',
      lastName: 'Mathews',
    },
  },
  {
    _id: 'zbQTNCxfNuhrAudWE',
    createdAt: '2018-08-01T07:10:48.747Z',
    services: {
      password: {
        bcrypt: '$2a$10$L8y78WDW5fPjZZfEdOkfGen4.8.xp7x3RscZL8tGvXZphkNl3WlQu',
      },
      resume: {
        loginTokens: [],
      },
    },
    emails: [
      {
        address: 'narayan.prusty@blockcluster.io',
        verified: true,
      },
    ],
    firstLogin: false,
    profile: {
      firstName: 'Narayan',
      lastName: 'Prusty',
    },
  },
];

export default function createUsers() {
  Meteor.users.remove({});
  users.forEach(user => {
    Meteor.users.insert(user);
  });
}
