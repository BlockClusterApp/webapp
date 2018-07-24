import { Networks } from '../../../collections/networks/networks';

Migrations.add({
  version: 1,
  up: function() {
    Networks.update({}, {
      $set: {
        active: true
      }
    }, {
      multi: true
    })
  },
  down: function(){
    Networks.update({}, {
      $unset: {
        active: ''
      }
    }, {
      multi: true
    });
  }
});
