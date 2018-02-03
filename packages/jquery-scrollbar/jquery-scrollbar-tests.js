// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from "meteor/tinytest";

// Import and rename a variable exported by jquery-scrollbar.js.
import { name as packageName } from "meteor/blockcluster:jquery-scrollbar";

// Write your tests here!
// Here is an example.
Tinytest.add('jquery-scrollbar - example', function (test) {
  test.equal(packageName, "jquery-scrollbar");
});
