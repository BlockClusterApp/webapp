// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from "meteor/tinytest";

// Import and rename a variable exported by ladda.js.
import { name as packageName } from "meteor/blockcluster:ladda";

// Write your tests here!
// Here is an example.
Tinytest.add('ladda - example', function (test) {
  test.equal(packageName, "ladda");
});
