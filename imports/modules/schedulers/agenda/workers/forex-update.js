import request from 'request-promise';
import Forex from '../../../../collections/payments/forex';
const debug = require('debug')('scheduler:agenda:forex-update');

const URL = 'http://data.fixer.io/api/latest?access_key=c7b725317a214aacfe25ec788667df01&format=1&base=EUR&symbols=INR,USD,EUR';

module.exports = function(agenda) {
  agenda.define(
    'forex-update',
    { priority: 'low' },
    Meteor.bindEnvironment(async (job) => {
      const result = await request({
        uri: URL,
        json: true
      });

      if(!result){
        console.log("Unable to fetch exchange rates", result);
        return false;
      }

      if(!result.rates) {
        console.log("Unable to fetch exchange rates", result);
        return false;
      }

      const { INR, USD, EUR } = result.rates;

      const usdInINR = (EUR / USD) * INR;
      const eurInINR = INR;

      Forex.update({}, {
        $set: {
          inr: 1,
          usd: usdInINR,
          eur: eurInINR
        }
      });
    })
  );
  if(process.env.NODE_ENV === 'production') {
    agenda.every('3 */2 * * * ', 'forex-update');
  } else if (process.env.NODE_ENV === "staging"){
    agenda.schedule('in 10 seconds', 'forex-update');
  } else {
    Forex.update({}, {
      $set: {
        inr: 1,
        usd: 68,
        eur: 82
      }
    });
  }
};
