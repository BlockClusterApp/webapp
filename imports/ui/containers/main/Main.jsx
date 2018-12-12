import React, { Component } from 'react';
import { Meteor } from 'meteor/meteor';
import { BrowserRouter, Route, Switch, Redirect } from 'react-router-dom';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter } from 'react-router-dom';

import Navbar from '../../components/navbar/Navbar.jsx';
import Header from '../../components/header/Header.jsx';
import Footer from '../../components/footer/Footer.jsx';

import NetworksList from '../../pages/networksList/NetworksList.jsx';
import CreateNetwork from '../../pages/createNetwork/CreateNetwork.jsx';
import JoinNetwork from '../../pages/joinNetwork/JoinNetwork.jsx';
import ViewEditNetwork from '../../pages/viewEditNetwork/ViewEditNetwork.jsx';
import ViewEditImpulse from '../../pages/viewEditImpulse/ViewEditImpulse.jsx';
import ViewNetwork from '../../pages/viewNetwork/viewNetwork.jsx';
import Invites from '../../pages/userInvitation/Invites.jsx';
import CreateAssetType from '../../pages/createAssetType/CreateAssetType.jsx';
import AssetsStats from '../../pages/assetsStats/AssetsStats.jsx';
import NodeEvents from '../../pages/nodeEvents/NodeEvents.jsx';
import PlatformNotifications from '../../pages/platformNotifications/PlatformNotifications.jsx';
import AssetsManagement from '../../pages/assetsManagement/AssetsManagement.jsx';
import AssetsExchange from '../../pages/assetsExchange/AssetsExchange.jsx';
import AssetsSearch from '../../pages/assetsSearch/AssetsSearch.jsx';
import Explorer from '../../pages/explorer/Explorer.jsx';
import APIsCreds from '../../pages/apisCreds/APIsCreds.jsx';
import Hyperion from '../../pages/hyperion/Hyperion.jsx';
import Paymeter from '../../pages/paymeter/Paymeter.jsx';
import Peers from '../../pages/peers/Peers.jsx';
import CreateStream from '../../pages/createStream/CreateStream.jsx';
import PublishStream from '../../pages/publishStream/PublishStream.jsx';
import AccessControlStreams from '../../pages/accessControlStreams/AccessControlStreams.jsx';
import BCAccountsView from '../../pages/bcAccountsView/BCAccountsView.jsx';
import AssetsAudit from '../../pages/assetsAudit/AssetsAudit.jsx';
import BillingDashboard from '../../pages/billing/BillingDashboard.jsx';
import Payments from '../../pages/billing/Payments.jsx';
import SupportDetails from '../../pages/support/Support.jsx';
import SmartContractsManagement from '../../pages/smartContractsManagement/SmartContractsManagement.jsx';
import WalletNotifications from '../../pages/paymeter/Notifications.jsx';

import UserList from '../../pages/admin/users/UserList.jsx';
import UserDetails from '../../pages/admin/users/Details.jsx';
import NetworkList from '../../pages/admin/networks/NetworkList.jsx';
import NetworkDetails from '../../pages/admin/networks/Details.jsx';
import SupportContainer from '../../pages/support/Container.jsx';
import VoucherList from '../../pages/admin/vouchers/VoucherList.jsx';
import VoucherCreate from '../../pages/admin/vouchers/VoucherCreate.jsx';
import VoucherDetails from '../../pages/admin/vouchers/VoucherDetails';
import AdminSupport from '../../pages/admin/support/TicketList.jsx';
import AdminSupportDetails from '../../pages/admin/support/Details.jsx';
import AdminInvoiceDetails from '../../pages/admin/invoice/Details.jsx';
import AdminInvoiceList from '../../pages/admin/invoice/List.jsx';
import ClientList from '../../pages/admin/clients/ClientList.jsx';
import ClientDetails from '../../pages/admin/clients/ClientDetails.jsx';
import ClientCreate from '../../pages/admin/clients/ClientCreate';
import ClientMetrics from '../../pages/admin/clients/ClientMetrics';
import ConfigList from '../../pages/admin/network-config/List';
import PlatformAPIKeys from '../../pages/platformApis/PlatformAPIKeys.jsx';

