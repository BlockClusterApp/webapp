import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter, Link } from 'react-router-dom';
import Invoice from '../../../../collections/payments/invoice';
import ConfirmationButton from '../../../components/Buttons/ConfirmationButton';
import notifications from '../../../../modules/notifications';
import moment from 'moment';

import '../../billing/Dashboard.scss';

const EmailsMapping = {
  1: 'Invoice Created',
  2: 'Reminder',
  3: 'Reminder',
  4: 'Node Deletion warning',
};

class InvoiceDetails extends Component {
  constructor(props) {
    super(props);

    this.state = {
      locations: [],
      page: 0,
      networkId: null,
      network: {},
      deleteConfirmAsked: false,
      disableReminder: false,
      loading: false,
      expand: {},
    };
  }

  componentWillUnmount() {
    this.unmounted = true;
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.props.subscriptions.forEach(s => {
      s.stop();
    });
  }

  convertCostToTag = label => {
    if (!label) {
      return null;
    }
    return <span className="label label-info">{label}</span>;
  };

  getInvoicePaidStatus = paymentStatus => {
    switch (Number(paymentStatus)) {
      case 2:
        return <span className="label label-success">Paid</span>;
      case 7:
        return <span className="label label-success">Offline Payment</span>;
      case 3:
        return <span className="label label-info">Demo User</span>;
      case 1:
        return <span className="label label-danger">Unpaid</span>;
      case 4:
        return <span className="label label-danger">Failed</span>;
      case 5:
        return <span className="label label-danger">Waived Off</span>;
      case 6:
        return <span className="label label-danger">Refunded</span>;
      case 8:
        return <span className="label label-danger">Addon Attached</span>;
      default:
        return null;
    }
  };

  sendInvoiceReminder = invoiceId => {
    this.setState({
      loading: true,
    });
    Meteor.call('sendInvoiceReminder', invoiceId, (err, res) => {
      if (!err) {
        notifications.success('Reminder sent');
        return this.setState({
          disableReminder: true,
          loading: false,
        });
      } else {
        this.setState({
          loading: false,
        });
        notifications.error(err.reason);
      }
    });
  };

  toggleSection = sectionName => {
    const { expand } = this.state;
    expand[sectionName] = !expand[sectionName];
    this.setState({ expand });
  };

  waiveOffReasonAction = invoiceId => {
    this.setState({
      loading: true,
    });
    Meteor.call(
      'waiveOffInvoice',
      {
        invoiceId,
        reason: this.waiveOffReason.value,
      },
      (err, call) => {
        if (!err) {
          notifications.success('Invoice Waived off');
          return this.setState({
            disableWaiveOff: true,
            loading: false,
          });
        } else {
          this.setState({
            loading: false,
          });
          notifications.error(err.reason);
        }
      }
    );
  };

  convertToOffline = invoiceId => {
    this.setState({
      loading: true,
    });
    Meteor.call(
      'changeToOfflinePayment',
      {
        invoiceId,
      },
      (err, call) => {
        if (!err) {
          notifications.success('Invoice Waived off');
          return this.setState({
            disableWaiveOff: true,
            disableOffline: true,
            loading: false,
          });
        } else {
          this.setState({
            loading: false,
          });
          notifications.error(err.reason);
        }
      }
    );
  };

  chargeNow = () => {
    const { invoice } = this.props;
    if (!invoice.stripeCustomerId) {
      return true;
    }
    this.setState({
      loading: true,
    });
    Meteor.call('adminChargeStripeInvoice', { invoiceId: invoice._id }, (err, data) => {
      this.setState({
        loading: false,
      });
      if (err) {
        return notifications.error(err.reason);
      }
      notifications.success('Charged invoice');
    });
  };

