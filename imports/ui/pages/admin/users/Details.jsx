import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import helpers from '../../../../modules/helpers';
import { withRouter } from 'react-router-dom';
import { Link } from 'react-router-dom';
import moment from 'moment';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';
import PaymentModal from './components/PaymentModal';

import { Hyperion } from '../../../../collections/hyperion/hyperion';
import { Paymeter } from '../../../../collections/paymeter/paymeter';
import { Networks } from '../../../../collections/networks/networks';
import { UserInvitation } from '../../../../collections/user-invitation';
import { RZPaymentLink } from '../../../../collections/razorpay';
import HyperionPricing from '../../../../collections/pricing/hyperion';
import PaymeterPricing from '../../../../collections/pricing/paymeter';
import Credits from '../../../../collections/payments/credits';
import UserCards from '../../../../collections/payments/user-cards';
import PaymentRequests from '../../../../collections/payments/payment-requests';
import Voucher from '../../../../collections/vouchers/voucher';
import Invoice from '../../../../collections/payments/invoice';
import notifications from '../../../../modules/notifications';
import LoadButton from './components/LoadButton';

class UserDetails extends Component {
  constructor(props) {
    super(props);

    this.state = {
      locations: [],
      page: 0,
      userId: null,
      user: {},
      payment: {},
      remoteConfig: window.RemoteConfig,
      hyperionPricing: HyperionPricing.findOne({ active: true }),
      paymeterPricing: PaymeterPricing.findOne({ active: true }),
    };

    this.subscriptionTypes = [];
    this.subscriptions = [];
  }

  componentWillUnmount() {
    this.props.subscriptions.forEach(s => {
      s.stop();
    });
    this.subscriptions.forEach(s => {
      s.stop();
    });
    window.removeEventListener('RemoteConfigChanged', this.RemoteConfigListener);
  }

  componentDidMount() {
    this.RemoteConfigListener = () => {
      this.setState({
        remoteConfig: window.RemoteConfig,
      });
    };
    window.addEventListener('RemoteConfigChanged', this.RemoteConfigListener);
    this.setState({
      userId: this.props.match.params.id,
    });
    this.fetchBilling();
  }

  fetchBilling() {
    Meteor.call('fetchAdminDashboardDetails', this.props.match.params.id, (err, res) => {
      if (err) {
        return alert(`Error ${err.error}`);
      }
      this.setState({
        user: res,
      });
    });
  }

  verifyEmail = (verified, email) => {
    Meteor.call('adminVerifyEmail', { userId: this.props.match.params.id, verified, email }, (err, res) => {});
  };

