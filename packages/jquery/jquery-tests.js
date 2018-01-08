// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from "meteor/tinytest";

// Import and rename a variable exported by jquery.js.
import { name as packageName } from "meteor/blockcluster:jquery";

// Write your tests here!
// Here is an example.
Tinytest.add('jquery - example', function (test) {
  test.equal(packageName, "jquery");
});
