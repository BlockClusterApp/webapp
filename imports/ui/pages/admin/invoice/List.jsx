import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import Invoice from '../../../../collections/payments/invoice';
import { withRouter } from 'react-router-dom';
import moment from 'moment';
import querystring from 'querystring';

const PAGE_LIMIT = 10;
class InvoiceList extends Component {
  constructor(props) {
    super(props);

    this.pagination = {
      limit: PAGE_LIMIT,
    };
    if (props.location.search) {
      const query = querystring.parse(props.location.search.substr(1));
      if (query.searchText) {
        this.searchText = query.searchText;
      }
      delete query.searchText;
      if (this.searchText) {
        query.$or = [
          { _id: { $regex: `${this.searchText}*`, $options: 'i' } },
          { userId: { $regex: `${this.searchText}*`, $options: 'i' } },
          { 'user.name': { $regex: `${this.searchText}*`, $options: 'i' } },
          { 'user.email': { $regex: `${this.searchText}*`, $options: 'i' } },
          { 'paymentLink.link': { $regex: `${this.searchText}*`, $options: 'i' } },
          { 'paymentLink.id': { $regex: `${this.searchText}*`, $options: 'i' } },
          { billingPeriodLabel: { $regex: `${this.searchText}*`, $options: 'i' } },
        ];
      }

      if (query.page) {
        this.page = Number(query.page);
        this.pagination.skip = (this.page - 1) * PAGE_LIMIT;
      }
      delete query.page;

      if (query.active === 'true') {
        query.active = true;
      } else if (query.active === 'false') {
        query.active = false;
      } else {
        delete query.active;
      }

      if (query.hideZeroes === 'true') {
        this.hideZeroes = true;
        query.totalAmount = { $nin: ['0.00'] };
      } else {
        this.hideZeroes = false;
      }

      if (query.paymentStatus) {
        query.paymentStatus = Number(query.paymentStatus);
      }

      delete query.hideZeroes;
      this.query = query;
    } else {
      this.query = {
        billingPeriodLabel: moment()
          .subtract(1, 'month')
          .format('MMM-YYYY'),
        paymentStatus: 1,
      };
      this.hideZeroes = false;
      this.page = 1;

      if (this.hideZeroes) {
        this.query.totalAmount = {
          $gt: 0,
        };
      }
    }

    this.state = {
      page: 0,
      invoices: Invoice.find(this.query, this.pagination).fetch(),
    };
  }

  updateRoute = () => {
    const sanitizedQuery = { ...this.query };
    if (!sanitizedQuery.paymentStatus) {
      delete sanitizedQuery.paymentStatus;
    }
    delete this.query.page;
    delete sanitizedQuery.$or;
    delete sanitizedQuery.page;
    delete sanitizedQuery.totalAmount;
    this.props.history.replace({
      pathname: this.props.location.pathname,
      search: `?${querystring.stringify({ ...sanitizedQuery, searchText: this.searchText, page: this.page, hideZeroes: this.hideZeroes })}`,
    });
  };

  componentWillUnmount() {
    // this.props.subscriptions.forEach(s => {
    //   s.stop();
    // });
    // this.invoiceSubscription.stop();
  }

  componentDidMount() {
    this.search();
  }

  search = () => {
    this.updateRoute();
    if (this.page) {
      this.pagination.skip = (this.page - 1) * PAGE_LIMIT;
    }
    this.setState({
      loading: true,
    });
    if (this.hideZeroes) {
      this.query.totalAmount = {
        $nin: ['0.00'],
      };
    } else {
      delete this.query.totalAmount;
    }
    this.pagination.limit = PAGE_LIMIT;
    this.invoiceSubscription = Meteor.subscribe(
      'invoice.search',
      {
        query: this.query,
        page: this.page,
      },
      {
        onReady: () => {
          this.setState({
            invoices: Invoice.find(this.query, this.pagination).fetch(),
            loading: false,
          });
        },
      }
    );
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
      default:
        return null;
    }
  };

  changePage = pageOffset => {
    if (this.page + pageOffset < 0) {
      return;
    }
    this.page = Number(this.page) + pageOffset;
    this.search();
  };

  onSearch = e => {
    const searchQuery = e.target.value;
    this.searchText = e.target.value;
    if (!searchQuery) {
      this.searchText = '';
      this.updateRoute();
      delete this.query.$or;
      return this.search();
    }
    if (searchQuery.length <= 3) {
      this.searchText = '';
      this.updateRoute();
      delete this.query.$or;
      return this.search();
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
    } else {
      this.query.paymentStatus = Number(this.query.paymentStatus);
    }

    this.search();
  };

  open = invoiceId => {
    this.props.history.push('/app/admin/invoices/' + invoiceId);
  };

  render() {
    if (this.page < 1) {
      this.page = 1;
    }
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
                    <div className="col-md-5">
                      <div className="input-group transparent">
                        <span className="input-group-addon">
                          <i className="fa fa-search" />
                        </span>
                        <input
                          type="text"
                          placeholder="Invoice id, billing label, user details, payment links"
                          className="form-control"
                          defaultValue={this.searchText}
                          onChange={this.onSearch}
                        />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="form-group ">
                        <select className="full-width select2-hidden-accessible" data-init-plugin="select2" tabIndex="-1" aria-hidden="true" onChange={this.onInvoiceStatusChanged}>
                          <option value="all" selected={!this.query.paymentStatus}>
                            States: All
                          </option>
                          <option value="1" selected={this.query.paymentStatus === 1}>
                            Pending
                          </option>
                          <option value="2" selected={this.query.paymentStatus === 2}>
                            Paid
                          </option>
                          <option value="7" selected={this.query.paymentStatus === 7}>
                            Offline Payment
                          </option>
                          <option value="3" selected={this.query.paymentStatus === 3}>
                            Demo User
                          </option>
                          <option value="4" selected={this.query.paymentStatus === 4}>
                            Failed
                          </option>
                          <option value="5" selected={this.query.paymentStatus === 5}>
                            Waived Off
                          </option>
                          <option value="6" selected={this.query.paymentStatus === 6}>
                            Refunded
                          </option>
                        </select>
                      </div>
                    </div>

                    <div className="col-md-2">
                      <div className="checkbox check-success">
                        <input
                          type="checkbox"
                          value="1"
                          defaultChecked={!!this.query.billingPeriodLabel}
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
                        <label htmlFor="checkbox2">Only this month's</label>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="checkbox check-success">
                        <input
                          type="checkbox"
                          value="2"
                          defaultChecked={!!this.hideZeroes}
                          id="checkbox3"
                          onClick={e => {
                            if (e.target.checked) {
                              this.hideZeroes = true;
                            } else {
                              this.hideZeroes = false;
                            }
                            this.search();
                          }}
                        />
                        <label htmlFor="checkbox3">Hide Zeroes</label>
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
                              <td>{this.state.loading ? <i className="fa fa-spin fa-circle-o-notch text-primary" /> : (this.page - 1) * PAGE_LIMIT + index + 1}</td>
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
                        {this.page && this.page > 1 && (
                          <li className="page-item" onClick={() => this.changePage(-1)}>
                            <a className="page-link">Previous</a>
                          </li>
                        )}
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
