import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import helpers from '../../../../modules/helpers';
import { withRouter, Route, Redirect } from 'react-router-dom';
import { Link } from 'react-router-dom';
import moment from 'moment';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';

import UserCards from '../../../../collections/payments/user-cards';
import notifications from '../../../../modules/notifications';
import LoadButton from './components/LoadButton';
import ConfirmationButton from '../../../components/Buttons/ConfirmationButton';

import DynamoComponent from './components/Dynamo';
import PrivatehiveComponent from './components/Privatehive';
import HyperionComponent from './components/Hyperion';
import PaymeterComponent from './components/Paymeter';
import PaymentsComponent from './components/Payments';
import CreditsComponent from './components/Credits';
import InvoiceComponent from './components/Invoices';
import InvitationComponent from './components/Invitations';

import './Style.scss';

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
  }

  componentDidMount() {
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

  adminApplyVoucher = () => {
    if (!this.promotionalCode.value) {
      console.log('Code required');
      return false;
    }
    this.setState({
      adminApplyVoucherLoading: true,
    });
    Meteor.call('adminVoucherApply', { userId: this.props.user._id, code: this.promotionalCode.value }, (err, res) => {
      this.setState({
        adminApplyVoucherLoading: false,
      });
      if (err) {
        return notifications.error(err.reason);
      }
      this.refresh();
      notifications.success('Code Applied');
    });
  };

  toggleUserAccess = () => {
    const { user } = this.props;

    let functionName;
    if (user && user.paymentPending) {
      functionName = 'enableUser';
    } else if (user) {
      functionName = 'disableUser';
    }

    if (!functionName) {
      return null;
    }

    this.setState({
      userFunctionLoading: true,
    });
    Meteor.call(functionName, { userId: user._id }, (err, res) => {
      this.setState({
        userFunctionLoading: false,
      });
      if (err) {
        return notifications.error(err.reason);
      }
      return notifications.success('Successful');
    });
  };

  refresh = type => {
    const userId = this.props.match.params.id;
    const states = {
      cards: UserCards.find({ userId }).fetch(),
    };
    if (type) {
      this.subscriptionTypes.push(type);
    }
    this.setState({ ...this.state, ...states });
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
          this.refresh(type);
        },
      }
    );

    this.subscriptions.push(sub);
  };

  toggleDeletePrevention = () => {
    const { user } = this.props;
    this.setState({
      preventDeleteLoading: true,
    });
    Meteor.call('preventDelete', { userId: user._id }, (err, res) => {
      this.setState({
        preventDeleteLoading: false,
      });
      if (err) {
        return notifications.error(err.reason);
      }
      return notifications.success('Successful');
    });
  };

  generateBill = () => {
    const { user } = this.props;
    this.setState({
      generatingBill: true,
    });
    Meteor.call('adminGenerateBill', { userId: user._id }, (err, res) => {
      this.setState({
        generatingBill: false,
      });
      if (err) {
        return notifications.error(err.reason);
      }
      return notifications.success('Successful');
    });
  };

  showDetails = component => {
    this.props.history.replace(`/app/admin/users/${this.props.match.params.id}/${component}`);
    setTimeout(() => {
      this.setState({});
    }, 100);
  };

  deleteCard = cardId => {
    const s = {};
    const { user } = this.props;
    s[`deleting_${cardId}`] = true;
    this.setState(s);
    Meteor.call('adminDeleteCard', { cardId, userId: user._id }, (err, res) => {
      s[`deleting_${cardId}`] = false;
      this.setState(s);
      if (err) {
        return notifications.error(err.reason);
      }
      this.refresh();
      return notifications.success('Successful');
    });
  };

  render() {
    const { user } = this.props;
    const { cards } = this.state;

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
      <div className="page-content-wrapper user-admin-details">
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
                    <div className="col-xs-height col-bottom fs-12" style={{ paddingLeft: '16px', paddingRight: '16px', paddingBottom: '10px' }}>
                      Offline User&nbsp;&nbsp;
                      <input
                        type="checkbox"
                        value="1"
                        defaultChecked={user.offlineUser > 0 ? 'checked' : ''}
                        id="checkbox4"
                        onClick={e => {
                          let offlineUser = e.target.checked;
                          const updateQuery = {};
                          if (offlineUser) {
                            updateQuery.offlineUser = 1;
                          } else {
                            updateQuery.offlineUser = 0;
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
                            <h5>
                              <ConfirmationButton
                                onConfirm={this.deleteCard.bind(this, card.id)}
                                className="btn btn-danger"
                                completed={card.active === false}
                                completedText="Already removed"
                                loadingText="Deleting"
                                confirmationText="Irreversible..!!"
                                cooldown={1500}
                                loading={this.state[`deleting_${card.id}`]}
                                actionText="Remove card"
                              />
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
              <div className="col-lg-3 col-sm-6  d-flex flex-column">
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
                            {bill && bill.totalFreeMicroHours.hours}/{0} hrs
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
                                width: `100%`,
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
                      User functions
                      <i className="fa fa-circle text-success fs-11" />
                    </h5>
                    <div className="clearfix" />
                  </div>
                  <div className="card-description">
                    <ConfirmationButton
                      onConfirm={this.generateBill}
                      className="btn btn-danger"
                      loadingText="Generating Bill"
                      confirmationText="Are you sure?"
                      cooldown={2500}
                      loading={this.state.generatingBill}
                      actionText="Generate last month bill"
                    />
                    <br />
                    <br />
                    <LaddaButton
                      loading={this.state.userFunctionLoading}
                      data-size={S}
                      data-style={SLIDE_UP}
                      data-spinner-size={30}
                      data-spinner-lines={12}
                      onClick={this.toggleUserAccess}
                      className="btn btn-danger"
                    >
                      &nbsp;&nbsp;{this.props.user && this.props.user.paymentPending ? 'Enable User' : 'Disable User'}
                    </LaddaButton>
                    <br />
                    <br />
                    <LaddaButton
                      loading={this.state.preventDeleteLoading}
                      data-size={S}
                      data-style={SLIDE_UP}
                      data-spinner-size={30}
                      data-spinner-lines={12}
                      onClick={this.toggleDeletePrevention}
                      className="btn btn-danger"
                    >
                      &nbsp;&nbsp;{this.props.user && this.props.user.preventDelete ? 'Allow deletion' : 'Disable deletion'}
                    </LaddaButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="container-fluid p-l-25 p-r-25 p-t-0 p-b-25 sm-padding-10">
            <div className="row">
              <div className="col-xl-12">
                <div className="card card-transparent">
                  <div>
                    <div>
                      <ul className="nav nav-tabs nav-tabs-fillup" data-init-reponsive-tabs="dropdownfx">
                        <li className="nav-item">
                          <a
                            href="#"
                            className={window.location.pathname.includes('/dynamo') ? 'active' : ''}
                            data-toggle="tab"
                            onClick={() => {
                              this.showDetails('dynamo');
                            }}
                          >
                            <span>Dynamo</span>
                          </a>
                        </li>
                        <li className="nav-item">
                          <a
                            href="#"
                            className={window.location.pathname.includes('/privatehive') ? 'active' : ''}
                            data-toggle="tab"
                            onClick={() => {
                              this.showDetails('privatehive');
                            }}
                          >
                            <span>Privatehive</span>
                          </a>
                        </li>
                        <li className="nav-item">
                          <a
                            href="#"
                            className={window.location.pathname.includes('/hyperion') ? 'active' : ''}
                            data-toggle="tab"
                            onClick={() => {
                              this.showDetails('hyperion');
                            }}
                          >
                            <span>Hyperion</span>
                          </a>
                        </li>

                        <li className="nav-item">
                          <a
                            href="#"
                            className={window.location.pathname.includes('/paymeter') ? 'active' : ''}
                            data-toggle="tab"
                            onClick={() => {
                              this.showDetails('paymeter');
                            }}
                          >
                            <span>Paymeter</span>
                          </a>
                        </li>
                        <li className="nav-item">
                          <a
                            href="#"
                            className={window.location.pathname.includes('/invoices') ? 'active' : ''}
                            data-toggle="tab"
                            onClick={() => {
                              this.showDetails('invoices');
                            }}
                          >
                            <span>Invoices</span>
                          </a>
                        </li>

                        <li className="nav-item">
                          <a
                            href="#"
                            className={window.location.pathname.includes('/payments') ? 'active' : ''}
                            data-toggle="tab"
                            onClick={() => {
                              this.showDetails('payments');
                            }}
                          >
                            <span>Payments</span>
                          </a>
                        </li>

                        <li className="nav-item">
                          <a
                            href="#"
                            className={window.location.pathname.includes('/credits') ? 'active' : ''}
                            data-toggle="tab"
                            onClick={() => {
                              this.showDetails('credits');
                            }}
                          >
                            <span>Credits</span>
                          </a>
                        </li>
                        <li className="nav-item">
                          <a
                            href="#"
                            className={window.location.pathname.includes('/invitations') ? 'active' : ''}
                            data-toggle="tab"
                            onClick={() => {
                              this.showDetails('invitations');
                            }}
                          >
                            <span>Invitations</span>
                          </a>
                        </li>
                      </ul>
                      <div className="tab-content p-l-0 p-r-0">
                        <div className="tab-pane slide-left active">
                          <Route exact path="/app/admin/users/:id" render={() => <Redirect to={`/app/admin/users/${this.props.match.params.id}/dynamo`} />} />
                          <Route exact path="/app/admin/users/:id/dynamo" component={DynamoComponent} />
                          {/* <Route exact path="/app/admin/users/:id/privatehive" component={PrivatehiveComponent} /> */}
                          <Route exact path="/app/admin/users/:id/hyperion" component={HyperionComponent} />
                          <Route exact path="/app/admin/users/:id/paymeter" component={PaymeterComponent} />
                          <Route exact path="/app/admin/users/:id/invoices" component={InvoiceComponent} />
                          <Route exact path="/app/admin/users/:id/payments" component={PaymentsComponent} />
                          <Route exact path="/app/admin/users/:id/credits" component={CreditsComponent} />
                          <Route exact path="/app/admin/users/:id/invitations" component={InvitationComponent} />
                        </div>
                      </div>
                    </div>
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