  getEmailVerificationLabel = (verification, email) => {
    if (email) {
      if (verification) {
        return (
          <button className="btn btn-success" onClick={this.verifyEmail.bind(this, false, email)}>
            Verified
          </button>
        );
      } else {
        return (
          <button className="btn btn-important" onClick={this.verifyEmail.bind(this, true, email)}>
            Not Verified
          </button>
        );
      }
    } else {
      if (verification) {
        return <span className="label label-success">Verified</span>;
      } else {
        return <span className="label label-danger">Not Verified</span>;
      }
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

  copyText = text => {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    notifications.success('Link copied');
  };

  getNetworkTypeName = network => {
    const config = network.networkConfig;
    if (!config) {
      return <span className="label label-info">None</span>;
    }
    if (config.cpu === 500 && config.ram === 1 && config.disk === 50) {
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

  convertInvoiceStatusToTag = statusCode => {
    if (statusCode === 2) {
      return <span className="label label-success">Paid</span>;
    } else if (statusCode === 1) {
      return <span className="label label-info">Pending</span>;
    } else if (statusCode === 3) {
      return <span className="label label-success">Demo User</span>;
    } else if (statusCode === 4) {
      return <span className="label label-danger">Failed</span>;
    }
    return null;
  };

  convertPaymentLinkStatusToTag = status => {
    if (status === 'issued') {
      return <span className="label label-info">Issued</span>;
    } else if (status === 'paid') {
      return <span className="label label-success">Paid</span>;
    } else if (status === 'cancelled') {
      return <span className="label label-danger">Cancelled</span>;
    } else {
      return <span className="label label-info">{status}</span>;
    }
  };

  refundListener = () => {
    this.setState({
      showPaymentModal: false,
    });
  };

  createPaymentLink = () => {
    this.setState({
      paymentLinkLoading: true,
    });

    const params = {
      reason: this.paymentLinkReason.value,
      amountInUSD: Number(this.paymentLinkAmount.value),
      userId: this.props.match.params.id,
    };

    Meteor.call('createPaymentLink', params, (err, res) => {
      this.setState({
        paymentLinkLoading: false,
      });
      if (err) {
        notifications.error(err.reason);
        return false;
      }
      this.setState({
        generatedLink: res,
      });
      notifications.success('Payment Link created');
    });
  };

  cancelPaymentLink = paymentLinkId => {
    this.setState({
      paymentLinkLoading: true,
    });
    Meteor.call('cancelPaymentLink', { paymentLinkId, userId: Meteor.userId(), reason: `Deleted by ${Meteor.user().emails[0].address}` }, (err, res) => {
      this.setState({
        paymentLinkLoading: false,
      });
      if (err) {
        return notifications.error(err.reason);
      }
      this.setState({
        generatedLink: null,
      });
      notifications.success('Link deleted successfully');
      return true;
    });
  };

  loadComponents = type => {
    if (this.subscriptionTypes.includes(type)) {
      return true;
    }
    const sub = Meteor.subscribe(
      type,
      { userId: this.props.match.params.id },
      {
        onReady: () => {
          const userId = this.props.match.params.id;
          const states = {
            networks: Networks.find({ user: userId }).fetch(),
            invitations: UserInvitation.find({ inviteFrom: userId }).fetch(),
            cards: UserCards.find({ userId }).fetch(),
            payments: PaymentRequests.find({ userId }).fetch(),
            vouchers: Voucher.find({ claimedBy: userId }).fetch(),
            invoices: Invoice.find({ userId }).fetch(),
            paymentLinks: RZPaymentLink.find({ userId }).fetch(),
            hyperion: Hyperion.findOne({ userId }),
            paymeter: Paymeter.findOne({ userId }),
            credits: Credits.find({ userId }).fetch(),
          };
          this.subscriptionTypes.push(type);
          this.setState({ ...this.state, ...states });
        },
      }
    );

    this.subscriptions.push(sub);
  };

  render() {
    const { user } = this.props;
    const { cards, invitations, payments, vouchers, networks, invoices, paymentLinks, hyperion, paymeter, credits, hyperionPricing, paymeterPricing } = this.state;

    if (!(user && user.profile)) {
      const LoadingView = (
        <div className="d-flex justify-content-center flex-column full-height" style={{ marginTop: '250px', paddingBottom: '250px', paddingLeft: '250px' }}>
          <div id="loader" />
          <br />
          <p style={{ textAlign: 'center', fontSize: '1.2em' }}>Just a minute</p>
        </div>
      );
      return LoadingView;
    }

    const { bill } = this.state.user;

    const { remoteConfig } = this.state;
    let { features } = remoteConfig;
    if (!features) {
      features = {};
    }

    return (
      <div className="page-content-wrapper ">
        <PaymentModal
          payment={this.state.selectedPayment}
          paymentLink={paymentLinks && this.state.selectedPayment && paymentLinks.find(link => link.paymentRequestId === this.state.selectedPayment._id)}
          refundListener={this.refundListener}
          showModal={this.state.showPaymentModal}
        />
        <div className="content sm-gutter">
          <div data-pages="parallax">
            <div className="container-fluid p-l-25 p-r-25 sm-p-l-0 sm-p-r-0">
              <div className="inner">
                <ol className="breadcrumb sm-p-b-5">
                  <li className="breadcrumb-item">
                    <Link to="/app/admin">Admin</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link to="/app/admin/users">Users</Link>
                  </li>
                  <li className="breadcrumb-item active">{this.state.userId}</li>
                </ol>
              </div>
            </div>
          </div>
          <div className="container-fluid p-l-25 p-r-25 p-t-0 p-b-25 sm-padding-10">
            <div className="row">
              <div className="col-lg-3 col-sm-6  d-flex flex-column">
                <div className="card social-card share  full-width m-b-10 no-border" data-social="item">
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
                  <div className="row-xs-height">
                    <div className="col-xs-height col-bottom fs-12" style={{ paddingLeft: '16px', paddingRight: '16px', paddingBottom: '10px' }}>
                      Admin&nbsp;&nbsp;
                      <input
                        type="checkbox"
                        value="1"
                        defaultChecked={user.admin > 0 ? 'checked' : ''}
                        id="checkbox2"
                        onClick={e => {
                          let admin = e.target.checked;
                          const updateQuery = {};
                          if (admin) {
                            updateQuery.admin = 2;
                          } else {
                            updateQuery.admin = 0;
                          }
                          Meteor.call('updateUserAdmin', user._id, updateQuery);
                        }}
                      />
                    </div>
                    <div className="col-xs-height col-bottom fs-12" style={{ paddingLeft: '16px', paddingRight: '16px', paddingBottom: '10px' }}>
                      Demo User&nbsp;&nbsp;
                      <input
                        type="checkbox"
                        value="1"
                        defaultChecked={user.demoUser > 0 ? 'checked' : ''}
                        id="checkbox3"
                        onClick={e => {
                          let demo = e.target.checked;
                          const updateQuery = {};
                          if (demo) {
                            updateQuery.demo = 1;
                          } else {
                            updateQuery.demo = 0;
                          }
                          Meteor.call('updateUserAdmin', user._id, updateQuery);
                        }}
                      />
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
                              Contact <i className="fa fa-chevron-right" />
                            </span>
                          </div>
                          <div className="card-controls">
                            <ul>
                              <li>
                                <a href="#" className="portlet-refresh text-black" data-toggle="refresh">
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
                          <p className="no-margin p-b-5">{user.emails[0].address}</p>
                          <span className="small hint-text pull-left">{this.getEmailVerificationLabel(user.emails[0].verified, user.emails[0].address)}</span>
                        </div>
                      </div>
                    </div>

                    {user.profile && user.profile.mobiles && user.profile.mobiles[0] && (
                      <div className="row-xs-height">
                        <div className="col-xs-height col-top">
                          <div className="p-l-20 p-b-40 p-r-20">
                            <p className="no-margin p-b-5">{user.profile.mobiles[0].number}</p>
                            <span className="small hint-text pull-left">{this.getEmailVerificationLabel(user.profile.mobiles[0].number)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="row-xs-height">
                    <div className="col-xs-height col-bottom">
                      <div className="progress progress-small m-b-0">
                        <div
                          className="progress-bar progress-bar-primary"
                          style={{
                            width: user.emails[0].verified ? '100%' : '0%',
                          }}
                        />
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
                                <a href="#" className="portlet-refresh text-black" data-toggle="refresh">
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
                          <h3 className="no-margin p-b-5">$ {Number(bill && bill.totalAmount).toFixed(2)}</h3>
                          <span className="small hint-text pull-left">Free Node Usage</span>
                          <span className="pull-right small text-danger">
                            {bill && bill.totalFreeMicroHours.hours}/{1490 * 2} hrs
                          </span>
                        </div>
                      </div>
                    </div>
                    {features.Invoice && (
                      <div className="row-xs-height">
                        <div className="col-xs-height col-bottom">
                          <div className="progress progress-small m-b-0">
                            <div
                              className="progress-bar progress-bar-danger"
                              style={{
                                width: `${bill && (bill.totalFreeMicroHours.hours * 100) / (1490 * 2)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="col-lg-3 col-sm-6  d-flex flex-column">
                <div className="card social-card share  full-width m-b-10 no-border" data-social="item">
                  <div className="card-header clearfix">
                    <h5 className="text-success pull-left fs-12">
                      Credit Cards
                      <i className="fa fa-circle text-success fs-11" />
                    </h5>
                    <div className="clearfix" />
                  </div>
                  <div className="card-description">
                    {cards &&
                      cards[0] &&
                      cards[0].cards.map((card, index) => {
                        return (
                          <div key={index}>
                            <h5 className="hint-text no-margin">
                              {card.issuer} XX..XX
                              <span className="text-success">{card.last4}</span>
                            </h5>
                            <h5 className="small hint-text no-margin">{card.network}</h5>
                            <h5 className="m-b-0">
                              {card.name} | {helpers.firstLetterCapital(card.type)}
                            </h5>
                          </div>
                        );
                      })}
                    {!(cards && cards[0]) && <LoadButton subscription="user.details.userCards" buttonText="Load Cards" onLoad={this.loadComponents} />}
                  </div>
                  <div className="card-footer clearfix">
                    {cards && cards[0] && (
                      <div>
                        <div className="pull-left">Added on</div>
                        <div className="pull-right hint-text">{moment(cards[0].updatedAt).format('DD-MMM-YYYY')}</div>
                      </div>
                    )}
                    <div className="clearfix" />
                  </div>
                </div>
              </div>
              <div className="col-lg-6 m-b-10 d-flex">
                <div className=" card no-border card-condensed no-margin widget-loader-circle align-self-stretch d-flex flex-column">
                  <div className="card-header top-right">
                    <div className="card-controls">
                      <ul>
                        <li>
                          <a data-toggle="refresh" className="portlet-refresh text-black" href="#">
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
                    <h3 className="pull-right semi-bold">{networks && networks.length}</h3>
                    <div className="clearfix" />
                  </div>
                  <div className="auto-overflow -table" style={{ maxHeight: '375px' }}>
                    <table className="table table-condensed table-hover">
                      <tbody>
                        {this.subscriptionTypes.includes('user.details.networks') &&
                          networks &&
                          networks
                            .sort((a, b) => b.createdOn - a.createdOn)
                            .map((network, index) => {
                              return (
                                <tr key={index + 1}>
                                  <td className="font-montserrat all-caps fs-12 w-40">
                                    <Link to={`/app/admin/networks/${network._id}`}>{network.name}</Link>
                                  </td>
                                  <td className="text-right b-r b-dashed b-grey w-35">
                                    <span className="hint-text small">{this.getNetworkType(network)}</span>
                                  </td>
                                  <td className="w-25">
                                    <span className="font-montserrat fs-18">{this.getNetworkTypeName(network)}</span>
                                  </td>
                                </tr>
                              );
                            })}
                        {!(this.subscriptionTypes.includes('user.details.networks') && networks) && (
                          <tr>
                            <td className="font-montserrat fs-12 w-100">
                              <LoadButton subscription="user.details.networks" buttonText="Load Networks" onLoad={this.loadComponents} />
                            </td>
                          </tr>
                        )}
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
              {features.Hyperion && (
                <div className="col-lg-6 m-b-10 d-flex">
                  <div className=" card no-border card-condensed no-margin widget-loader-circle align-self-stretch d-flex flex-column">
                    <div className="padding-25">
                      <div className="pull-left">
                        <h2 className="text-success no-margin">Hyperion</h2>
                        <p className="no-margin">Hyperion Statistics</p>
                      </div>
                    </div>
                    {this.subscriptionTypes.includes('user.details.hyperionStats') && hyperion && (
                      <div>
                        <div className="row card-block">
                          <div className="col-sm-6 col-md-6 col-lg-4">
                            <div className="widget-9 card no-border bg-success no-margin widget-loader-bar">
                              <div className="full-height d-flex flex-column">
                                <div className="card-header ">
                                  <div className="card-title text-black">
                                    <span className="font-montserrat fs-11 all-caps text-white">
                                      Disk Space Consumed <i className="fa fa-chevron-right" />
                                    </span>
                                  </div>
                                </div>
                                <div className="p-l-20">
                                  <h3 className="no-margin p-b-30 text-white ">{hyperion && <span>{helpers.bytesToSize(hyperion.size)}</span>}</h3>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="col-sm-6 col-md-6 col-lg-4">
                            <div className="widget-9 card no-border bg-warning no-margin widget-loader-bar">
                              <div className="full-height d-flex flex-column">
                                <div className="card-header ">
                                  <div className="card-title text-black">
                                    <span className="font-montserrat fs-11 all-caps text-white">
                                      Monthly Cost <i className="fa fa-chevron-right" />
                                    </span>
                                  </div>
                                </div>
                                <div className="p-l-20">
                                  <h3 className="no-margin p-b-30 text-white ">
                                    {hyperion && <span>${Number((hyperion.size / (1024 * 1024 * 1024)) * (hyperionPricing && hyperionPricing.perGBCost)).toFixed(2)}</span>}

                                    {!hyperion && <span>$0</span>}
                                  </h3>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="col-sm-12 col-lg-4">
                            <div className="widget-9 card no-border bg-complete no-margin widget-loader-bar">
                              <div className="full-height d-flex flex-column">
                                <div className="card-header ">
                                  <div className="card-title text-black">
                                    <span className="font-montserrat fs-11 all-caps text-white">
                                      This Month Invoice <i className="fa fa-chevron-right" />
                                    </span>
                                  </div>
                                </div>
                                <div className="p-l-20">
                                  <h3 className="no-margin p-b-30 text-white ">
                                    {hyperion && (
                                      <span>
                                        $
                                        {Math.max(
                                          (hyperion.size / (1024 * 1024 * 1024)) * (hyperionPricing && hyperionPricing.perGBCost) - hyperion.discount,
                                          hyperion.minimumFeeThisMonth
                                        ).toFixed(2)}
                                      </span>
                                    )}

                                    {!hyperion && <span>$0</span>}
                                  </h3>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-md-12">
                            <table className="table table-condensed table-hover">
                              <tbody>
                                <tr>
                                  <td className="font-montserrat fs-12 w-60">Minimum fee this month</td>
                                  <td className="text-right b-r b-dashed b-grey w-45">$ {Number(hyperion.minimumFeeThisMonth).toFixed(2)}</td>
                                </tr>
                                <tr>
                                  <td className="font-montserrat fs-12 w-60">Discount</td>
                                  <td className="text-right b-r b-dashed b-grey w-45">$ {Number(hyperion.discount).toFixed(5)}</td>
                                </tr>
                                <tr>
                                  <td className="font-montserrat fs-12 w-60">Vouchers</td>
                                  <td className="text-right b-r b-dashed b-grey w-45">
                                    {hyperion.vouchers.map(v => `${v.code} : ${moment(v.appliedOn).format('DD-MMM-YYYY HH:mm:SS')}`).join(', ')}
                                  </td>
                                </tr>
                                <tr>
                                  <td className="font-montserrat fs-12 w-60">Subscribed</td>
                                  <td className="text-right b-r b-dashed b-grey w-45">{hyperion.subscribed ? 'Yes' : 'No'}</td>
                                </tr>
                                <tr>
                                  <td className="font-montserrat fs-12 w-60">Unsubscribe next month</td>
                                  <td className="text-right b-r b-dashed b-grey w-45">{hyperion.unsubscribeNextMonth ? 'Yes' : 'No'}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                    {!(this.subscriptionTypes.includes('user.details.hyperionStats') && invitations) && (
                      <div className="row">
                        <div className="col-md-12 p-l-30 p-b-10">
                          <LoadButton subscription="user.details.hyperionStats" buttonText="Load Hyperion stats" onLoad={this.loadComponents} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {features.Paymeter && (
                <div className="col-lg-6 m-b-10 d-flex">
                  <div className=" card no-border card-condensed no-margin widget-loader-circle align-self-stretch d-flex flex-column">
                    <div className="padding-25">
                      <div className="pull-left">
                        <h2 className="text-success no-margin">Paymeter</h2>
                        <p className="no-margin">Paymeter Statistics</p>
                      </div>
                    </div>
                    {this.subscriptionTypes.includes('user.details.paymeterStats') && paymeter && (
                      <div>
                        <div className="row card-block">
                          <div className="col-sm-12 col-lg-12">
                            <div className="widget-9 card no-border bg-complete no-margin widget-loader-bar">
                              <div className="full-height d-flex flex-column">
                                <div className="card-header ">
                                  <div className="card-title text-black">
                                    <span className="font-montserrat fs-11 all-caps text-white">
                                      This Month Invoice <i className="fa fa-chevron-right" />
                                    </span>
                                  </div>
                                </div>
                                <div className="p-l-20">
                                  <h3 className="no-margin p-b-30 text-white ">
                                    {paymeter && <span>$ {Number(Math.max(paymeter.bill, paymeter.minimumFeeThisMonth)).toFixed(2)}</span>}

                                    {!paymeter && <span>$0</span>}
                                  </h3>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-md-12">
                            <table className="table table-condensed table-hover">
                              <tbody>
                                <tr>
                                  <td className="font-montserrat fs-12 w-60">Minimum fee this month</td>
                                  <td className="text-right b-r b-dashed b-grey w-45">$ {Number(paymeter.minimumFeeThisMonth).toFixed(2)}</td>
                                </tr>
                                <tr>
                                  <td className="font-montserrat fs-12 w-60">Vouchers</td>
                                  <td className="text-right b-r b-dashed b-grey w-45">
                                    {paymeter.vouchers.map(v => `${v.code} : ${moment(v.appliedOn).format('DD-MMM-YYYY HH:mm:SS')}`).join(', ')}
                                  </td>
                                </tr>
                                <tr>
                                  <td className="font-montserrat fs-12 w-60">Subscribed</td>
                                  <td className="text-right b-r b-dashed b-grey w-45">{paymeter.subscribed ? 'Yes' : 'No'}</td>
                                </tr>
                                <tr>
                                  <td className="font-montserrat fs-12 w-60">Unsubscribe next month</td>
                                  <td className="text-right b-r b-dashed b-grey w-45">{paymeter.unsubscribeNextMonth ? 'Yes' : 'No'}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                    {!(this.subscriptionTypes.includes('user.details.paymeterStats') && invitations) && (
                      <div className="row">
                        <div className="col-md-12 font-montserrat p-l-30 p-b-10">
                          <LoadButton subscription="user.details.paymeterStats" buttonText="Load Paymeter stats" onLoad={this.loadComponents} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {(features.Payments || features.Invoice) && (
              <div className="row">
                {features.Payments && (
                  <div className="col-lg-6 m-b-10 d-flex">
                    <div className=" card no-border card-condensed no-margin widget-loader-circle align-self-stretch d-flex flex-column">
                      <div className="card-header top-right">
                        <div className="card-controls">
                          <ul>
                            <li>
                              <a data-toggle="refresh" className="portlet-refresh text-black" href="#">
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
                        <h3 className="pull-right semi-bold">{payments && payments.length}</h3>
                        <div className="clearfix" />
                      </div>
                      <div className="auto-overflow -table" style={{ maxHeight: '275px' }}>
                        <table className="table table-condensed table-hover">
                          <tbody>
                            {this.subscriptionTypes.includes('user.details.payments') &&
                              payments &&
                              payments
                                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                .map((payment, index) => {
                                  return (
                                    <tr
                                      key={index + 1}
                                      onClick={() => {
                                        this.setState({
                                          selectedPayment: payment,
                                          showPaymentModal: true,
                                        });
                                      }}
                                    >
                                      <td className="font-montserrat all-caps fs-12 w-40">{payment.reason}</td>
                                      <td className="text-right b-r b-dashed b-grey w-25">₹{payment.amount / 100}</td>
                                      <td className="w-25">
                                        <span className="font-montserrat fs-18">{this.convertStatusToTag(payment.paymentStatus)}</span>
                                      </td>
                                    </tr>
                                  );
                                })}
                            {!(this.subscriptionTypes.includes('user.details.payments') && payments) && (
                              <tr>
                                <td className="font-montserrat fs-12 w-100">
                                  <LoadButton subscription="user.details.payments" buttonText="Load Payments" onLoad={this.loadComponents} />
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
                {features.Invoice && (
                  <div className="col-lg-6 m-b-10 d-flex">
                    <div className=" card no-border card-condensed no-margin widget-loader-circle align-self-stretch d-flex flex-column">
                      <div className="card-header top-right">
                        <div className="card-controls">
                          <ul>
                            <li>
                              <a data-toggle="refresh" className="portlet-refresh text-black" href="#">
                                <i className="portlet-icon portlet-icon-refresh" />
                              </a>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div className="padding-25">
                        <div className="pull-left">
                          <h2 className="text-success no-margin">Invoices</h2>
                          <p className="no-margin">Customer business: $ {invoices && invoices.reduce((p, i) => p + Number(i.totalAmount), 0)}</p>
                        </div>
                        <h3 className="pull-right semi-bold">{invoices && invoices.length}</h3>
                        <div className="clearfix" />
                      </div>
                      <div className="auto-overflow -table" style={{ maxHeight: '275px' }}>
                        <table className="table table-condensed table-hover">
                          <tbody>
                            {this.subscriptionTypes.includes('user.details.invoices') &&
                              invoices &&
                              invoices.map((invoice, index) => {
                                return (
                                  <tr key={index + 1}>
                                    <td className="font-montserrat fs-12 w-40">
                                      <Link to={`/app/admin/invoices/${invoice._id}`}>{invoice.billingPeriodLabel}</Link>
                                    </td>
                                    <td className="text-right b-r b-dashed b-grey w-40">${invoice.totalAmount}</td>
                                    <td className="w-20">
                                      <span className="font-montserrat fs-12">{this.convertInvoiceStatusToTag(invoice.paymentStatus)}</span>
                                    </td>
                                  </tr>
                                );
                              })}
                            {!(this.subscriptionTypes.includes('user.details.invoices') && invoices) && (
                              <tr>
                                <td className="font-montserrat fs-12 w-100">
                                  <LoadButton subscription="user.details.invoices" buttonText="Load Invoices" onLoad={this.loadComponents} />
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {features.Payments && (
              <div className="row">
                <div className="col-lg-12 m-b-10 d-flex">
                  <div className=" card no-border card-condensed no-margin widget-loader-circle align-self-stretch d-flex flex-column">
                    <div className="padding-25">
                      <div className="pull-left">
                        <h2 className="text-success no-margin">Actions</h2>
                      </div>
                    </div>
                    <div className="row p-b-25">
                      <div className="p-l-25 p-r-25 col-md-12">
                        <h5 className="no-margin p-b-10">Create Payment Link</h5>
                        <div className="row">
                          <div className="col-md-7">
                            <div className="form-group form-group-default required">
                              <label>Reason</label>
                              <input
                                type="text"
                                className="form-control"
                                name="paymentReason"
                                required
                                ref={input => {
                                  this.paymentLinkReason = input;
                                }}
                              />
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="form-group form-group-default required">
                              <label>Amount (IN USD)</label>
                              <input
                                type="number"
                                className="form-control"
                                name="paymentAmount"
                                placeholder="$"
                                required
                                ref={input => {
                                  this.paymentLinkAmount = input;
                                }}
                              />
                            </div>
                          </div>
                          <div className="col-md-2">
                            <LaddaButton
                              disabled={this.state.paymentLinkCreationDisabled}
                              loading={this.state.paymentLinkLoading}
                              data-size={S}
                              data-style={SLIDE_UP}
                              data-spinner-size={30}
                              data-spinner-lines={12}
                              onClick={this.createPaymentLink}
                              className="btn btn-success"
                            >
                              <i className="fa fa-plus-circle" aria-hidden="true" />
                              &nbsp;&nbsp;Create
                            </LaddaButton>
                          </div>
                        </div>
                        {this.state.generatedLink && (
                          <div className="row">
                            <div className="col-md-7">
                              <div className="form-group form-group-default required">
                                <label>Link</label>
                                <input type="text" className="form-control" name="paymentReason" disabled value={this.state.generatedLink.short_url} />
                              </div>
                            </div>
                            <div className="col-md-4">
                              <LaddaButton
                                disabled={this.state.paymentLinkDeletionDisabled}
                                loading={this.state.paymentLinkLoading}
                                data-size={S}
                                data-style={SLIDE_UP}
                                data-spinner-size={30}
                                data-spinner-lines={12}
                                onClick={this.cancelPaymentLink.bind(this, this.state.generatedLink._id)}
                                className="btn btn-danger"
                              >
                                <i className="fa fa-minus-circle" aria-hidden="true" />
                                &nbsp;&nbsp;Delete
                              </LaddaButton>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="row">
              {features.Payments && (
                <div className="col-lg-6 m-b-10 d-flex">
                  <div className=" card no-border card-condensed no-margin widget-loader-circle align-self-stretch d-flex flex-column">
                    <div className="padding-25">
                      <div className="pull-left">
                        <h2 className="text-success no-margin">Payment Links</h2>
                        <p className="no-margin">All Payment Links</p>
                      </div>
                      <h3 className="pull-right semi-bold">{paymentLinks && paymentLinks.length}</h3>
                      <div className="clearfix" />
                    </div>
                    <div className="auto-overflow -table" style={{ maxHeight: '275px' }}>
                      <table className="table table-condensed table-hover">
                        <tbody>
                          {this.subscriptionTypes.includes('user.details.paymentLinks') &&
                            paymentLinks &&
                            paymentLinks.map((paymentLink, index) => {
                              return (
                                <tr key={index + 1}>
                                  <td className="font-montserrat fs-12 w-40" title={paymentLink.link}>
                                    <a href={paymentLink.short_url} target="_blank">
                                      {paymentLink.short_url}
                                    </a>
                                  </td>
                                  <td className="text-right b-r b-dashed b-grey w-30" title={paymentLink.reason}>
                                    {paymentLink.description}
                                  </td>
                                  <td className="w-15">{this.convertPaymentLinkStatusToTag(paymentLink.status)}</td>
                                  <td className="w-10">
                                    <div className="btn-group">
                                      <button className="btn btn-default" onClick={this.copyText.bind(this, paymentLink.short_url)} title="copy">
                                        <i className="fa fa-copy" />
                                      </button>
                                      <button className="btn btn-default" onClick={this.cancelPaymentLink.bind(this, paymentLink._id)} title="delete">
                                        <i className="fa fa-trash" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          {!(this.subscriptionTypes.includes('user.details.paymentLinks') && paymentLinks) && (
                            <tr>
                              <td className="font-montserrat fs-12 w-100">
                                <LoadButton subscription="user.details.paymentLinks" buttonText="Load Payment Links" onLoad={this.loadComponents} />
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
              <div className={`${features.Payments ? 'col-lg-6' : 'col-lg-12'} m-b-10 d-flex`}>
                <div className=" card no-border card-condensed no-margin widget-loader-circle align-self-stretch d-flex flex-column">
                  <div className="padding-25">
                    <div className="pull-left">
                      <h2 className="text-success no-margin">Invitations</h2>
                      <p className="no-margin">Invitation History</p>
                    </div>
                    <h3 className="pull-right semi-bold">{invitations && invitations.length}</h3>
                    <div className="clearfix" />
                  </div>
                  <div className="auto-overflow -table" style={{ maxHeight: '275px' }}>
                    <table className="table table-condensed table-hover">
                      <tbody>
                        {this.subscriptionTypes.includes('user.details.userInvitations') &&
                          invitations &&
                          invitations.map((invitation, index) => {
                            const data = invitation.metadata;
                            return (
                              <tr key={index + 1}>
                                <td className="font-montserrat fs-12 w-30" title={data.network.name}>
                                  <Link to={`/app/admin/networks/${invitation.networkId}`}>{data.network.name}</Link>
                                </td>
                                <td className="text-right b-r b-dashed b-grey w-25" title={data.inviteTo.name | data.inviteTo.email}>
                                  <Link to={`/app/admin/users/${invitation.inviteTo}`}>{data.inviteTo.email}</Link>
                                </td>
                                <td className="w-25">
                                  <span className="font-montserrat fs-12">{this.getInvitationStatus(invitation.invitationStatus)}</span>
                                </td>
                                <td className="w-25">
                                  <span className="font-montserrat fs-12">{moment(invitation.createdAt).format('DD-MMM-YY')}</span>
                                </td>
                              </tr>
                            );
                          })}
                        {!(this.subscriptionTypes.includes('user.details.userInvitations') && invitations) && (
                          <tr>
                            <td className="font-montserrat fs-12 w-100">
                              <LoadButton subscription="user.details.userInvitations" buttonText="Load Invitations" onLoad={this.loadComponents} />
                            </td>
                          </tr>
                        )}
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

export default withTracker(props => {
  const userId = props.match.params.id;
  return {
    user: Meteor.users.find({ _id: userId }).fetch()[0],
    subscriptions: [Meteor.subscribe('users.details', { userId: props.match.params.id })],
  };
})(withRouter(UserDetails));
