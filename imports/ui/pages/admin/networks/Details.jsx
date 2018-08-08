import React, { Component } from "react";
import { withTracker } from "meteor/react-meteor-data";
import helpers from "../../../../modules/helpers";
import { withRouter } from "react-router-dom";
import { Link } from "react-router-dom";
import moment from "moment";
import KubeDashboard from './components/KubeDashboard';

class NetworkList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      locations: [],
      page: 0,
      networkId: null,
      network: {},
      deleteConfirmAsked: false
    };
  }

  componentWillUnmount() {
    this.props.subscriptions.forEach(s => {
      s.stop();
    });
  }

  componentDidMount() {
    this.setState({
      networkId: this.props.match.params.id
    });
    Meteor.call(
      "fetchNetworkForAdmin",
      this.props.match.params.id,
      (err, res) => {
        if (err) {
          return console.log(err);
        }
        this.setState({
          network: res
        });
      }
    );
  }

  getNetworkType = config => {
    if (!config) {
      return null;
    }
    return `${config.cpu >= 100 ? config.cpu / 100 : config.cpu} vCPU | ${config.ram} GB | ${config.disk} GB`;
  };

  getNetworkTypeName = config => {
    if (!config) {
      return <span className="label label-info">None</span>;
    }
    if (config.cpu === 500 && config.ram === 1 && config.disk === 5) {
      return <span className="label label-info">Light</span>;
    } else if (config.cpu === 2000 && config.ram >= 7.5 && config.ram <= 8) {
      return <span className="label label-info">Power</span>;
    }
    return <span className="label label-info">Custom</span>;
  };

  getNetworkStatus = (status) => {
      if (status === "initializing" || status === "pending") {
          return <span className="label label-inverse">Initializing</span>
      } else if (status === "running" || status === "completed") {
          return <span className="label label-success">Running</span>
      } else if (status === "down" || status === "cancelled") {
          return <span className="label label-important">Down</span>
      } else {
          return <span className="label label-primary">Default</span>
      }
  }

  deleteNode = () => {
    if(!this.state.deleteConfirmAsked) {
      return this.setState({
        deleteConfirmAsked: true
      })
    }

    Meteor.call("deleteNetwork", this.state.network.network.instanceId, (err, res) => {
      if(!err){
        this.props.history.push("/admin/app/networks/");
      }
    });
  }

  render() {
    const {
      network,
      user,
      locations,
      voucher,
      networkType,
      bill
    } = this.state.network;
    console.log(this.state);
    if (!user) {
      const LoadingView = (
        <div
          className="d-flex justify-content-center flex-column full-height"
          style={{
            marginTop: "250px",
            paddingBottom: "250px",
            paddingLeft: "250px"
          }}
        >
          <div id="loader" />
          <br />
          <p style={{ textAlign: "center", fontSize: "1.2em" }}>
            Just a minute
          </p>
        </div>
      );
      return LoadingView;
    }

    return (
      <div className="page-content-wrapper ">
        <div className="content sm-gutter">
          <div data-pages="parallax">
            <div className="container-fluid p-l-25 p-r-25 sm-p-l-0 sm-p-r-0">
              <div className="inner">
                <ol className="breadcrumb sm-p-b-5">
                  <li className="breadcrumb-item">
                    <Link to="/admin/app">Admin</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link to="/admin/app/networks">Networks</Link>
                  </li>
                  <li className="breadcrumb-item active">
                    {this.state.networkId}
                  </li>
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
                      User <i className="fa fa-circle text-complete fs-11" />
                    </h5>
                    <div className="pull-right small hint-text">
                      Details <i className="fa fa-comment-o" />
                    </div>
                    <div className="clearfix" />
                  </div>
                  <div className="card-description">
                    <p>
                      {user.profile.firstName} {user.profile.lastName}
                    </p>
                  </div>
                </div>
                <div className="card no-border widget-loader-bar m-b-10">
                  <div className="container-xs-height full-height">
                    <div className="row-xs-height">
                      <div className="col-xs-height col-top">
                        <div className="card-header  top-left top-right">
                          <div className="card-title">
                            <span className="font-montserrat fs-11 all-caps">
                              Email <i className="fa fa-chevron-right" />
                            </span>
                          </div>

                        </div>
                      </div>
                    </div>
                    <div className="row-xs-height">
                      <div className="col-xs-height col-top">
                        <div className="p-l-20 p-t-50 p-b-40 p-r-20">
                          <p className="no-margin p-b-5">
                            {user.emails[0].address}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="row-xs-height">
                      <div className="col-xs-height col-bottom">
                        <div className="progress progress-small m-b-0">
                          <div
                            className="progress-bar progress-bar-primary"
                            style={{
                              width: "100%"
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-4 col-sm-6  d-flex flex-column">
                <div
                  className="card social-card share  full-width m-b-10 no-border"
                  data-social="item"
                >
                  <div className="card-header clearfix">
                    <h5 className="text-success pull-left fs-12">
                     Network Info
                    </h5>
                    <div className="clearfix" />
                  </div>
                  <div className="card-description">
                  {this.getNetworkStatus(network.status)}&nbsp;{helpers.firstLetterCapital(network.name)}
                    <br />
                    <span style={{fontSize: '10px', color: '#888'}}>
                      Created On: {moment(network.createdAt).format('DD-MMM-YYYY HH:mm:SS')}
                    </span>
                  </div>
                  <div className="clearfix" />
                </div>
                <div
                  className="card social-card share  full-width m-b-10 no-border"
                  data-social="item"
                >
                  <div className="card-header clearfix">
                    <h5 className="text-danger pull-left fs-12">
                     Actions
                    </h5>
                    <div className="clearfix" />
                  </div>
                  <div className="card-description">
                    <button className="btn btn-danger" onClick={this.deleteNode} disabled={!!network.deletedAt}>{!!network.deletedAt ? "Already deleted" : this.state.deleteConfirmAsked ? "Are you sure? This is irreversible" : "Delete Node"}</button>
                  </div>
                  <div className="clearfix" />
                </div>
              </div>
              <div className="col-lg-5 col-sm-6 d-flex flex-column">
                <div
                  className="card social-card share  full-width m-b-10 no-border"
                  data-social="item"
                >
                  <div className="card-header clearfix">
                    <h5 className="text-info pull-left fs-12">
                      Network Config
                    </h5>
                    <div className="clearfix" />
                  </div>
                  <div className="card-description" >
                    {this.getNetworkType(network.networkConfig)}
                  </div>
                  <div className="clearfix" />
                </div>
                  {voucher &&
                  <div>
                    <div
                  className="card social-card share  full-width m-b-10 no-border"
                  data-social="item">
                    <div className="card-header clearfix">
                      <h5 className="text-primary pull-left fs-12">
                        Voucher
                      </h5>
                      <div className="clearfix" />
                    </div>
                    <div className="card-description"  style={{fontSize: '0.8em', color: '#888'}}>
                      <h5>{voucher.code}&nbsp;|&nbsp;<span  style={{fontSize: '0.8em', color: '#888'}}>{this.getNetworkType(voucher.networkConfig)}</span></h5>
                      {voucher.isDiskChangeable ? "Disk configurable" : null}
                      <p>Expires on: {moment(voucher.expiryDate).format('DD-MMM-YYYY')}</p>
                    </div>

                    <div className="clearfix" />
                  </div>
                </div>
                }
              </div>
            </div>
              <div className="row">
                <div className="col-md-12">
                  <KubeDashboard instanceId={network.instanceId} />
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
})(withRouter(NetworkList));
