import React, { Component } from 'react';
import { Link, withRouter } from 'react-router-dom';
import { withTracker } from 'meteor/react-meteor-data';
import Config from '../../../modules/config/client';

import './Navbar.scss';

class Navbar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      remoteConfig: window.RemoteConfig,
    };
  }

  componentDidMount() {
    window.addEventListener('RemoteConfigChanged', () => {
      this.setState({
        remoteConfig: window.RemoteConfig,
      });
    });
    this.props.history.listen((location, action) => {
      // if (location.pathname.includes('/app/admin')) {
      this.setState({});
      // }
    });
  }

  componentWillReceiveProps(newProps, oldProps) {
    if (newProps.user && !localStorage.getItem('admin')) {
      localStorage.setItem('admin', newProps.user.admin);
    }
  }

  componentDidUpdate() {
    $.Pages.init();
  }

  render() {
    const { remoteConfig } = this.state;
    let { features } = remoteConfig;
    if (!features) {
      features = {};
    }

    const adminItems = [];
    adminItems.push(
      <li key="admin-users" className={window.isAdminWindow && this.props.history.location.pathname.includes('/app/admin/users') ? 'selected' : ''}>
        <Link to="/app/admin/users">Users</Link>
        <span className="icon-thumbnail">
          <i className="fa fa-users" />
        </span>
      </li>
    );
    features.Invoice &&
      adminItems.push(
        <li key="admin-invoices" className={window.isAdminWindow && this.props.history.location.pathname.includes('/app/admin/invoices') ? 'selected' : ''}>
          <Link to="/app/admin/invoices">Invoices</Link>
          <span className="icon-thumbnail">
            <i className="fa fa-list-alt" />
          </span>
        </li>
      );

    adminItems.push(
      <li key="admin-networks" className={window.isAdminWindow && this.props.history.location.pathname.includes('/app/admin/networks') ? 'selected' : ''}>
        <Link to="/app/admin/networks">Dynamo</Link>
        <span className="icon-thumbnail">
          <i className="fa fa-desktop" />
        </span>
      </li>
    );

    features.Privatehive &&
      adminItems.push(
        <li key="admin-privatehive" className={window.isAdminWindow && this.props.history.location.pathname.includes('/app/admin/privatehive') ? 'selected' : ''}>
          <Link to="/app/admin/privatehive">Private Hive</Link>
          <span className="icon-thumbnail">
            <i className="fa fa-desktop" />
          </span>
        </li>
      );

    features.Paymeter &&
      adminItems.push(
        <li key="admin-paymeter" className={window.isAdminWindow && this.props.history.location.pathname.includes('/app/admin/paymeter') ? 'selected' : ''}>
          <Link to="/app/admin/paymeter">Paymeter</Link>
          <span className="icon-thumbnail">
            <i className="fa fa-cube" />
          </span>
        </li>
      );
    // adminItems.push(
    //   <li key="admin-configs" className={window.isAdminWindow && this.props.history.location.pathname.includes('/app/admin/network-configs') ? 'selected' : ''}>
    //     <Link to="/app/admin/network-configs">Network Configs</Link>
    //     <span className="icon-thumbnail">
    //       <i className="fa fa-sliders" />
    //     </span>
    //   </li>
    // );
    features.Vouchers &&
      adminItems.push(
        <li key="admin-vouchers" className={window.isAdminWindow && this.props.history.location.pathname.includes('/app/admin/vouchers') ? 'selected' : ''}>
          <Link to="/app/admin/vouchers">Vouchers</Link>
          <span className="icon-thumbnail">
            <i className="fa fa-tags" />
          </span>
        </li>
      );
    features.SupportTicket &&
      adminItems.push(
        <li key="admin-support" className={window.isAdminWindow && this.props.history.location.pathname.includes('/app/admin/support') ? 'selected' : ''}>
          <Link to="/app/admin/support">Support</Link>
          <span className="icon-thumbnail">
            <i className="fa fa-ticket" />
          </span>
        </li>
      );
    (features.Paymeter || features.Hyperion) &&
      adminItems.push(
        <li key="admin-pricing" className={window.isAdminWindow && this.props.history.location.pathname.includes('/app/admin/pricing') ? 'selected' : ''}>
          <Link to="/app/admin/pricing">Pricing</Link>
          <span className="icon-thumbnail">
            <i className="fa fa-money" />
          </span>
        </li>
      );
    features.ClientDashboard &&
      adminItems.push(
        <li key="admin-clients">
          <a href="javascript:;">
            <span className="title">Clients</span>
            <span className="arrow" />
          </a>
          <span className="icon-thumbnail">
            <i className="fa fa-users" />
          </span>
          <ul className="sub-menu">
            <li className={this.props.history.location.pathname.includes('/app/admin/clients/list') ? 'selected' : ''}>
              <Link to="/app/admin/clients/list">List</Link>
            </li>
            <li className={this.props.history.location.pathname.includes('/app/admin/clients/features') ? 'selected' : ''}>
              <Link to="/app/admin/clients/features">Features</Link>
            </li>
          </ul>
        </li>
      );
    return (
      <nav className={`page-sidebar`} data-pages="sidebar">
        <div className="sidebar-overlay-slide from-top" id="appMenu">
          <div className="row">
            <div className="col-xs-6 no-padding">
              <a href="#" className="p-l-40">
                <img src="assets/img/demo/social_app.svg" alt="socail" />
              </a>
            </div>
            <div className="col-xs-6 no-padding">
              <a href="#" className="p-l-10">
                <img src="assets/img/demo/email_app.svg" alt="socail" />
              </a>
            </div>
          </div>
          <div className="row">
            <div className="col-xs-6 m-t-20 no-padding">
              <a href="#" className="p-l-40">
                <img src="assets/img/demo/calendar_app.svg" alt="socail" />
              </a>
            </div>
            <div className="col-xs-6 m-t-20 no-padding">
              <a href="#" className="p-l-10">
                <img src="assets/img/demo/add_more.svg" alt="socail" />
              </a>
            </div>
          </div>
        </div>
        <div className="sidebar-header">
          <img src="assets/img/logo/blockcluster-bw.png" alt="logo" className="brand" width="78" height="22" />
          <div className="sidebar-header-controls">
            <button type="button" className="btn btn-xs sidebar-slide-toggle btn-link m-l-20 hidden-md-down" data-pages-toggle="#appMenu">
              <i className="fa fa-angle-down fs-16" />
            </button>
            <button type="button" className="btn btn-link hidden-md-down" data-toggle-pin="sidebar">
              <i className="fa fs-12" />
            </button>
          </div>
        </div>
        <div className="sidebar-menu m-t-30">
          <ul className="menu-items">
            {!window.isAdminWindow && (
              <li className="m-t-30 " className={this.props.history.location.pathname.includes('/app/networks') ? 'selected' : ''}>
                <Link to={'/app/networks'} className="detailed">
                  <span className="title">Dynamo</span>
                  <span className="details">Manage Networks</span>
                </Link>
                <span className="icon-thumbnail">
                  <i className="fa fa-list" />
                </span>
              </li>
            )}
            {!window.isAdminWindow && features.Privatehive && (
              <li className={this.props.history.location.pathname.includes('/app/privatehive') ? 'selected' : ''}>
                <Link to="/app/privatehive" className="detailed">
                  <span className="title">Private Hive</span>
                  <span className="details">Hyperledger Fabric</span>
                </Link>
                <span className="icon-thumbnail">
                  <i className="fa fa-snowflake-o" />
                </span>
              </li>
            )}
            {features.Paymeter && !window.isAdminWindow && (
              <li className={this.props.history.location.pathname.includes('/app/paymeter') ? 'selected' : ''}>
                <Link to={'/app/paymeter'} className="detailed">
                  <span className="title">Paymeter</span>
                  <span className="details">Manage Wallets</span>
                </Link>
                <span className="icon-thumbnail">
                  <i className="fa fa-cube" />
                </span>
              </li>
            )}
            {features.Hyperion && !window.isAdminWindow && (
              <li className={this.props.history.location.pathname.includes('/app/hyperion') ? 'selected' : ''}>
                <Link to={'/app/hyperion'} className="detailed">
                  <span className="title">Hyperion</span>
                  <span className="details">Upload Files</span>
                </Link>
                <span className="icon-thumbnail">
                  <i className="fa fa-file" />
                </span>
              </li>
            )}
            {!window.isAdminWindow && (
              <li className={this.props.history.location.pathname.includes('/app/notifications') ? 'selected' : ''}>
                <Link to={'/app/notifications'}>Notifications</Link>
                <span className="icon-thumbnail">
                  <i className="fa fa-bell" />
                </span>
              </li>
            )}
            {!window.isAdminWindow && (
              <li className={this.props.history.location.pathname.includes('/app/platform-apis') ? 'selected' : ''}>
                <Link to={'/app/platform-apis'}>API Keys</Link>
                <span className="icon-thumbnail">
                  <i className="fa fa-key" />
                </span>
              </li>
            )}
            {(features.Payments || features.SupportTicket || features.Invoice) && !window.isAdminWindow && (
              <li>
                <a href="javascript:;">
                  <span className="title">Billing</span>
                  <span className="arrow" />
                </a>
                <span className="icon-thumbnail">
                  <i className="fa fa-credit-card" />
                </span>
                <ul className="sub-menu">
                  {features.Payments && (
                    <li className={this.props.history.location.pathname.includes('/app/payments') ? 'selected' : ''}>
                      <Link to="/app/payments">Payments</Link>
                      <span className="icon-thumbnail">
                        <i className="fa fa-money" />
                      </span>
                    </li>
                  )}
                  {features.Invoice && (
                    <li className={this.props.history.location.pathname.includes('/app/credits') ? 'selected' : ''}>
                      <Link to="/app/credits">Credits</Link>
                      <span className="icon-thumbnail">
                        <i className="fa fa-money" />
                      </span>
                    </li>
                  )}
                  {features.Invoice && (
                    <li className={this.props.history.location.pathname.includes('/app/billing') ? 'selected' : ''}>
                      <Link to="/app/billing">Bills</Link>
                      <span className="icon-thumbnail">
                        <i className="fa fa-list-alt" />
                      </span>
                    </li>
                  )}
                  {features.SupportTicket && (
                    <li className={this.props.history.location.pathname.includes('/app/support') ? 'selected' : ''}>
                      <Link to="/app/support">Support</Link>
                      <span className="icon-thumbnail">
                        <i className="fa fa-ticket" />
                      </span>
                    </li>
                  )}
                </ul>
              </li>
            )}
            {this.props.user && this.props.user.admin >= 1 && !window.isAdminWindow && (
              <li>
                <a href="javascript:;">
                  <span className="title">Admin</span>
                  <span className="arrow" />
                </a>
                <span className="icon-thumbnail">
                  <i className="fa fa-user-md" />
                </span>
                <ul className="sub-menu">{adminItems}</ul>
              </li>
            )}
            {this.props.user && this.props.user.admin >= 1 && window.isAdminWindow && adminItems}
          </ul>
          <div className="clearfix" />
        </div>
      </nav>
    );
  }
}

export default withTracker(() => {
  return {
    user: Meteor.user(),
  };
})(withRouter(Navbar));
