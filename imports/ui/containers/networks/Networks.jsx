import React, {Component} from "react";
import {Meteor} from "meteor/meteor";
import {BrowserRouter, Route, Switch, Redirect} from "react-router-dom"
import {withTracker} from "meteor/react-meteor-data";

import Navbar from "../../components/navbar/Navbar.jsx"
import Header from "../../components/header/Header.jsx"
import Footer from "../../components/footer/Footer.jsx"

import NetworksList from "../../pages/networksList/NetworksList.jsx"
import CreateNetwork from "../../pages/createNetwork/CreateNetwork.jsx"
import JoinNetwork from "../../pages/joinNetwork/JoinNetwork.jsx"
import ViewEditNetwork from "../../pages/viewEditNetwork/ViewEditNetwork.jsx"
import Assets from "../../pages/assets/Assets.jsx"

export default class AuthorizedRoute extends Component {
	render(){
		return (
			<div class="">
				<Navbar />
				<div className="page-container">
					<Header />
					<div className="page-content-wrapper full-height">
                    	<Route exact path="/networks" component={NetworksList} />
						<Route exact path="/networks/create" component={CreateNetwork} />
						<Route exact path="/networks/network/:id" component={ViewEditNetwork} />
						<Route exact path="/networks/join" component={JoinNetwork} />
		            </div>
				</div>
				<Footer />
			</div>
		)
	}
}
