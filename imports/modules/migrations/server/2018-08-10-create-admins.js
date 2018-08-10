Migrations.add({
  version: 6,
  up: function() {
    const emails = ['jibin.mathews@blockcluster.io', 'arsenal.narayan@gmail.com'];
    emails.forEach(email => {
      console.log("Creating admin ", email);
      Meteor.users.update({
        "emails.address": email
      }, {
        $set: {
          admin: 2
        }
      });
    });
    console.log("Finished");
  },
  down: function(){
    Vouchers.remove({});
  }
});
