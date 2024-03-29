import React, { Component } from 'react';
import { Link, withRouter } from 'react-router-dom';
import createHistory from 'history/createBrowserHistory';
import { withTracker } from 'meteor/react-meteor-data';

import RazorPay from '../../components/Razorpay/Razorpay.jsx';

import './Header.scss';

class Header extends Component {
  logout = () => {
    localStorage.clear();
    sessionStorage.clear();
    this.props.history.push('/app/login');
    Meteor.logout();
  };

  openProfile = () => {
    this.props.history.push('/app/profile');
  };

  render() {
    return (
      <div className={`header`}>
        <a href="#" className="btn-link toggle-sidebar hidden-lg-up pg pg-menu" data-toggle="sidebar" />
        <div className="">
          <div className="brand inline">
            <Link to="/app/networks">
              <img src="/assets/img/logo/blockcluster-bw.png" alt="logo" height="35" />
            </Link>
          </div>
          {!window.isAdminWindow && (
            <ul className="hidden-md-down notification-list no-margin hidden-sm-down b-grey b-l no-style p-l-30 p-r-20">
              <li className="p-r-10 inline" title="Create Network">
                <Link to={'/app/createNetwork'} className="header-icon fa fa-plus" />
              </li>
              <li className="p-r-10 inline" title="Join Network">
                <Link to={'/app/join/networks'} className="header-icon fa fa-user-plus" />
              </li>
              <li className="p-r-10 inline" title="Manage Invitations">
                <Link to="/app/invites" className="header-icon fa fa-group" />
              </li>
              <li className="p-r-10 inline">
                <Link target="_blank" to={'//docs.blockcluster.io'} className="header-icon fa fa-book" />
              </li>
            </ul>
          )}
          {window.isAdminWindow && (
            <ul className="hidden-md-down notification-list no-margin hidden-sm-down b-grey b-l no-style p-l-30 p-r-20">
              <li className="p-r-10 inline" title="Overview">
                <Link to={'/app/admin/overview'} className="header-icon fa fa-eye" />
              </li>
            </ul>
          )}
        </div>

        <div className="d-flex align-items-center">
          <div className="pull-left p-r-10 fs-14 font-heading hidden-md-down" onClick={this.openProfile} style={{ cursor: 'pointer' }}>
            <span className="semi-bold">{this.props.user ? this.props.user.profile.firstName : ''}</span>{' '}
            <span className="text-master">{this.props.user ? this.props.user.profile.lastName : ''}</span>
          </div>
          <div className="dropdown pull-right hidden-md-down" onClick={this.openProfile} style={{ cursor: 'pointer' }}>
            <button className="profile-dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
              <span className="thumbnail-wrapper d32 circular inline">
                <img src="/assets/img/icons/profile.png" alt="" width="32" height="32" />
              </span>
            </button>
          </div>
          <a
            href="#"
            onClick={this.logout}
            className="header-icon pg pg-power btn-link m-l-10 sm-no-margin d-inline-block"
            data-toggle="quickview"
            data-toggle-element="#quickview"
          />
        </div>
      </div>
    );
  }
}

export default withTracker(() => {
  return {
    user: Meteor.user(),
  };
})(withRouter(Header));
