import {Meteor} from "meteor/meteor";
import {render} from "react-dom";
import React from "react";

import "../imports/startup/client"

import App from "../imports/ui/containers/app/App.jsx"

Meteor.startup(() => {
	render(<App />, document.getElementById("render-target"));
});
