import React, { Component } from "react";
import { Link } from "react-router-dom";
import createHistory from "history/createBrowserHistory";
import { withTracker } from "meteor/react-meteor-data";

import RazorPay from "../../components/Razorpay/Razorpay.jsx";

import "./Header.scss";

class Header extends Component {
  logout = () => {
    Meteor.logout();
    localStorage.clear();
    sessionStorage.clear();
    this.props.history.push("/app/login");
  };

  render() {
    return (
      <div className="header ">
        <a
          href="#"
          className="btn-link toggle-sidebar hidden-lg-up pg pg-menu"
          data-toggle="sidebar"
        />
        <div className="">
          <div className="brand inline">
            <Link to="/app/networks">
            <img
              src="/assets/img/logo/blockcluster-bw.png"
              alt="logo"
              height="35"
            />
            </Link>
          </div>
          <ul className="hidden-md-down notification-list no-margin hidden-sm-down b-grey b-l no-style p-l-30 p-r-20">
            <li className="p-r-10 inline" title="Create Network">
              <Link
                to={"/app/createNetwork"}
                className="header-icon fa fa-plus"
              />
            </li>
            <li className="p-r-10 inline" title="Join Network">
              <Link
                to={"/app/join/networks"}
                className="header-icon fa fa-user-plus"
              />
            </li>
            <li className="p-r-10 inline" title="Manage Invitations">
              <Link to="/app/invites" className="header-icon fa fa-group" />
            </li>
            <li className="p-r-10 inline">
                <Link target="_blank" to={"//docs.blockcluster.io"} className="header-icon fa fa-book">
                </Link>
            </li>
            {/* <li className="p-r-10 inline">
                <Link  to="/app/support" className="header-icon fa fa-ticket">
                </Link>
            </li> */}
            {/* <li className="inline">
              <RazorPay paymentHandler={() => {}} paymentNotes={{}} />
            </li> */}
          </ul>
        </div>
        {/* <div className="d-flex align-items-center">
          <div className="dropdown">
            <div
              className="dropdown-toggle d-flex align-items-center"
              data-toggle="dropdown"
              aria-haspopup="true"
              aria-expanded="false"
            >
              <div className="pull-left p-r-10 fs-14 font-heading hidden-md-down">
                <span className="semi-bold">
                  {this.props.user ? this.props.user.profile.firstName : ""}
                </span>&nbsp;
                <span className="text-master">
                  {this.props.user ? this.props.user.profile.lastName : ""}
                </span>
              </div>
              <div className="pull-right hidden-md-down ">
                <button className="profile-dropdown-toggle">
                  <span className="thumbnail-wrapper d32 circular inline">
                    <img
                      src="/assets/img/icons/profile.png"
                      alt=""
                      width="32"
                      height="32"
                    />
                  </span>
                </button>
              </div>
            </div>

            <ul className="dropdown-menu">
              <li>
                <Link to="/app/profile">Profile</Link>
              </li>
            </ul>
          </div>
          <a
            href="#"
            onClick={this.logout}
            className="header-icon pg pg-power btn-link m-l-10 sm-no-margin d-inline-block"
            data-toggle="quickview"
            data-toggle-element="#quickview"
          />
        </div> */}
        <div className="d-flex align-items-center">
                    <div className="pull-left p-r-10 fs-14 font-heading hidden-md-down">
                        <span className="semi-bold">{this.props.user?this.props.user.profile.firstName:''}</span> <span className="text-master">{this.props.user?this.props.user.profile.lastName:''}</span>
                    </div>
                    <div className="dropdown pull-right hidden-md-down">
                        <button className="profile-dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                            <span className="thumbnail-wrapper d32 circular inline">
                                <img src="/assets/img/icons/profile.png" alt="" width="32" height="32" />
                            </span>
                        </button>
                    </div>
                    <a href="#" onClick={this.logout} className="header-icon pg pg-power btn-link m-l-10 sm-no-margin d-inline-block" data-toggle="quickview" data-toggle-element="#quickview"></a>
                </div>
      </div>
    );
  }
}

export default withTracker(() => {
  return {
    user: Meteor.user()
  };
})(Header);
