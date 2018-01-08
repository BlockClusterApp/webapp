// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from "meteor/tinytest";

// Import and rename a variable exported by pages.js.
import { name as packageName } from "meteor/blockcluster:pages";

// Write your tests here!
// Here is an example.
Tinytest.add('pages - example', function (test) {
  test.equal(packageName, "pages");
});
