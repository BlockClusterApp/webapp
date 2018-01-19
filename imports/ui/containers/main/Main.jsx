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

export default class Main extends Component {
	render(){
		return (
			<div>
				<Navbar />
				<div className="page-container">
					<Header />
					<div className="page-content-wrapper ">
                    	<Route exact path="/app/networks" component={NetworksList} />
						<Route exact path="/app/networks/create" component={CreateNetwork} />
						<Route exact path="/app/networks/network/:id" component={ViewEditNetwork} />
						<Route exact path="/app/networks/join" component={JoinNetwork} />
						<Route exact path="/app/assets" component={Assets} />
		            </div>
				</div>
				<Footer />
			</div>
		)
	}
}
