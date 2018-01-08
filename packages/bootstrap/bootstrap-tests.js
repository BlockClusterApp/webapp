// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from "meteor/tinytest";

// Import and rename a variable exported by bootstrap.js.
import { name as packageName } from "meteor/blockcluster:bootstrap";

// Write your tests here!
// Here is an example.
Tinytest.add('bootstrap - example', function (test) {
  test.equal(packageName, "bootstrap");
});
