import {Email} from '../email';

const _Email = {};

_Email.insert = function (doc) {
  return new Promise((resolve, reject) => {
    Email.insert(doc, (err, rep) => {
      if(err) return reject(err);
      return resolve(rep);
    });
  });
}

export default _Email;