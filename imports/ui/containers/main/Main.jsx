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
import ViewEditImpulse from "../../pages/viewEditImpulse/ViewEditImpulse.jsx"
import ViewNetwork from "../../pages/viewNetwork/viewNetwork.jsx"
import Invites from '../../pages/userInvitation/Invites.jsx';
import CreateAssetType from "../../pages/createAssetType/CreateAssetType.jsx"
import AssetsStats from "../../pages/assetsStats/AssetsStats.jsx"
import NodeEvents from "../../pages/nodeEvents/NodeEvents.jsx"
import PlatformNotifications from "../../pages/platformNotifications/PlatformNotifications.jsx"
import AssetsManagement from "../../pages/assetsManagement/AssetsManagement.jsx"
import AssetsExchange from "../../pages/assetsExchange/AssetsExchange.jsx"
import AssetsSearch from "../../pages/assetsSearch/AssetsSearch.jsx"
import Explorer from "../../pages/explorer/Explorer.jsx"
import APIsCreds from "../../pages/apisCreds/APIsCreds.jsx"
import Peers from "../../pages/peers/Peers.jsx"
import CreateStream from "../../pages/createStream/CreateStream.jsx"
import PublishStream from "../../pages/publishStream/PublishStream.jsx"
import BCAccountsView from "../../pages/bcAccountsView/BCAccountsView.jsx"
import AssetsAudit from "../../pages/assetsAudit/AssetsAudit.jsx"
import BillingDashboard from '../../pages/billing/BillingDashboard.jsx'
import Payments from '../../pages/billing/Payments.jsx'
import SupportDetails from '../../pages/support/Support.jsx';

import UserList from "../../pages/admin/users/UserList.jsx";
import UserDetails from "../../pages/admin/users/Details.jsx";
import NetworkList from '../../pages/admin/networks/NetworkList.jsx';
import NetworkDetails from '../../pages/admin/networks/Details.jsx';
import SupportContainer from '../../pages/support/Container.jsx';
import VoucherList from "../../pages/admin/vouchers/VoucherList.jsx";
import VoucherCreate from "../../pages/admin/vouchers/VoucherCreate.jsx";
import AdminSupport from "../../pages/admin/support/TicketList.jsx";
import AdminSupportDetails from '../../pages/admin/support/Details.jsx';

export default class Main extends Component {
	render() {
		return (
			<div>
				<Navbar />
				<div className="page-container">
					<Header />
					<div className="page-content-wrapper">
            <Route exact path="/app/networks" component={NetworksList} />
						<Route exact path="/app/notifications" component={PlatformNotifications} />
						<Route exact path="/app/createNetwork" component={CreateNetwork} />
						<Route exact path="/app/networks/:id/settings" component={ViewEditNetwork} />
						<Route exact path="/app/networks/:id/impulse" component={ViewEditImpulse} />
						<Route exact path="/app/networks/:id" component={ViewNetwork} />
						<Route exact path="/app/join/networks" component={JoinNetwork} />
						<Route exact path="/app/invites" component={Invites} />
						<Route exact path="/app/networks/:id/security/peers" component={Peers} />
						<Route exact path="/app/networks/:id/events" component={NodeEvents} />
						<Route exact path="/app/networks/:id/explorer" component={Explorer} />
						<Route exact path="/app/networks/:id/assets/search" component={AssetsSearch} />
						<Route exact path="/app/networks/:id/assets/exchange" component={AssetsExchange} />
						<Route exact path="/app/networks/:id/assets/create" component={CreateAssetType} />
						<Route exact path="/app/networks/:id/assets/stats" component={AssetsStats} />
						<Route exact path="/app/networks/:id/assets/management" component={AssetsManagement} />
						<Route exact path="/app/networks/:id/assets/audit" component={AssetsAudit} />
						<Route exact path="/app/networks/:id/streams/create" component={CreateStream} />
						<Route exact path="/app/networks/:id/streams/publish" component={PublishStream} />
						<Route exact path="/app/networks/:id/bc-accounts" component={BCAccountsView} />
						<Route exact path="/app/networks/:id/security/apis" component={APIsCreds} />
            <Route exact path="/app/billing" component={BillingDashboard} />
            <Route exact path="/app/payments" component={Payments} />
            <Route exact path="/app/support" component={SupportContainer} />
            <Route exact path="/app/support/:id" component={SupportDetails} />


						<Route exact path="/app/admin" render={() => <Redirect to="/app/admin/users" />} />
						<Route exact path="/app/admin/users" component={UserList} />
		        <Route exact path="/app/admin/users/:id" component={UserDetails} />
						<Route exact path="/app/admin/networks" component={NetworkList} />
		        <Route exact path="/app/admin/networks/:id" component={NetworkDetails} />
						<Route exact path="/app/admin/vouchers" component={VoucherList} />
						<Route exact path="/app/admin/vouchers/create" component={VoucherCreate} />
            <Route exact path="/app/admin/support" component={AdminSupport} />
            <Route exact path="/app/admin/support/:id" component={AdminSupportDetails} />
		        </div>
				</div>
				<Footer />
			</div>
		)
	}
}
