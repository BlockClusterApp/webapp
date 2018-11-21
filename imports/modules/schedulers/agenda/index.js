import Agenda from 'agenda';
import Config from '../../config/server';

const agenda = new Agenda({
  db: {
    address: Config.mongoConnectionString,
  },
});

(async function() {
  await agenda.start();
  require('./workers')(agenda);
  console.log("Started agenda");
})();

export default agenda;
