import {EmailVerification} from '../';

const _EmailVerification = {};

_EmailVerification.findOne = function(selector,options = {skip: 0, limit: 1}) {
    return new Promise((resolve, reject) => {
        EmailVerification.find(selector, options, (err, res) => {
            console.log("Err res", err, res);
            if(err) return reject(err);
            return resolve(res[0]);
        });
    });
}

_EmailVerification.insert = function(doc){
    return new Promise((resolve, reject) => {
        EmailVerification.insert(doc, (err, res) => {
          if(err) return reject(err);
          return resolve(res);
        });
      })
}

_EmailVerification.updateOne = function(selector, modifier, options) {
    return new Promise((resolve, reject) => {
        EmailVerification.updateOne(selector, modifier, options, (err, res)=>{
            if(err) return reject(err);
            return resolve(res);
        });
    });
}

export default _EmailVerification;