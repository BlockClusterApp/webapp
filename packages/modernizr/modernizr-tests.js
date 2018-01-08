// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from "meteor/tinytest";

// Import and rename a variable exported by modernizr.js.
import { name as packageName } from "meteor/blockcluster:modernizr";

// Write your tests here!
// Here is an example.
Tinytest.add('modernizr - example', function (test) {
  test.equal(packageName, "modernizr");
});
