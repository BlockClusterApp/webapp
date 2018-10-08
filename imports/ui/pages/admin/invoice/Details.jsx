import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter, Link } from 'react-router-dom';
import Invoice from '../../../../collections/payments/invoice';

const EmailsMapping = {
  1: 'Invoice Created',
  2: 'Reminder on 4th',
  3: 'Reminder on 9th',
  4: 'Node Deletion warning'
}

class InvoiceDetails extends Component {
  constructor(props) {
    super(props);

    this.state = {
      locations: [],
      page: 0,
      networkId: null,
      network: {},
      deleteConfirmAsked: false,
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
      default:
        return null;
    }
  };

  render() {
    let billView = null;

    const { invoice } = this.props;
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
                    <Link to={`/app/admin/users/${user._id}`}>{invoice.user.email}</Link>
                  </p>
                </div>
              </div>
              <div className="card social-card share  full-width m-b-10 no-border" data-social="item">
                <div className="card-header clearfix">
                  <h5 className="text-info pull-left fs-12">Payment Method</h5>
                  <div className="clearfix" />
                </div>
                <div className="card-description">
                  { invoice.rzSubscriptionId ? `Subscription ${invoice.rzSubscriptionId}` : 'Debit card' }
                </div>
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
                    $ {invoice.totalAmount} <small>@ INR
                    {invoice.conversionRate}</small>
                  </p>
                  <p>
                    <b>Total:</b> INR {(Number(invoice.totalAmountINR)/100).toFixed(2)}
                  </p>
                  <p>
                    {this.getInvoicePaidStatus(invoice && invoice.paymentStatus)}
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
                    {invoice.emailsSent && invoice.emailsSent.map(es => <li>{EmailsMapping[es]}</li>)}
                  </ol>
                </div>
                <div className="clearfix" />
              </div>
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
            <tbody>{billView}</tbody>
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