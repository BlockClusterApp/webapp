import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter, Link } from 'react-router-dom';
import Invoice from '../../../../collections/payments/invoice';

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

    const {invoice} = this.props;

    if (invoice && invoice.items) {
      billView = invoice.items.map((network, index) => {
        return (
          <tr title={network.timeperiod} key={index + 1}>
            <td><Link to={`/app/admin/networks/${network.instanceId}`}>{network.name}</Link></td>
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
      <div className="m-t-20 m-l-10 m-r-10 p-t-10 container-fluid container-fixed-lg bg-white">
        <div className="row">
          Invoice for {invoice.billingPeriodLabel} | {invoice.user && invoice.user.email}
        </div>
          <div className="row"></div>
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
                  {invoice && invoice.totalAmount ? `$ ${Number(invoice.totalAmount).toFixed(2)}` : '0'}{' '}
                  {this.getInvoicePaidStatus(invoice && invoice.paymentStatus)}
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
    );
  }
}

export default withTracker((props) => {
  return {
    invoice: Invoice.find({ _id: props.match.params.id, active: true }).fetch()[0],
    subscriptions: [Meteor.subscribe('invoice.admin.id', props.match.params.id)],
  };
})(withRouter(InvoiceDetails));
