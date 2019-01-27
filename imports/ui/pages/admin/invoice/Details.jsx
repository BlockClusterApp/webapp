import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter, Link } from 'react-router-dom';
import Invoice from '../../../../collections/payments/invoice';
import ConfirmationButton from '../../../components/Buttons/ConfirmationButton';
import notifications from '../../../../modules/notifications';

const EmailsMapping = {
  1: 'Invoice Created',
  2: 'Reminder on 4th',
  3: 'Reminder on 9th',
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

  render() {
    let billView = null;
    let creditsView = null;

    const { invoice } = this.props;
    if (!invoice) {
      return null;
    }

    const { user } = invoice;

    if (invoice && invoice.items) {
      billView = invoice.items.map((network, index) => {
        return (
          <tr title={network.timeperiod} key={index + 1}>
            <td>
              <Link to={`/app/admin/networks/${network.instanceId}`}>{network.name}</Link>
            </td>
            <td>{network.instanceId}</td>
            <td>{network.rate}</td>
            <td>{network.runtime}</td>
            <td>
              $ {network.cost} {this.convertCostToTag(network.label)}{' '}
            </td>
          </tr>
        );
      });
    }
    if (invoice && invoice.creditClaims) {
      creditsView = invoice.creditClaims.map((claim, index) => {
        return (
          <tr key={`p${index + 1}`}>
            <td>Promotional Credit Redemption</td>
            <td>{claim.code}</td>
            <td />
            <td />
            <td>$ -{Number(claim.amount).toFixed(2)}</td>
          </tr>
        );
      });
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
                <div className="card-description">{invoice.rzSubscriptionId ? `Subscription ${invoice.rzSubscriptionId}` : 'Debit card'}</div>
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
                  <ol>{invoice.emailsSent && invoice.emailsSent.map(es => <li>{EmailsMapping[es]}</li>)}</ol>
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
                <h5>Emails</h5>
                <ConfirmationButton
                  loading={this.state.loading}
                  completed={!(invoice && invoice.emailsSent && invoice.emailsSent.includes(1)) || this.state.disableReminder || [2, 5, 6].includes(invoice.paymentStatus)}
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
                <br />
                {![2, 6].includes(invoice.paymentStatus) && (
                  <div>
                    <h5>Waive Off </h5>
                    <div className="row">
                      <div className="col-md-7">
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
                      <div className="col-md-5">
                        <ConfirmationButton
                          loading={this.state.loading}
                          completed={[2, 3, 5, 6].includes(invoice.paymentStatus) || this.state.disableWaiveOff}
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
          <div className="row bg-white">
            <table className="table table-hover" id="basicTable">
              <thead>
                <tr>
                  <th style={{ width: '18%' }}>Network Name</th>
                  <th style={{ width: '15%' }}>Instance ID</th>
                  <th style={{ width: '15%' }}>Rate</th>
                  <th style={{ width: '18%' }}>Runtime</th>
                  <th style={{ width: '19%' }}>Cost</th>
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
                    {invoice && invoice.totalAmount ? `$ ${Number(invoice.totalAmount).toFixed(2)}` : '0'} {this.getInvoicePaidStatus(invoice && invoice.paymentStatus)}
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
