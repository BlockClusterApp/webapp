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
import VoucherList from '../../pages/admin/vouchers/ListDashboard.jsx';
import VoucherCreate from '../../pages/admin/vouchers/CreateDashboard.jsx';
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
import AdminPricingDashboard from '../../pages/admin/pricing/Dashboard.jsx';

export default withRouter(
  class Main extends Component {
    constructor(props) {
      super(props);
      this.state = {
        remoteConfig: window.RemoteConfig,
        pathsWithFullHeight: ['/app/paymeter'],
      };
    }

    componentWillUnmount() {
      this.pricingSubscription.stop();
    }

    componentDidMount() {
      if (this.props.user && !localStorage.getItem('admin')) {
        locationStorage.setItem('admin', this.props.user.admin);
      }
      this.pricingSubscription = Meteor.subscribe('pricing');
      window.addEventListener('RemoteConfigChanged', () => {
        this.setState({
          remoteConfig: window.RemoteConfig,
        });
      });
    }

    showFailedBillingWarning = Component => {
      const { features } = this.state.remoteConfig;
      if (features && features.Payments) {
        const user = Meteor.user();
        if (user && user.paymentPending) {
          return <Redirect to="/app/payments/cards" />;
        }
      }
      return <Component />;
    };

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
              <Route exact path="/app/networks" render={() => this.showFailedBillingWarning(NetworksList)} />
              <Route exact path="/app/notifications" render={() => this.showFailedBillingWarning(PlatformNotifications)} />
              <Route exact path="/app/createNetwork" render={() => this.showFailedBillingWarning(CreateNetwork)} />
              <Route exact path="/app/networks/:id/settings" render={() => this.showFailedBillingWarning(ViewEditNetwork)} />
              <Route exact path="/app/networks/:id/impulse" render={() => this.showFailedBillingWarning(ViewEditImpulse)} />
              <Route exact path="/app/networks/:id" render={() => this.showFailedBillingWarning(ViewNetwork)} />
              <Route exact path="/app/join/networks" render={() => this.showFailedBillingWarning(JoinNetwork)} />
              <Route exact path="/app/invites" render={() => this.showFailedBillingWarning(Invites)} />
              <Route exact path="/app/networks/:id/security/peers" render={() => this.showFailedBillingWarning(Peers)} />
              <Route exact path="/app/networks/:id/events" render={() => this.showFailedBillingWarning(NodeEvents)} />
              <Route exact path="/app/networks/:id/explorer" render={() => this.showFailedBillingWarning(Explorer)} />
              <Route exact path="/app/networks/:id/assets/search" render={() => this.showFailedBillingWarning(AssetsSearch)} />
              <Route exact path="/app/networks/:id/assets/exchange" render={() => this.showFailedBillingWarning(AssetsExchange)} />
              <Route exact path="/app/networks/:id/assets/create" render={() => this.showFailedBillingWarning(CreateAssetType)} />
              <Route exact path="/app/networks/:id/assets/stats" render={() => this.showFailedBillingWarning(AssetsStats)} />
              <Route exact path="/app/networks/:id/assets/management" render={() => this.showFailedBillingWarning(AssetsManagement)} />
              <Route exact path="/app/networks/:id/assets/audit" render={() => this.showFailedBillingWarning(AssetsAudit)} />
              <Route exact path="/app/networks/:id/streams/create" render={() => this.showFailedBillingWarning(CreateStream)} />
              <Route exact path="/app/networks/:id/streams/publish" render={() => this.showFailedBillingWarning(PublishStream)} />
              <Route exact path="/app/networks/:id/streams/access-control" render={() => this.showFailedBillingWarning(AccessControlStreams)} />
              <Route exact path="/app/networks/:id/bc-accounts" render={() => this.showFailedBillingWarning(BCAccountsView)} />
              <Route exact path="/app/networks/:id/security/apis" render={() => this.showFailedBillingWarning(APIsCreds)} />
              <Route exact path="/app/networks/:id/sc/management" render={() => this.showFailedBillingWarning(SmartContractsManagement)} />
              <Route exact path="/app/platform-apis" render={() => this.showFailedBillingWarning(PlatformAPIKeys)} />

              {features.Payments && <Route path="/app/payments" component={Payments} />}
              {features.Invoice && <Route exact path="/app/billing" component={BillingDashboard} />}
              {features.SupportTicket && <Route exact path="/app/support" component={SupportContainer} />}
              {features.SupportTicket && <Route exact path="/app/support/:id" component={SupportDetails} />}
              {features.Hyperion && <Route exact path="/app/hyperion" render={() => this.showFailedBillingWarning(Hyperion)} />}
              {features.Paymeter && (
                <div className="full-height">
                  <Route exact path="/app/paymeter" render={() => this.showFailedBillingWarning(Paymeter)} />
                  <Route exact path="/app/paymeter/notifications" render={() => this.showFailedBillingWarning(WalletNotifications)} />
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
                  {features.Vouchers && <Route path="/app/admin/vouchers" component={VoucherList} />}
                  {features.Vouchers && <Route exact path="/app/admin/voucher/details/:id" component={VoucherDetails} />}
                  {features.Vouchers && <Route path="/app/admin/voucher/create" component={VoucherCreate} />}

                  {features.SupportTicket && <Route exact path="/app/admin/support" component={AdminSupport} />}
                  {features.SupportTicket && <Route exact path="/app/admin/support/:id" component={AdminSupportDetails} />}

                  {features.Invoice && <Route exact path="/app/admin/invoices" component={AdminInvoiceList} />}
                  {features.Invoice && <Route exact path="/app/admin/invoices/:id" component={AdminInvoiceDetails} />}

                  {(features.Paymeter || features.Hyperion) && <Route path="/app/admin/pricing" component={AdminPricingDashboard} />}

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
