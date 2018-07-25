const moment = require('moment');

module.exports = [
  {
    code: 'BLOCK12HGD22',
    networkConfig: {
      cpu: 0.5,
      ram: 0.5,
      disk: 5
    },
    expiryDate: moment().add('30', 'days').toDate()
  },
  {
    code: 'BLOCKEXP12G33',
    networkConfig: {
      cpu: 1,
      ram: 2,
      disk: 20
    },
    expiryDate: moment().subtract('30', 'days').toDate()
  },
  {
    code: 'BLOCK134SOI',
    networkConfig: {
      cpu: 5,
      ram: 23,
      disk: 256
    },
    expiryDate: moment().add('60', 'days').toDate()
  }
]
