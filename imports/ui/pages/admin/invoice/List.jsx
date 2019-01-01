import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import Invoice from '../../../../collections/payments/invoice';
import { withRouter } from 'react-router-dom';
import moment from 'moment';

const PAGE_LIMIT = 20;
class InvoiceList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      page: 0,
      invoices: [],
    };

    this.query = {
      billingPeriodLabel: moment()
        .subtract(1, 'month')
        .format('MMM-YYYY'),
      paymentStatus: 1,
    };
  }

  componentWillUnmount() {
    this.props.subscriptions.forEach(s => {
      s.stop();
    });
    this.invoiceSubscription.stop();
  }

  componentDidMount() {
    this.search();
  }

  search = () => {
    this.invoiceSubscription = Meteor.subscribe(
      'invoice.search',
      {
        query: this.query,
      },
      {
        onReady: () => {
          this.setState({
            invoices: Invoice.find(this.query).fetch(),
          });
        },
      }
    );
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
      default:
        return null;
    }
  };

  changePage = pageOffset => {
    if (this.state.page + pageOffset < 0) {
      return;
    }
    this.invoiceSubscription.stop();
    this.invoiceSubscription = Meteor.subscribe(
      'invoice.all',
      { query: this.query, page: this.state.page + pageOffset },
      {
        onReady: () => {
          const page = this.state.page + pageOffset;
          this.setState({
            networks: Invoice.find(this.query).fetch(),
            page,
          });
        },
      }
    );
  };

  onSearch = e => {
    const searchQuery = e.target.value;
    if (!searchQuery) {
      delete this.query.$or;
      return this.changePage(0);
    }
    if (searchQuery.length <= 3) {
      delete this.query.$or;
      return this.changePage(0);
    }
    this.query.$or = [
      { _id: { $regex: `${searchQuery}*`, $options: 'i' } },
      { userId: { $regex: `${searchQuery}*`, $options: 'i' } },
      { 'user.name': { $regex: `${searchQuery}*`, $options: 'i' } },
      { 'user.email': { $regex: `${searchQuery}*`, $options: 'i' } },
      { 'paymentLink.link': { $regex: `${searchQuery}*`, $options: 'i' } },
      { 'paymentLink.id': { $regex: `${searchQuery}*`, $options: 'i' } },
      { billingPeriodLabel: { $regex: `${searchQuery}*`, $options: 'i' } },
    ];
    this.search();
  };

  onInvoiceStatusChanged = e => {
    this.query.paymentStatus = e.target.value;
    if (this.query.status === 'all') {
      delete this.query.status;
    }
    this.query.paymentStatus = Number(this.query.paymentStatus);
    this.search();
  };

  open = invoiceId => {
    this.props.history.push('/app/admin/invoices/' + invoiceId);
  };

  render() {
    return (
      <div className="content networksList">
        <div className="m-t-20 container-fluid container-fixed-lg bg-white">
          <div className="row">
            <div className="col-lg-12">
              <div className="card card-transparent">
                <div className="card-header ">
                  <div className="card-title">Invoices</div>
                </div>
                <div className="card-block">
                  <div className="row">
                    <div className="col-md-7">
                      <div className="input-group transparent">
                        <span className="input-group-addon">
                          <i className="fa fa-search" />
                        </span>
                        <input type="text" placeholder="Invoice id, billing label, user details, payment links" className="form-control" onChange={this.onSearch} />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="form-group ">
                        <select className="full-width select2-hidden-accessible" data-init-plugin="select2" tabIndex="-1" aria-hidden="true" onChange={this.onInvoiceStatusChanged}>
                          <option value="all">States: All</option>
                          <option value="1">Pending</option>
                          <option value="2">Paid</option>
                          <option value="3">Demo User</option>
                          <option value="4">Failed</option>
                          <option value="5">Waived Off</option>
                        </select>
                      </div>
                    </div>

                    <div className="col-md-2">
                      <div className="checkbox check-success">
                        <input
                          type="checkbox"
                          value="1"
                          defaultChecked="checked"
                          id="checkbox2"
                          onClick={e => {
                            if (e.target.checked) {
                              this.query.billingPeriodLabel = moment()
                                .subtract(1, 'month')
                                .format('MMM-YYYY');
                            } else {
                              delete this.query.billingPeriodLabel;
                            }
                            this.search();
                          }}
                        />
                        <label htmlFor="checkbox2">Only previous month's</label>
                      </div>
                    </div>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-hover" id="basicTable">
                      <thead>
                        <tr>
                          <th style={{ width: '5%' }}>S.No</th>
                          {/* <th style={{width: "15%"}}>Id</th> */}
                          <th style={{ width: '40%' }}>User</th>
                          <th style={{ width: '20%' }}>Amount</th>
                          <th style={{ width: '20%' }}>Status</th>
                          <th style={{ width: '20%' }}>Period</th>
                        </tr>
                      </thead>
                      <tbody>
                        {this.state.invoices.map((invoice, index) => {
                          return (
                            <tr key={index + 1} onClick={() => this.open(invoice._id)}>
                              <td>{this.state.page * PAGE_LIMIT + index + 1}</td>
                              <td>
                                {invoice.user.name} | {invoice.user.email}
                              </td>
                              <td>$ {invoice.totalAmount}</td>
                              <td>{this.getInvoicePaidStatus(invoice.paymentStatus)}</td>
                              <td>{invoice.billingPeriodLabel}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="pagination pull-right" style={{ marginTop: '5px' }}>
                    <nav aria-label="Page navigation example">
                      <ul className="pagination">
                        <li className="page-item" onClick={() => this.changePage(-1)}>
                          <a className="page-link">Previous</a>
                        </li>
                        <li className="page-item" onClick={() => this.changePage(1)}>
                          <a className="page-link">Next</a>
                        </li>
                      </ul>
                    </nav>
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
    subscriptions: [Meteor.subscribe('invoice.all', { page: 0 })],
  };
})(withRouter(InvoiceList));
