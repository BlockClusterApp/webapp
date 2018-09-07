if (!Meteor.isTest) {
  return;
}

import Forex from '../../../collections/payments/forex';

const data = [
  {
    "_id": "yku3Lh4LEemGRDGC7",
    "active": true,
    "eur": 82.713937,
    "inr": 1,
    "usd": 71.1898028968593,
    "updatedAt": "2018-09-04T05:56:23.895Z"
}
];

export default function createUsers() {
  Forex.remove({});
  data.forEach(forex => {
    Forex.insert(forex);
  });
}
