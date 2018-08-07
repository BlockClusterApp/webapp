import React, { Component } from "react";
import { withTracker } from "meteor/react-meteor-data";
import { Networks } from "../../../../collections/networks/networks.js";
import helpers from "../../../../modules/helpers";
import { withRouter } from "react-router-dom";
import { ReactiveVar } from "meteor/reactive-var";
import moment from "moment";

class UserList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      locations: [],
      page: 0,
      userId: null,
      user: {}
    };
  }

  componentWillUnmount() {
    this.props.subscriptions.forEach(s => {
      s.stop();
    });
  }

  componentDidMount() {
    this.setState({
      userId: this.props.match.params.id
    });
    Meteor.call("fetchAdminDashboardDetails", this.props.match.params.id, (err, res)=>{
      if(err){
        return alert(`Error ${error.error}`)
      }
      this.setState({
        user: res
      });
    });
  }

  getEmailVerificationLabel = verification => {
    if (verification) {
      return <span className="label label-success">Yes</span>;
    } else {
      return <span className="label label-important">No</span>;
    }
  };


  getNetworkType = (network) => {
    if(!network.metadata){
      return null;
    }
    if(network.metadata.networkConfig) {
      const config = network.metadata.networkConfig;
      return `${config.cpu} vCPU | ${config.ram} GB | ${config.disk} GB`
    }
    if(network.metadata.voucher) {
      const config = network.metadata.voucher.networkConfig;
      return `${config.cpu} vCPU | ${config.ram} GB | ${config.disk} GB`
    }

    return null;
  }

  getNetworkTypeName = (network) => {
    const config = network.networkConfig;
    if(!config){
      return <span className="label label-info">None</span>
    }
    if(config.cpu === 500 && config.ram === 1 && config.disk === 5){
      return <span className="label label-info">Light</span>
    } else if(config.cpu === 2000 && config.ram >= 7.5 && config.ram <= 8){
      return <span className="label label-info">Power</span>
    }
    return <span className="label label-info">Custom</span>
  }

  render() {

    const user = this.state.user;
    if(!user){
      return null;
    }

    return (
          <div className="page-content-wrapper ">
            <div className="content sm-gutter">
              <div data-pages="parallax">
                <div className="container-fluid p-l-25 p-r-25 sm-p-l-0 sm-p-r-0">
                  <div className="inner">
                    <ol className="breadcrumb sm-p-b-5">
                      <li className="breadcrumb-item">
                        <a href="/admin/app">Admin</a>
                      </li>
                      <li className="breadcrumb-item" ><a href="/admin/app/users">Users</a></li>
                      <li className="breadcrumb-item active">{this.state.userId}</li>
                    </ol>
                  </div>
                </div>
              </div>
              <div className="container-fluid p-l-25 p-r-25 p-t-0 p-b-25 sm-padding-10">
                <div className="row">
                  <div className="col-lg-3 col-sm-6  d-flex flex-column">
                    <div
                      className="card social-card share  full-width m-b-10 no-border"
                      data-social="item"
                    >
                      <div className="card-header ">
                        <h5 className="text-primary pull-left fs-12">
                          Update <i className="fa fa-circle text-complete fs-11" />
                        </h5>
                        <div className="pull-right small hint-text">
                          5,345 <i className="fa fa-comment-o" />
                        </div>
                        <div className="clearfix" />
                      </div>
                      <div className="card-description">
                        <h3>
                          page dashboard Version 3.0 now release with limitless
                          layout possibilities
                        </h3>
                      </div>
                      <div className="card-footer clearfix">
                        <div className="pull-left">
                          via <span className="text-complete">Pages</span>
                        </div>
                        <div className="pull-right hint-text">July 23</div>
                        <div className="clearfix" />
                      </div>
                    </div>
                    <div className="card no-border widget-loader-bar m-b-10">
                      <div className="container-xs-height full-height">
                        <div className="row-xs-height">
                          <div className="col-xs-height col-top">
                            <div className="card-header  top-left top-right">
                              <div className="card-title">
                                <span className="font-montserrat fs-11 all-caps">
                                  Weekly Sales <i className="fa fa-chevron-right" />
                                </span>
                              </div>
                              <div className="card-controls">
                                <ul>
                                  <li>
                                    <a
                                      href="#"
                                      className="portlet-refresh text-black"
                                      data-toggle="refresh"
                                    >
                                      <i className="portlet-icon portlet-icon-refresh" />
                                    </a>
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="row-xs-height">
                          <div className="col-xs-height col-top">
                            <div className="p-l-20 p-t-50 p-b-40 p-r-20">
                              <h3 className="no-margin p-b-5">$24,000</h3>
                              <span className="small hint-text pull-left">
                                71% of total goal
                              </span>
                              <span className="pull-right small text-primary">
                                $23,000
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="row-xs-height">
                          <div className="col-xs-height col-bottom">
                            <div className="progress progress-small m-b-0">
                              <div
                                className="progress-bar progress-bar-primary"
                                style={{width:"71%"}}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="card no-border widget-loader-bar m-b-10">
                      <div className="container-xs-height full-height">
                        <div className="row-xs-height">
                          <div className="col-xs-height col-top">
                            <div className="card-header  top-left top-right">
                              <div className="card-title">
                                <span className="font-montserrat fs-11 all-caps">
                                  Page Visits <i className="fa fa-chevron-right" />
                                </span>
                              </div>
                              <div className="card-controls">
                                <ul>
                                  <li>
                                    <a
                                      href="#"
                                      className="portlet-refresh text-black"
                                      data-toggle="refresh"
                                    >
                                      <i className="portlet-icon portlet-icon-refresh" />
                                    </a>
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="row-xs-height">
                          <div className="col-xs-height col-top">
                            <div className="p-l-20 p-t-50 p-b-40 p-r-20">
                              <h3 className="no-margin p-b-5">423</h3>
                              <span className="small hint-text pull-left">
                                22% higher
                              </span>
                              <span className="pull-right small text-danger">
                                $23,000
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="row-xs-height">
                          <div className="col-xs-height col-bottom">
                            <div className="progress progress-small m-b-0">
                              <div
                                className="progress-bar progress-bar-danger"
                                style={{width: '15%'}}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-3 col-sm-6  d-flex flex-column">
                    <div
                      className="card social-card share  full-width m-b-10 no-border"
                      data-social="item"
                    >
                      <div className="card-header clearfix">
                        <h5 className="text-success pull-left fs-12">
                          Stock Market{" "}
                          <i className="fa fa-circle text-success fs-11" />
                        </h5>
                        <div className="pull-right small hint-text">
                          5,345 <i className="fa fa-comment-o" />
                        </div>
                        <div className="clearfix" />
                      </div>
                      <div className="card-description">
                        <h5 className="hint-text no-margin">Apple Inc.</h5>
                        <h5 className="small hint-text no-margin">
                          NASDAQ: AAPL - Nov 13 8:37 AM ET
                        </h5>
                        <h3 className="m-b-0">
                          111.25{" "}
                          <span className="text-success">
                            <i className="fa fa-sort-up small text-success" /> 0.15
                          </span>
                        </h3>
                      </div>
                      <div className="card-footer clearfix">
                        <div className="pull-left">
                          by <span className="text-success">John Smith</span>
                        </div>
                        <div className="pull-right hint-text">Apr 23</div>
                        <div className="clearfix" />
                      </div>
                    </div>
                    <div
                      className="card social-card share share-other full-width m-b-10 d-flex flex-1 full-height no-border sm-vh-75"
                      data-social="item"
                    >
                      <div
                        className="circle"
                        data-toggle="tooltip"
                        title="Label"
                        data-container="body"
                      />
                      <div
                        className="card-content flex-1"
                        data-pages-bg-image="assets/img/social_new.jpg"
                      >
                        <ul className="buttons ">
                          <li>
                            <a href="#">
                              <i className="fa fa-expand" />
                            </a>
                          </li>
                          <li>
                            <a href="#">
                              <i className="fa fa-heart-o" />
                            </a>
                          </li>
                        </ul>
                      </div>
                      <div className="card-description">
                        <p>
                          <a href="#">#TBT</a> :D
                        </p>
                      </div>
                      <div className="card-footer clearfix">
                        <div className="time">few seconds ago</div>
                        <ul className="reactions">
                          <li>
                            <a href="#">
                              5,345 <i className="fa fa-comment-o" />
                            </a>
                          </li>
                          <li>
                            <a href="#">
                              23K <i className="fa fa-heart-o" />
                            </a>
                          </li>
                        </ul>
                      </div>
                      <div className="card-header clearfix">
                        <div className="user-pic">
                          <img
                            alt="Avatar"
                            width="33"
                            height="33"
                            data-src-retina="assets/img/profiles/avatar_small2x.jpg"
                            data-src="assets/img/profiles/avatar.jpg"
                            src="assets/img/profiles/avatar_small2x.jpg"
                          />
                        </div>
                        <h5>David Nester</h5>
                        <h6>Shared a link on your wall</h6>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-6 m-b-10 d-flex">
                    <div className="widget-11-2 card no-border card-condensed no-margin widget-loader-circle align-self-stretch d-flex flex-column">
                      <div className="card-header top-right">
                        <div className="card-controls">
                          <ul>
                            <li>
                              <a
                                data-toggle="refresh"
                                className="portlet-refresh text-black"
                                href="#"
                              >
                                <i className="portlet-icon portlet-icon-refresh" />
                              </a>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div className="padding-25">
                        <div className="pull-left">
                          <h2 className="text-success no-margin">Networks</h2>
                          <p className="no-margin">Network History</p>
                        </div>
                        <h3 className="pull-right semi-bold">
                          {user.networks && user.networks.length}
                        </h3>
                        <div className="clearfix" />
                      </div>
                      <div className="auto-overflow widget-11-2-table" style={{height: '375px'}}>
                        <table className="table table-condensed table-hover">
                          <tbody>
                            {
                              user.networks && user.networks.map((network, index) => {
                                return (
                                  <tr key={index+1}>
                                    <td className="font-montserrat all-caps fs-12 w-40">
                                      {network.name}
                                    </td>
                                    <td className="text-right b-r b-dashed b-grey w-35">
                                      <span className="hint-text small">{this.getNetworkType(network)}</span>
                                    </td>
                                    <td className="w-25">
                                      <span className="font-montserrat fs-18">{this.getNetworkTypeName(network)}</span>
                                    </td>
                                  </tr>
                                )
                              })
                            }
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
    );
  }
}

export default withTracker(() => {
  return {
    users: Meteor.users.find({}).fetch(),
    subscriptions: [Meteor.subscribe("users.all", { page: 0 })]
  };
})(withRouter(UserList));
