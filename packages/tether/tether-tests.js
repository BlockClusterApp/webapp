// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from "meteor/tinytest";

// Import and rename a variable exported by tether.js.
import { name as packageName } from "meteor/blockcluster:tether";

// Write your tests here!
// Here is an example.
Tinytest.add('tether - example', function (test) {
  test.equal(packageName, "tether");
});
