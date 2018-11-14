import Lottery from '../../../api/server-functions/lottery';

Migrations.add({
  version: 5,
  up: function() {
    // const users = Lottery.getEmails({count: 20, prize: 'Pendrive'});
  },
  down: function(){
    // Lottery.remove({
    //   prize: 'Pendrive',
    //   createdAt: {
    //     $lte: new Date("2018-08-04")
    //   }
    // })
  }
});
