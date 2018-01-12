import React, {Component} from "react";
import {Meteor} from "meteor/meteor";
import {BrowserRouter, Route, Switch, Redirect} from "react-router-dom"
import {withTracker} from "meteor/react-meteor-data";

import Navbar from "../../components/navbar/Navbar.jsx"
import Header from "../../components/header/Header.jsx"
import Footer from "../../components/footer/Footer.jsx"

import Dashboard from "../../pages/dashboard/Dashboard.jsx"
import CreateNetwork from "../../pages/createNetwork/CreateNetwork.jsx"
import JoinNetwork from "../../pages/joinNetwork/JoinNetwork.jsx"
import ViewEditNetwork from "../../pages/viewEditNetwork/ViewEditNetwork.jsx"

export default class AuthorizedRoute extends Component {
	render(){
		return (
			<div className="fixed-header menu-pin menu-behind">
				<Navbar />
				<div className="page-container">
					<Header />
					<div className="page-content-wrapper ">
                    	<Route exact path="/app" component={Dashboard} />
						<Route exact path="/app/create" component={CreateNetwork} />
						<Route exact path="/app/network/:id" component={ViewEditNetwork} />
						<Route exact path="/app/join" component={JoinNetwork} />
		            </div>
				</div>
				<Footer />
			</div>
		)
	}
}