import React, { Component } from "react";
import { withTracker } from "meteor/react-meteor-data";
import helpers from "../../../../modules/helpers";
import { withRouter } from "react-router-dom";
import { Link } from "react-router-dom";
import moment from "moment";

class UserList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      locations: [],
      page: 0,
      userId: null,
      user: {},
      payment: {}
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
    Meteor.call(
      "fetchAdminDashboardDetails",
      this.props.match.params.id,
      (err, res) => {
        if (err) {
          return alert(`Error ${error.error}`);
        }
        this.setState({
          user: res
        });
      }
    );
  }

  getEmailVerificationLabel = verification => {
    if (verification) {
      return <span className="label label-success">Yes</span>;
    } else {
      return <span className="label label-important">No</span>;
    }
  };

  getEmailVerificationLabel = verification => {
    if (verification) {
      return <span className="label label-success">Verified</span>;
    } else {
      return <span className="label label-important">Not Verified</span>;
    }
  };

  getNetworkType = network => {
    if (!network.metadata) {
      return null;
    }
    if (network.metadata.networkConfig) {
      const config = network.metadata.networkConfig;
      return `${config.cpu} vCPU | ${config.ram} GB | ${config.disk} GB`;
    }
    if (network.metadata.voucher) {
      const config = network.metadata.voucher.networkConfig;
      return `${config.cpu} vCPU | ${config.ram} GB | ${config.disk} GB`;
    }

    return null;
  };

  getNetworkTypeName = network => {
    const config = network.networkConfig;
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

  getInvitationStatus = (int, inviteId, resendCount) => {
    switch (int) {
      case 2:
        return <span className="label label-success">Accepted</span>;
      case 3:
        return <span className="label label-danger">Rejected</span>;
      case 4:
        return <span className="label label-warn">Cancelled</span>;
      default:
      return <span className="label label-info">Pending</span>;
    }
  };

  convertStatusToTag = statusCode => {
    if (statusCode === 2) {
      return <span className="label label-success">Success</span>;
    } else if (statusCode === 3) {
      return <span className="label label-info">Refunded</span>;
    }
    return null;
  };


  render() {
    const user = this.state.user;
    if (!(user.details && user.details.profile)) {
      const LoadingView = (
        <div
          className="d-flex justify-content-center flex-column full-height"
          style={{ marginTop: "250px", paddingBottom: "250px", paddingLeft: '250px' }}
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

    const { cards, bill, invitations, payments, vouchers } = user;

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
                    <Link to="/admin/app/users">Users</Link>
                  </li>
                  <li className="breadcrumb-item active">
                    {this.state.userId}
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
                      {user.details.profile.firstName}{" "}
                      {user.details.profile.lastName}
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
                          <p className="no-margin p-b-5">
                            {user.details.emails[0].address}
                          </p>
                          <span className="small hint-text pull-left">
                            {this.getEmailVerificationLabel(
                              user.details.emails[0].verified
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="row-xs-height">
                      <div className="col-xs-height col-bottom">
                        <div className="progress progress-small m-b-0">
                          <div
                            className="progress-bar progress-bar-primary"
                            style={{
                              width: user.details.emails[0].verified
                                ? "100%"
                                : "0%"
                            }}
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
                              Bill <i className="fa fa-chevron-right" />
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
                          <h3 className="no-margin p-b-5">
                            $ {bill.totalAmount}
                          </h3>
                          <span className="small hint-text pull-left">
                            Free Node Usage
                          </span>
                          <span className="pull-right small text-danger">
                            {bill.totalFreeMicroHours.hours}/{1490 * 2} hrs
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="row-xs-height">
                      <div className="col-xs-height col-bottom">
                        <div className="progress progress-small m-b-0">
                          <div
                            className="progress-bar progress-bar-danger"
                            style={{
                              width: `${(bill.totalFreeMicroHours.hours * 100) /
                                (1490 * 2)}%`
                            }}
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
                      Credit Cards
                      <i className="fa fa-circle text-success fs-11" />
                    </h5>
                    <div className="clearfix" />
                  </div>
                  <div className="card-description">
                    {cards[0] && cards[0].cards.map(card => {
                      return (
                        <div key={card.last4}>
                          <h5 className="hint-text no-margin">
                            {card.issuer} XX..XX<span className="text-success">
                              {card.last4}
                            </span>
                          </h5>
                          <h5 className="small hint-text no-margin">
                            {card.network}
                          </h5>
                          <h5 className="m-b-0">
                            {card.name} |{" "}
                            {helpers.firstLetterCapital(card.type)}
                          </h5>
                        </div>
                      );
                    })}
                  </div>
                  <div className="card-footer clearfix">
                      {
                        cards[0] && (
                          <div>
                            <div className="pull-left">Added on</div>
                            <div className="pull-right hint-text">
                              {moment(cards[0].updatedAt).format("DD-MMM-YYYY")}
                            </div>
                          </div>
                        )
                      }
                    <div className="clearfix" />
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
                  <div
                    className="auto-overflow widget-11-2-table"
                    style={{ height: "375px" }}
                  >
                    <table className="table table-condensed table-hover">
                      <tbody>
                        {user.networks &&
                          user.networks
                            .sort((a, b) => b.createdOn - a.createdOn)
                            .map((network, index) => {
                              return (
                                <tr key={index + 1}>
                                  <td className="font-montserrat all-caps fs-12 w-40">
                                    <Link to={`/admin/app/networks/${network._id}`}>
                                      {network.name}
                                    </Link>
                                  </td>
                                  <td className="text-right b-r b-dashed b-grey w-35">
                                    <span className="hint-text small">
                                      {this.getNetworkType(network)}
                                    </span>
                                  </td>
                                  <td className="w-25">
                                    <span className="font-montserrat fs-18">
                                      {this.getNetworkTypeName(network)}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td>&nbsp;</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="container-fluid p-l-25 p-r-25 p-t-0 p-b-25 sm-padding-10">
            <div className="row">
              <div className="col-lg-5 m-b-10 d-flex">
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
                      <h2 className="text-success no-margin">Payments</h2>
                      <p className="no-margin">Previous Payments</p>
                    </div>
                    <h3 className="pull-right semi-bold">
                      {payments && payments.length}
                    </h3>
                    <div className="clearfix" />
                  </div>
                  <div
                    className="auto-overflow widget-11-2-table"
                    style={{ height: "275px" }}
                  >
                    <table className="table table-condensed table-hover">
                      <tbody>
                        {payments && payments.map((payment, index) => {
                          return (
                            <tr key={index + 1} onClick={() => {
                              this.setState({
                                selectedPayment: payment,
                                showPaymentModal: true
                              })
                            }} >
                              <td className="font-montserrat all-caps fs-12 w-40">
                                {payment.reason}
                              </td>
                              <td className="text-right b-r b-dashed b-grey w-25">
                                ₹{payment.amount / 100}
                              </td>
                              <td className="w-25">
                                <span className="font-montserrat fs-18">
                                  {this.convertStatusToTag(
                                    payment.paymentStatus
                                  )}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="col-lg-7 m-b-10 d-flex">
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
                      <h2 className="text-success no-margin">Invitations</h2>
                      <p className="no-margin">Invitation History</p>
                    </div>
                    <h3 className="pull-right semi-bold">
                      {invitations && invitations.length}
                    </h3>
                    <div className="clearfix" />
                  </div>
                  <div
                    className="auto-overflow widget-11-2-table"
                    style={{ height: "275px" }}
                  >
                    <table className="table table-condensed table-hover">
                      <tbody>
                        {invitations && invitations.map((invitation, index) => {
                          const data = invitation.metadata;
                          return (
                            <tr key={index + 1}>
                              <td className="font-montserrat fs-12 w-30" title={data.network.name}>
                                <Link to={`/admin/app/networks/${invitation.networkId}`}>{data.network.name}</Link>
                              </td>
                              <td className="text-right b-r b-dashed b-grey w-25" title={data.inviteTo.name | data.inviteTo.email}>
                                <Link to={`/admin/app/users/${invitation.inviteTo}`}>{data.inviteTo.email}</Link>
                              </td>
                              <td className="w-25">
                                <span className="font-montserrat fs-12">
                                  {this.getInvitationStatus(
                                    invitation.invitationStatus
                                  )}
                                </span>
                              </td>
                              <td className="w-25">
                                <span className="font-montserrat fs-12">
                                  {moment(invitation.createdAt).format('DD-MMM-YY')}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
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