  render() {
    if (!this.props.invoice) {
      return null;
    }
    const { invoice } = this.props;
    const { dynamos, privateHives, hyperions, paymeters, creditClaims, networks } = this.props.invoice;

    const dynamoView = dynamos.map((network, index) => {
      return (
        <tr title={network.timeperiod} key={index + 1}>
          <td>{network.name}</td>
          <td>{network.instanceId === 'BLOCKCLUSTER' ? 'Welcome Bonus' : network.instanceId}</td>
          <td>{network.rate}</td>
          <td>{network.runtime}</td>
          <td>$ {network.discount}</td>
          <td>
            $ {network.cost} {network.deletedAt ? '' : this.convertCostToTag('Running')} {this.convertCostToTag(network.label)}{' '}
          </td>
        </tr>
      );
    });

    const privateHiveView = privateHives.map((network, index) => {
      return (
        <tr title={network.timeperiod} key={index + 1}>
          <td>{network.name}</td>
          <td>{network.instanceId}</td>
          <td>{network.rate}</td>
          <td>{network.runtime}</td>
          <td>$ {network.discount}</td>
          <td>
            $ {network.cost} {this.convertCostToTag(network.label)}{' '}
          </td>
        </tr>
      );
    });

    const hyperionView = hyperions.map((hyperion, index) => {
      return (
        <tr key={index + 1}>
          <td>{hyperion.name}</td>
          <td>{hyperion.rate}</td>
          <td>$ {hyperion.discount}</td>
          <td>$ {hyperion.cost}</td>
        </tr>
      );
    });

    const paymeterView = paymeters.map((pm, index) => {
      return (
        <tr key={index + 1}>
          <td>{pm.name}</td>
          <td>{pm.rate}</td>
          <td>$ {pm.discount}</td>
          <td>$ {pm.cost}</td>
        </tr>
      );
    });

    let creditsView = creditClaims.map((claim, index) => {
      return (
        <tr key={`p${index + 1}`}>
          <td>{claim.instanceId === 'BLOCKCLUSTER' ? 'Welcome Bonus' : claim.instanceId}</td>
          <td>{claim.rate}</td>
          <td>$ -{Number(claim.cost).toFixed(2)}</td>
        </tr>
      );
    });
    let billView = undefined;

    if (networks) {
      if (invoice && invoice.networks) {
        billView = invoice.networks.map((network, index) => {
          return (
            <tr title={network.timeperiod} key={index + 1}>
              <td>{network.name}</td>
              <td>{network.instanceId}</td>
              <td>{network.rate}</td>
              <td>{network.runtime}</td>
              <td>$ {network.discount || '0.00'}</td>
              <td>
                $ {network.cost} {this.convertCostToTag(network.label)}{' '}
              </td>
            </tr>
          );
        });
      }
    }

    return (
      <div className="content invoice-details">
        <div className="m-t-20 m-l-10 m-r-10 p-t-10 container-fluid container-fixed-lg">
          <div className="row">
            <div className="col-lg-3 col-sm-6  d-flex flex-column">
              <div className="card social-card share  full-width m-b-10 no-border" data-social="item">
                <div className="card-header ">
                  <h5 className="text-primary pull-left fs-12">
                    User <i className="fa fa-circle text-complete fs-11" />
                  </h5>
                  <div className="pull-right small hint-text">
                    <Link to={`/app/admin/users/${invoice.userId}`}>
                      Details <i className="fa fa-comment-o" />
                    </Link>
                  </div>
                  <div className="clearfix" />
                </div>
                <div className="card-description">
                  <p>
                    <Link to={`/app/admin/users/${invoice.userId}`}>{invoice.user.email}</Link>
                  </p>
                </div>
              </div>
              <div className="card social-card share  full-width m-b-10 no-border" data-social="item">
                <div className="card-header clearfix">
                  <h5 className="text-info pull-left fs-12">Payment Method</h5>
                  <div className="clearfix" />
                </div>
                <div className="card-description">{invoice.stripeCustomerId ? 'Stripe' : invoice.rzSubscriptionId ? `Subscription ${invoice.rzSubscriptionId}` : 'Debit Card'}</div>
                <div className="clearfix" />
              </div>
            </div>
            <div className="col-lg-3 col-sm-6  d-flex flex-column">
              <div className="card social-card share  full-width m-b-10 no-border" data-social="item">
                <div className="card-header ">
                  <h5 className="text-success pull-left fs-12">Total Amount | {invoice.billingPeriodLabel}</h5>
                  <div className="clearfix" />
                </div>
                <div className="card-description">
                  <p>
                    $ {invoice.totalAmount}{' '}
                    <small>
                      @ INR
                      {invoice.conversionRate}
                    </small>
                  </p>
                  <p>
                    <b>Total:</b> INR {(Number(invoice.totalAmountINR) / 100).toFixed(2)}
                  </p>
                  <p>{this.getInvoicePaidStatus(invoice && invoice.paymentStatus)}</p>
                  <p>
                    <b>Payment Link</b>
                    <br />
                    {invoice.paymentLink && invoice.paymentLink.link}
                  </p>
                </div>
              </div>
            </div>
            <div className="col-lg-5 col-sm-6 d-flex flex-column">
              <div className="card social-card share  full-width m-b-10 no-border" data-social="item">
                <div className="card-header clearfix">
                  <h5 className="text-info pull-left fs-12">Emails Sent</h5>
                  <div className="clearfix" />
                </div>
                <div className="card-description">
                  <ol>
                    {invoice.emailsSent &&
                      invoice.emailsSent.map(es => (
                        <li>{typeof es === 'number' ? EmailsMapping[es] : `${EmailsMapping[es.reminderCode]} @ ${moment(es.at).format('DD-MMM-YYYY kk:mm:ss')}`}</li>
                      ))}
                  </ol>
                </div>
                <div className="clearfix" />
              </div>
            </div>
          </div>

          <div className="row">
            <div className="card social-card share  full-width m-b-10 no-border" data-social="item">
              <div className="card-header clearfix">
                <h5 className="text-info pull-left fs-12">Actions</h5>
                <div className="clearfix" />
              </div>
              <div className="card-description">
                <ConfirmationButton
                  loading={this.state.loading}
                  completed={!(invoice && invoice.emailsSent && invoice.emailsSent.includes(1)) || this.state.disableReminder || [2, 5, 6, 7].includes(invoice.paymentStatus)}
                  onConfirm={this.sendInvoiceReminder.bind(this, invoice._id)}
                  loadingText="Sending email"
                  completedText={
                    invoice.paymentStatus === 6
                      ? 'Send Reminder: Refunded'
                      : invoice.paymentStatus !== 2
                      ? this.state.disableReminder
                        ? 'Reminder sent'
                        : invoice.paymentStatus !== 5
                        ? 'Send Reminder: Created mail not sent yet'
                        : 'Send Reminder: Invoice waived off'
                      : 'Send Reminder: Invoice already paid'
                  }
                  actionText="Send Invoice Reminder"
                />
                &nbsp;&nbsp;
                <ConfirmationButton
                  loading={this.state.loading}
                  completed={[2, 5, 6, 7].includes(invoice.paymentStatus) || !invoice.stripeCustomerId}
                  onConfirm={this.chargeNow.bind(this, invoice._id)}
                  loadingText="Charging customer"
                  completedText={
                    invoice.paymentStatus === 6
                      ? 'Charge customer: Refunded'
                      : [5, 6, 7].includes(invoice.paymentStatus)
                      ? 'Charge customer: Not eligible'
                      : 'Cannot charge manually'
                  }
                  actionText="Charge customer"
                />
                <br />
                {![2, 6, 7].includes(invoice.paymentStatus) && (
                  <div>
                    <h5>Change Status / Waive Off</h5>
                    <div className="row">
                      <div className="col-md-3 b-r b-grey">
                        <ConfirmationButton
                          loading={this.state.loading}
                          completed={[2, 3, 6, 7].includes(invoice.paymentStatus) || this.state.disableOffline}
                          onConfirm={this.convertToOffline.bind(this, invoice._id)}
                          loadingText="Loading"
                          completedText={
                            invoice.paymentStatus === 6
                              ? 'Offline: Refunded'
                              : invoice.paymentStatus !== 2
                              ? invoice.paymentStatus === 5
                                ? 'Already waived off'
                                : this.state.disableOffline && 'Offline: Disabled'
                              : 'Offline: Already Paid.'
                          }
                          actionText="Convert to Offline Payment"
                        />
                      </div>
                      <div className="col-md-6">
                        <div className="form-group form-group-default required">
                          <label>Reason</label>
                          {![5].includes(invoice.paymentStatus) ? (
                            <input
                              type="text"
                              className="form-control"
                              name="waiveOffReason"
                              required
                              ref={input => {
                                this.waiveOffReason = input;
                              }}
                            />
                          ) : (
                            <input type="text" className="form-control" name="waiveOffReason" disabled value={`${invoice.waiveOff.reason} | by: ${invoice.waiveOff.byEmail}`} />
                          )}
                        </div>
                      </div>
                      <div className="col-md-3">
                        <ConfirmationButton
                          loading={this.state.loading}
                          completed={[2, 3, 5, 6, 7].includes(invoice.paymentStatus) || this.state.disableWaiveOff}
                          onConfirm={this.waiveOffReasonAction.bind(this, invoice._id)}
                          loadingText="Waiving off invoice"
                          completedText={
                            invoice.paymentStatus === 6
                              ? 'WaiveOff: Refunded'
                              : invoice.paymentStatus !== 2
                              ? invoice.paymentStatus === 5
                                ? 'Already waived off'
                                : this.state.disableWaiveOff && 'WaiveOff: Disabled'
                              : 'WaiveOff: Already Paid.'
                          }
                          actionText="Waive off Invoice"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="clearfix" />
            </div>
          </div>
          <div className="row bg-white billingList">
            <div className="table-responsive">
              {networks || invoice.notGenerated ? (
                <table className="table table-hover" id="basicTable">
                  <thead>
                    <tr>
                      <th style={{ width: '18%' }}>Network Name</th>
                      <th style={{ width: '15%' }}>Instance ID</th>
                      <th style={{ width: '15%' }}>Rate</th>
                      <th style={{ width: '18%' }}>Runtime</th>
                      <th style={{ width: '20%' }}>Discount</th>
                      <th style={{ width: '14%' }}>Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billView}
                    {creditsView}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'right' }}>
                        Total Amount
                      </td>
                      <td>
                        {invoice && invoice.totalAmount ? `$ ${Number(invoice.totalAmount).toFixed(2)}` : '0'} {this.getInvoicePaidStatus(invoice && invoice.invoiceStatus)}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'right' }}>
                        &nbsp;
                      </td>
                      <td>{/* <RazorPay amountDisplay={`$ ${}`} /> */}</td>
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <div>
                  <div className="bill-section">
                    <div className="section-header" onClick={this.toggleSection.bind(this, 'dynamo')}>
                      {this.state.expand.dynamo ? (
                        <span className="title">
                          <i className="fa fa-minus-circle" />
                        </span>
                      ) : (
                        <span className="title">
                          <i className="fa fa-plus-circle" />
                        </span>
                      )}
                      <span className="title">&nbsp;&nbsp;Dynamo</span>
                      <span className="pull-right">$ {Number(invoice.totals.dynamo).toFixed(2)} </span>
                    </div>
                    {this.state.expand.dynamo && (
                      <div className="section-content">
                        <table className="table table-hover" id="basicTable">
                          <thead>
                            <tr>
                              <th style={{ width: '18%' }}>Network Name</th>
                              <th style={{ width: '15%' }}>Instance ID</th>
                              <th style={{ width: '15%' }}>Rate</th>
                              <th style={{ width: '18%' }}>Runtime</th>
                              <th style={{ width: '20%' }}>Discount</th>
                              <th style={{ width: '14%' }}>Cost</th>
                            </tr>
                          </thead>
                          <tbody>{dynamoView}</tbody>
                        </table>
                      </div>
                    )}
                  </div>
                  <div className="bill-section">
                    <div className="section-header" onClick={this.toggleSection.bind(this, 'privatehive')}>
                      {this.state.expand.privatehive ? (
                        <span className="title">
                          <i className="fa fa-minus-circle" />
                        </span>
                      ) : (
                        <span className="title">
                          <i className="fa fa-plus-circle" />
                        </span>
                      )}
                      <span className="title">&nbsp;&nbsp;Private Hive</span>
                      <span className="pull-right">$ {Number(invoice.totals.privatehive).toFixed(2)} </span>
                    </div>
                    {this.state.expand.privatehive && (
                      <div className="section-content">
                        <table className="table table-hover" id="basicTable">
                          <thead>
                            <tr>
                              <th style={{ width: '18%' }}>Network Name</th>
                              <th style={{ width: '15%' }}>Instance ID</th>
                              <th style={{ width: '15%' }}>Rate</th>
                              <th style={{ width: '18%' }}>Runtime</th>
                              <th style={{ width: '20%' }}>Discount</th>
                              <th style={{ width: '14%' }}>Cost</th>
                            </tr>
                          </thead>
                          <tbody>{privateHiveView}</tbody>
                        </table>
                      </div>
                    )}
                  </div>
                  <div className="bill-section">
                    <div className="section-header" onClick={this.toggleSection.bind(this, 'hyperion')}>
                      {this.state.expand.hyperion ? (
                        <span className="title">
                          <i className="fa fa-minus-circle" />
                        </span>
                      ) : (
                        <span className="title">
                          <i className="fa fa-plus-circle" />
                        </span>
                      )}
                      <span className="title">&nbsp;&nbsp;Hyperion</span>
                      <span className="pull-right">$ {Number(invoice.totals.hyperion).toFixed(2)} </span>
                    </div>
                    {this.state.expand.hyperion && (
                      <div className="section-content">
                        <table className="table table-hover" id="basicTable">
                          <thead>
                            <tr>
                              <th style={{ width: '35%' }}>Charge Name</th>
                              <th style={{ width: '20%' }}>Rate</th>
                              <th style={{ width: '20%' }}>Discount</th>
                              <th style={{ width: '25%' }}>Cost</th>
                            </tr>
                          </thead>
                          <tbody>{hyperionView}</tbody>
                        </table>
                      </div>
                    )}
                  </div>
                  <div className="bill-section">
                    <div className="section-header" onClick={this.toggleSection.bind(this, 'paymeter')}>
                      {this.state.expand.paymeter ? (
                        <span className="title">
                          <i className="fa fa-minus-circle" />
                        </span>
                      ) : (
                        <span className="title">
                          <i className="fa fa-plus-circle" />
                        </span>
                      )}
                      <span className="title">&nbsp;&nbsp;Paymeter</span>
                      <span className="pull-right">$ {Number(invoice.totals.paymeter).toFixed(2)} </span>
                    </div>
                    {this.state.expand.paymeter && (
                      <div className="section-content">
                        <table className="table table-hover" id="basicTable">
                          <thead>
                            <tr>
                              <th style={{ width: '35%' }}>Charge Name</th>
                              <th style={{ width: '20%' }}>Rate</th>
                              <th style={{ width: '20%' }}>Discount</th>
                              <th style={{ width: '25%' }}>Cost</th>
                            </tr>
                          </thead>
                          <tbody>{paymeterView}</tbody>
                        </table>
                      </div>
                    )}
                  </div>
                  <div className="bill-section">
                    <div className="section-header" onClick={this.toggleSection.bind(this, 'credits')}>
                      {' '}
                      {this.state.expand.credits ? (
                        <span className="title">
                          <i className="fa fa-minus-circle" />
                        </span>
                      ) : (
                        <span className="title">
                          <i className="fa fa-plus-circle" />
                        </span>
                      )}
                      <span className="title">&nbsp;&nbsp;Credits</span>
                      <span className="pull-right">- $ {Number(invoice.totals.credits).toFixed(2)} </span>
                    </div>
                    {this.state.expand.credits && (
                      <div className="section-content">
                        <table className="table table-hover" id="basicTable">
                          <thead>
                            <tr>
                              <th style={{ width: '50%' }}>Credit Code</th>
                              <th style={{ width: '25%' }}>Face value</th>
                              <th style={{ width: '25%' }}>Used</th>
                            </tr>
                          </thead>
                          <tbody>{creditsView}</tbody>
                        </table>
                      </div>
                    )}
                  </div>
                  <div className="bill-section m-b-50">
                    <div className="section-header total">
                      <span className="title">Total</span>
                      <span className="pull-right">
                        $ {Number(invoice.totalAmount).toFixed(2)} {this.getInvoicePaidStatus(invoice && invoice.invoiceStatus)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withTracker(props => {
  return {
    invoice: Invoice.find({ _id: props.match.params.id, active: true }).fetch()[0],
    subscriptions: [Meteor.subscribe('invoice.admin.id', props.match.params.id)],
  };
})(withRouter(InvoiceDetails));
