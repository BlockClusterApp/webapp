var MongoClient = Npm.require('mongodb').MongoClient;
var url = "mongodb://127.0.0.1:3001/meteor";
database = null;
MongoClient.connect(url, function(err, db) {
    database = db;
});

export default {}
