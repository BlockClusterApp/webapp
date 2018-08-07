import React, { Component } from "react";
import { Link } from "react-router-dom";
import { withTracker } from "meteor/react-meteor-data";
import Config from "../../../modules/config/client";

class Navbar extends Component {
  componentWillUnmount() {
    this.props.subscriptions.forEach(s => {
      s.stop();
    });
  }

  componentDidMount() {
    $.Pages.init();
  }

  componentDidUpdate() {
    $.Pages.init();
  }

  render() {
    return (
      <nav className="page-sidebar" data-pages="sidebar">
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
          <img
            src="assets/img/logo/blockcluster-bw.png"
            alt="logo"
            className="brand"
            width="78"
            height="22"
          />
          <div className="sidebar-header-controls">
            <button
              type="button"
              className="btn btn-xs sidebar-slide-toggle btn-link m-l-20 hidden-md-down"
              data-pages-toggle="#appMenu"
            >
              <i className="fa fa-angle-down fs-16" />
            </button>
            <button
              type="button"
              className="btn btn-link hidden-md-down"
              data-toggle-pin="sidebar"
            >
              <i className="fa fs-12" />
            </button>
          </div>
        </div>
        <div className="sidebar-menu">
          <ul className="menu-items">
            <li className="m-t-30 ">
              <Link to={"/admin/app/users"}>
                <span className="title">Users</span>
              </Link>
              <span className="icon-thumbnail">
                <i className="fa fa-list" />
              </span>
            </li>
            <li className="">
              <Link to="/admin/app/networks">
                <span className="title">Networks</span>
              </Link>
              <span className="icon-thumbnail">
                <i className="fa fa-cogs" />
              </span>
            </li>
            <li>
            <Link to="/admin/app/vouchers">
                <span className="title">Vouchers</span>
              </Link>
              <span className="icon-thumbnail">
                <i className="fa fa-credit-card" />
              </span>
            </li>
            {this.props.user &&
              this.props.user.admin >= 2 && (
                <li className="">
                  <Link to="/admin/app">Admin</Link>
                </li>
              )}
          </ul>
          <div className="clearfix" />
        </div>
      </nav>
    );
  }
}

export default withTracker(() => {
  return {
    kuberREST_IP: Config.kubeRestApiHost,
    subscriptions: [Meteor.subscribe("utilities")]
  };
})(Navbar);