export default withRouter(
  class Main extends Component {
    constructor(props) {
      super(props);
      this.state = {
        remoteConfig: window.RemoteConfig,
        pathsWithFullHeight: ['/app/paymeter'],
      };
    }

    componentDidMount() {
      if (this.props.user && !localStorage.getItem('admin')) {
        locationStorage.setItem('admin', this.props.user.admin);
      }
      window.addEventListener('RemoteConfigChanged', () => {
        this.setState({
          remoteConfig: window.RemoteConfig,
        });
      });
    }

    render() {
      const { remoteConfig } = this.state;
      let { features } = remoteConfig;
      if (!features) {
        features = {};
      }

      let fullHeight = '';

      if (this.state.pathsWithFullHeight.includes(this.props.location.pathname)) {
        fullHeight = 'full-height';
      }

      return (
        <div className={`${fullHeight}`}>
          <Navbar />
          <div className="page-container">
            <Header />
            <div className={`page-content-wrapper ${fullHeight}`}>
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
              <Route exact path="/app/networks/:id/streams/access-control" component={AccessControlStreams} />
              <Route exact path="/app/networks/:id/bc-accounts" component={BCAccountsView} />
              <Route exact path="/app/networks/:id/security/apis" component={APIsCreds} />
              <Route exact path="/app/networks/:id/sc/management" component={SmartContractsManagement} />
              <Route exact path="/app/platform-apis" component={PlatformAPIKeys} />

              {features.Payments && <Route exact path="/app/payments" component={Payments} />}
              {features.Invoice && <Route exact path="/app/billing" component={BillingDashboard} />}
              {features.SupportTicket && <Route exact path="/app/support" component={SupportContainer} />}
              {features.SupportTicket && <Route exact path="/app/support/:id" component={SupportDetails} />}
              {features.Hyperion && <Route exact path="/app/hyperion" component={Hyperion} />}
              {features.Paymeter && (
                <div className="full-height">
                  <Route exact path="/app/paymeter" component={Paymeter} />
                  <Route exact path="/app/paymeter/notifications" component={WalletNotifications} />
                </div>
              )}
              {features.Admin && (
                <div>
                  <Route exact path="/app/admin" render={() => <Redirect to="/app/admin/users" />} />
                  <Route exact path="/app/admin/users" component={UserList} />
                  <Route exact path="/app/admin/users/:id" component={UserDetails} />
                  <Route exact path="/app/admin/networks" component={NetworkList} />
                  <Route exact path="/app/admin/networks/:id" component={NetworkDetails} />
                  <Route exact path="/app/admin/network-configs" component={ConfigList} />
                  {features.Vouchers && <Route exact path="/app/admin/vouchers" component={VoucherList} />}
                  {features.Vouchers && <Route exact path="/app/admin/vouchers/details/:id" component={VoucherDetails} />}
                  {features.Vouchers && <Route exact path="/app/admin/vouchers/create" component={VoucherCreate} />}

                  {features.SupportTicket && <Route exact path="/app/admin/support" component={AdminSupport} />}
                  {features.SupportTicket && <Route exact path="/app/admin/support/:id" component={AdminSupportDetails} />}

                  {features.Invoice && <Route exact path="/app/admin/invoices" component={AdminInvoiceList} />}
                  {features.Invoice && <Route exact path="/app/admin/invoices/:id" component={AdminInvoiceDetails} />}

                  {features.ClientDashboard && <Route exact path="/app/admin/clients" component={ClientList} />}
                  {features.ClientDashboard && <Route exact path="/app/admin/clients/details/:id" component={ClientDetails} />}
                  {features.ClientDashboard && <Route exact path="/app/admin/clients/details/:id/metrics" component={ClientMetrics} />}
                  {features.ClientDashboard && <Route exact path="/app/admin/clients/create" component={ClientCreate} />}
                </div>
              )}
            </div>
          </div>
          <Footer />
        </div>
      );
    }
  }
);
