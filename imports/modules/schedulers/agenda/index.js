import Agenda from 'agenda';
import Config from '../../config/server';

/*
Agenda Lock Issues and Bugs:

https://thecodebarbarian.com/node.js-task-scheduling-with-agenda-and-mongodb
https://abdelhady.net/2015/02/06/solved-restarting-node-server-may-stop-any-recurring-agenda-jobs/
https://github.com/agenda/agenda/issues/483
https://github.com/agenda/agenda/issues/401
*/

const agenda = new Agenda({
  db: {
    address: Config.mongoConnectionString,
  }
});

(async function() {
  await agenda.start();
  require('./workers')(agenda);
})();

export default agenda;
