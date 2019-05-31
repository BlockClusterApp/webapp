import React from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter, Link } from 'react-router-dom';

import Invoice from '../../../../../collections/payments/invoice';

class Invoices extends React.Component {
  convertInvoiceStatusToTag = statusCode => {
    if (statusCode === 2) {
      return <span className="label label-success">Paid</span>;
    } else if (statusCode === 1) {
      return <span className="label label-info">Pending</span>;
    } else if (statusCode === 3) {
      return <span className="label label-success">Demo User</span>;
    } else if (statusCode === 7) {
      return <span className="label label-success">Offline Payment</span>;
    } else if (statusCode === 4) {
      return <span className="label label-danger">Failed</span>;
    }
    return null;
  };

  render() {
    const { invoices } = this.props;
    return (
      <div className="row">
        <div className="col-lg-12 m-b-10 d-flex">
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
                  {invoices &&
                    invoices.map((invoice, index) => {
                      return (
                        <tr key={index + 1}>
                          <td className="font-montserrat fs-14 w-40">
                            <Link to={`/app/admin/invoices/${invoice._id}`}>{invoice.billingPeriodLabel}</Link>
                          </td>
                          <td className="text-right b-r b-dashed b-grey w-40">${invoice.totalAmount}</td>
                          <td className="w-20">
                            <span className="font-montserrat fs-14">{this.convertInvoiceStatusToTag(invoice.paymentStatus)}</span>
                          </td>
                        </tr>
                      );
                    })}
                  {!invoices && (
                    <tr>
                      <td className="font-montserrat fs-12 w-100">No Invoices generated yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withTracker(props => {
  return {
    invoices: Invoice.find({ userId: props.match.params.id }).fetch(),
    subscriptions: [Meteor.subscribe('user.details.invoices', { userId: props.match.params.id })],
  };
})(withRouter(Invoices));
