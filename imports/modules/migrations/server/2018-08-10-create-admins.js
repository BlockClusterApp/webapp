const emails = ['admin@blockcluster.io'];

Migrations.add({
  version: 6,
  up: function() {

    emails.forEach(email => {
      console.log("Creating admin ", email);
      Meteor.users.insert({
        createdAt: new Date(),
        emails: [
          {
            address: email,
            verified: true
          }
        ],
        profile: {
          firstName: "Admin",
          lastName: "Blockcluster"
        },
        admin: 2
      });
    });
    console.log("Finished");
  },
  down: function(){
    emails.forEach(email => {
      Meteor.users.remove({
        "emails.address":  email
      })
    });
  }
});
