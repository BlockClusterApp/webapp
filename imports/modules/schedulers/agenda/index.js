import Agenda from 'agenda';
import Config from '../../config/server';

const agenda = new Agenda({
  db: {
    address: Config.mongoConnectionString,
  },
});

(async function() {
  await agenda.start();
  console.log("Started agenda");
})();
require('./workers')(agenda);

export default agenda;