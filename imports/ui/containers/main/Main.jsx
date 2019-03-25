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

import Profile from '../../pages/profile/Profile';

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
import CreditRedemption from '../../pages/billing/components/RedemptionHistory';
import RedemptionHistory from '../../pages/billing/components/RedemptionHistory';
import PaymeterAdminDashboard from '../../pages/admin/paymeter/Dashboard';
import PaymeterAdminDetails from '../../pages/admin/paymeter/Details';
import Overview from '../../pages/admin/Overview';

import '../app/App.scss';
import PrivateHiveDashboard from '../../pages/privatehive/Dashboard';
import PrivateHiveNetworkManage from '../../pages/privatehive/Manage';
import PrivateHiveNetworkSettings from '../../pages/privatehive/Settings';
import PrivateHiveAdminList from '../../pages/admin/privatehive/NetworkList';
import PrivateHiveAdminDetails from '../../pages/admin/privatehive/Details';
import PrivateHiveChannelExplorer from '../../pages/privatehive/Explorer.jsx';
import PrivateHiveChannelManagement from '../../pages/privatehive/ManageChannels';
import PrivateHiveChaincodeManagement from '../../pages/privatehive/ManageChaincode';
import PrivateHiveChannelCreate from '../../pages/privatehive/CreateChannel';
import PrivateHiveSecurity from '../../pages/privatehive/Security';
import PrivateHiveChaincodeCreate from '../../pages/privatehive/CreateChancode';

