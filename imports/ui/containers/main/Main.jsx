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
import AssetsManagement from "../../pages/assetsManagement/AssetsManagement.jsx"
import AssetsExchange from "../../pages/assetsExchange/AssetsExchange.jsx"
import AssetsSearch from "../../pages/assetsSearch/AssetsSearch.jsx"
import Explorer from "../../pages/explorer/Explorer.jsx"
import APIsCreds from "../../pages/apisCreds/APIsCreds.jsx"
import Peers from "../../pages/peers/Peers.jsx"
import CreateStream from "../../pages/createStream/CreateStream.jsx"
import PublishStream from "../../pages/publishStream/PublishStream.jsx"
import SubscribeStream from "../../pages/subscribeStream/SubscribeStream.jsx"



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
						<Route exact path="/app/explorer" component={Explorer} />
						<Route exact path="/app/assets/create" component={CreateAssetType} />
						<Route exact path="/app/assets/stats" component={AssetsStats} />
						<Route exact path="/app/assets/apis" component={AssetsAPIs} />
						<Route exact path="/app/assets/events" component={AssetsEvents} />
						<Route exact path="/app/assets/management" component={AssetsManagement} />
						<Route exact path="/app/assets/exchange" component={AssetsExchange} />
						<Route exact path="/app/assets/search" component={AssetsSearch} />
						<Route exact path="/app/security/apis-creds" component={APIsCreds} />
						<Route exact path="/app/security/peers" component={Peers} />
						<Route exact path="/app/streams/create" component={CreateStream} />
						<Route exact path="/app/streams/publish" component={PublishStream} />
						<Route exact path="/app/streams/subscribe" component={SubscribeStream} />
		            </div>
				</div>
				<Footer />
			</div>
		)
	}
}
