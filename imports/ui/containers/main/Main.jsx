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
import CreateAssetType from "../../pages/createAssetType/CreateAssetType.jsx"
import AssetsStats from "../../pages/assetsStats/AssetsStats.jsx"
import AssetsAPIs from "../../pages/assetsAPIs/AssetsAPIs.jsx"
import AssetsEvents from "../../pages/assetsEvents/AssetsEvents.jsx"

export default class Main extends Component {
	render(){
		return (
			<div>
				<Navbar />
				<div className="page-container">
					<Header />
					<div className="page-content-wrapper">
                    	<Route exact path="/app/networks" component={NetworksList} />
						<Route exact path="/app/networks/create" component={CreateNetwork} />
						<Route exact path="/app/networks/network/:id" component={ViewEditNetwork} />
						<Route exact path="/app/networks/join" component={JoinNetwork} />
						<Route exact path="/app/assets/create" component={CreateAssetType} />
						<Route exact path="/app/assets/stats" component={AssetsStats} />
						<Route exact path="/app/assets/apis" component={AssetsAPIs} />
						<Route exact path="/app/assets/events" component={AssetsEvents} />
		            </div>
				</div>
				<Footer />
			</div>
		)
	}
}