export default withRouter(
  class Main extends Component {
    constructor(props) {
      super(props);
      this.state = {
        remoteConfig: window.RemoteConfig,
        pathsWithFullHeight: ['/app/paymeter', '/app/profile'],
      };
    }

    componentWillUnmount() {
      this.pricingSubscription.stop();
    }

    componentDidMount() {
      if (this.props.user && !localStorage.getItem('admin')) {
        localStorage.setItem('admin', this.props.user.admin);
      }
      this.pricingSubscription = Meteor.subscribe('pricing');
      window.addEventListener('RemoteConfigChanged', () => {
        this.setState({
          remoteConfig: window.RemoteConfig,
        });
      });
    }

    showFailedBillingWarning = (Component, props) => {
      const { features } = this.state.remoteConfig;
      if (features && features.Payments) {
        const user = Meteor.user();
        if (user && user.paymentPending) {
          return <Redirect to="/app/payments/cards" />;
        }
      }
      return <Component {...props} />;
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
        <div className={`${fullHeight}   ${window.theme} `}>
          <Navbar />
          <div className={`page-container`}>
            <Header />
            <div className={`page-content-wrapper ${fullHeight}`}>
              <Route exact path="/app/profile" component={Profile} />
              {!window.isAdminWindow && (
                <Switch>
                  <Route exact path="/app/networks" render={props => this.showFailedBillingWarning(NetworksList, props)} />
                  <Route exact path="/app/notifications" render={props => this.showFailedBillingWarning(PlatformNotifications, props)} />
                  <Route exact path="/app/createNetwork" render={props => this.showFailedBillingWarning(CreateNetwork, props)} />
                  <Route exact path="/app/networks/:id/settings" render={props => this.showFailedBillingWarning(ViewEditNetwork, props)} />
                  <Route exact path="/app/networks/:id/impulse" render={props => this.showFailedBillingWarning(ViewEditImpulse, props)} />
                  <Route exact path="/app/networks/:id" render={props => this.showFailedBillingWarning(ViewNetwork, props)} />
                  <Route exact path="/app/join/networks" render={props => this.showFailedBillingWarning(JoinNetwork, props)} />
                  <Route exact path="/app/invites" render={props => this.showFailedBillingWarning(Invites, props)} />
                  <Route exact path="/app/networks/:id/security/peers" render={props => this.showFailedBillingWarning(Peers, props)} />
                  <Route exact path="/app/networks/:id/events" render={props => this.showFailedBillingWarning(NodeEvents, props)} />
                  <Route exact path="/app/networks/:id/explorer" render={props => this.showFailedBillingWarning(Explorer, props)} />
                  <Route exact path="/app/networks/:id/assets/search" render={props => this.showFailedBillingWarning(AssetsSearch, props)} />
                  <Route exact path="/app/networks/:id/assets/exchange" render={props => this.showFailedBillingWarning(AssetsExchange, props)} />
                  <Route exact path="/app/networks/:id/assets/create" render={props => this.showFailedBillingWarning(CreateAssetType, props)} />
                  <Route exact path="/app/networks/:id/assets/stats" render={props => this.showFailedBillingWarning(AssetsStats, props)} />
                  <Route exact path="/app/networks/:id/assets/management" render={props => this.showFailedBillingWarning(AssetsManagement, props)} />
                  <Route exact path="/app/networks/:id/assets/audit" render={props => this.showFailedBillingWarning(AssetsAudit, props)} />
                  <Route exact path="/app/networks/:id/streams/create" render={props => this.showFailedBillingWarning(CreateStream, props)} />
                  <Route exact path="/app/networks/:id/streams/publish" render={props => this.showFailedBillingWarning(PublishStream, props)} />
                  <Route exact path="/app/networks/:id/streams/access-control" render={props => this.showFailedBillingWarning(AccessControlStreams, props)} />
                  <Route exact path="/app/networks/:id/bc-accounts" render={props => this.showFailedBillingWarning(BCAccountsView, props)} />
                  <Route exact path="/app/networks/:id/security/apis" render={props => this.showFailedBillingWarning(APIsCreds, props)} />
                  <Route exact path="/app/networks/:id/sc/management" render={props => this.showFailedBillingWarning(SmartContractsManagement, props)} />
                  <Route exact path="/app/platform-apis" render={props => this.showFailedBillingWarning(PlatformAPIKeys, props)} />

                  <Route exact path="/app/privatehive/:id/details" render={props => this.showFailedBillingWarning(PrivateHiveNetworkManage, props)} />
                  <Route exact path="/app/privatehive/:id/settings" render={props => this.showFailedBillingWarning(PrivateHiveNetworkSettings, props)} />
                  <Route exact path="/app/privatehive/:id/security" render={props => this.showFailedBillingWarning(PrivateHiveSecurity, props)} />
                  <Route exact path="/app/privatehive/:id/channels/create" render={props => this.showFailedBillingWarning(PrivateHiveChannelCreate, props)} />
                  <Route exact path="/app/privatehive/:id/channels/explorer" render={props => this.showFailedBillingWarning(PrivateHiveChannelExplorer, props)} />
                  <Route exact path="/app/privatehive/:id/channels/manage" render={props => this.showFailedBillingWarning(PrivateHiveChannelManagement, props)} />
                  <Route exact path="/app/privatehive/:id/chaincode/manage" render={props => this.showFailedBillingWarning(PrivateHiveChaincodeManagement, props)} />
                  <Route exact path="/app/privatehive/:id/chaincode/create" render={props => this.showFailedBillingWarning(PrivateHiveChaincodeCreate, props)} />
                  <Route path="/app/privatehive" render={props => this.showFailedBillingWarning(PrivateHiveDashboard, props)} />

                  {features.Payments && <Route path="/app/payments" component={Payments} />}
                  {features.Payments && <Route exact path="/app/credits" component={RedemptionHistory} />}
                  {features.Invoice && <Route exact path="/app/billing" component={BillingDashboard} />}
                  {features.SupportTicket && <Route exact path="/app/support" component={SupportContainer} />}
                  {features.SupportTicket && <Route exact path="/app/support/:id" component={SupportDetails} />}
                  {features.Hyperion && <Route exact path="/app/hyperion" render={props => this.showFailedBillingWarning(Hyperion, props)} />}
                  {features.Paymeter && (
                    <div className="full-height">
                      <Route exact path="/app/paymeter" render={props => this.showFailedBillingWarning(Paymeter, props)} />
                      <Route exact path="/app/paymeter/notifications" render={props => this.showFailedBillingWarning(WalletNotifications, props)} />
                    </div>
                  )}
                </Switch>
              )}

              {features.Admin && (
                <div>
                  <Route exact path="/app/admin" render={() => <Redirect to="/app/admin/users" />} />
                  <Route exact path="/app/admin/overview" component={Overview} />
                  <Route exact path="/app/admin/users" component={UserList} />
                  <Route exact path="/app/admin/users/:id" component={UserDetails} />
                  <Route exact path="/app/admin/networks" component={NetworkList} />
                  <Route exact path="/app/admin/networks/:id" component={NetworkDetails} />

                  <Route exact path="/app/admin/privatehive" component={PrivateHiveAdminList} />
                  <Route exact path="/app/admin/privatehive/:id" component={PrivateHiveAdminDetails} />

                  {features.Vouchers && <Route path="/app/admin/vouchers" component={VoucherList} />}
                  {features.Vouchers && <Route exact path="/app/admin/voucher/details/:id" component={VoucherDetails} />}
                  {features.Vouchers && <Route path="/app/admin/voucher/create" component={VoucherCreate} />}

                  {features.SupportTicket && <Route exact path="/app/admin/support" component={AdminSupport} />}
                  {features.SupportTicket && <Route exact path="/app/admin/support/:id" component={AdminSupportDetails} />}

                  {features.Invoice && <Route exact path="/app/admin/invoices" component={AdminInvoiceList} />}
                  {features.Invoice && <Route exact path="/app/admin/invoices/:id" component={AdminInvoiceDetails} />}

                  {(features.Paymeter || features.Hyperion) && <Route path="/app/admin/pricing" component={AdminPricingDashboard} />}
                  {features.Paymeter && <Route exact path="/app/admin/paymeter" component={PaymeterAdminDashboard} />}
                  {features.Paymeter && <Route exact path="/app/admin/paymeter/:id" component={PaymeterAdminDetails} />}

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
