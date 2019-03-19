import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import helpers from '../../../../modules/helpers';
import { withRouter } from 'react-router-dom';
import ReactHtmlParser from 'react-html-parser';
import moment from 'moment';
import { Paymeter } from '../../../../collections/paymeter/paymeter';
import querystring from 'querystring';

const PAGE_LIMIT = 10;
class PaymeterDashboard extends Component {
  constructor(props) {
    super(props);

    this.pagination = {};
    if (props.location.search) {
      const query = querystring.parse(props.location.search.substr(1));
      if (query.searchText) {
        this.searchText = query.searchText;
      }
      delete query.searchText;
      if (this.searchText) {
        query.$or = [
          { name: { $regex: `${this.searchText}*`, $options: 'i' } },
          { instanceId: { $regex: `${this.searchText}*`, $options: 'i' } },
          { _id: { $regex: `${this.search}*`, $options: 'i' } },
        ];
      }
      if (query.page) {
        this.page = Number(query.page);
        this.pagination.skip = (this.page - 1) * PAGE_LIMIT;
      }
      delete query.page;

      this.query = query;
    } else {
      this.query = {};
      this.page = 1;
    }

    this.state = {
      page: 0,
      users: [],
    };
  }

  updateRoute = () => {
    const sanitizedQuery = { ...this.query };
    delete sanitizedQuery.$or;
    this.props.history.replace({
      pathname: this.props.location.pathname,
      search: `?${querystring.stringify({ ...sanitizedQuery, searchText: this.searchText, page: this.page })}`,
    });
  };

  search = () => {
    this.updateRoute();
    if (this.page) {
      this.pagination.skip = (this.page - 1) * PAGE_LIMIT;
    }
    this.setState({
      loading: true,
    });
    this.pagination.limit = PAGE_LIMIT;
    this.networkSubscription = Meteor.subscribe(
      'paymeter.search',
      {
        query: this.query,
        page: this.page,
      },
      {
        onReady: () => {
          const userPaymeterMapping = {};
          const paymeters = Paymeter.find({}, this.pagination).fetch();
          paymeters.forEach(p => {
            userPaymeterMapping[p.userId] = p;
          });
          this.setState({
            paymeters,
            users: Meteor.users.find({ _id: { $in: paymeters.map(p => p.userId) }, ...this.query }),
            loading: false,
            userPaymeterMapping,
          });
        },
      }
    );
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
    this.searchText = searchQuery;
    if (!searchQuery) {
      this.searchText = '';
      this.updateRoute();
      delete this.query.$or;
      return this.changePage(0);
    }
    if (searchQuery.length <= 3) {
      this.searchText = '';
      this.updateRoute();
      delete this.query.$or;
      return this.changePage(0);
    }
    this.query.$or = [
      { 'profile.firstName': { $regex: `${searchQuery}*`, $options: 'i' } },
      { 'profile.lastName': { $regex: `${searchQuery}*`, $options: 'i' } },
      { 'emails.address': { $regex: `${searchQuery}*`, $options: 'i' } },
      { _id: { $regex: `${searchQuery}*`, $options: 'i' } },
    ];
    this.search();
  };

  openPaymeter = paymeterId => {
    this.props.history.push(`/app/admin/paymeter/${paymeterId}`);
  };

  componentDidMount() {
    this.search();
  }

  render() {
    if (this.page < 1) {
      this.page = 1;
    }
    return (
      <div className="content paymeterDashboard">
        <div className="m-t-20 container-fluid container-fixed-lg bg-white">
          <div className="row">
            <div className="col-md-12">
              <iframe
                src={`https://metabase.blockcluster.io/embed/dashboard/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNvdXJjZSI6eyJkYXNoYm9hcmQiOjR9LCJwYXJhbXMiOnt9LCJpYXQiOjE1NTI4ODM5MTl9.iOPi_MphZJztTfSZgyr70rXgbepqwaAMzIbcK7-8iCg#bordered=false&titled=false&refresh=60${
                  window.theme === 'theme-dark' ? '&theme=night' : ''
                }`}
                frameBorder="0"
                width="100%"
                height="180px"
                allowtransparency="true"
              />
            </div>
          </div>
          <div className="row">
            <div className="col-lg-12">
              <div className="card card-transparent">
                <div className="card-header ">
                  <div className="card-title">Subscribed Users</div>
                </div>
                <div className="card-block">
                  <div className="row">
                    <div className="col-md-4">
                      <div className="input-group transparent">
                        <span className="input-group-addon">
                          <i className="fa fa-search" />
                        </span>
                        <input type="text" placeholder="User ID or email" className="form-control" onChange={this.onSearch} />
                      </div>
                    </div>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-hover" id="basicTable">
                      <thead>
                        <tr>
                          <th style={{ width: '5%' }}>S.No</th>
                          <th style={{ width: '20%' }}>Name</th>
                          <th style={{ width: '20%' }}>Email</th>
                          <th style={{ width: '15%' }}>Bill</th>
                          <th style={{ width: '20%' }}>Voucher</th>
                          <th style={{ width: '20%' }}>Subscribed On</th>
                        </tr>
                      </thead>
                      <tbody>
                        {this.state.users.map((user, index) => {
                          const paymeter = this.state.userPaymeterMapping[user._id];
                          return (
                            <tr key={index + 1} onClick={() => this.openPaymeter(paymeter._id)}>
                              <td>{this.state.loading ? <i className="fa fa-spin fa-circle-o-notch text-primary" /> : (this.page - 1) * PAGE_LIMIT + index + 1}</td>
                              <td>
                                {user.profile.firstName} {user.profile.lastName}
                              </td>
                              <td>{user.emails[0].address}</td>
                              <td>$ {Math.max(paymeter.bill, paymeter.minimumFeeThisMonth)}</td>
                              <td>{paymeter.vouchers ? paymeter.vouchers.map(v => v.code).join(', ') : '-'}</td>
                              <td>
                                {paymeter.subscriptions
                                  ? moment(
                                      paymeter.subscriptions.sort((a, b) => (moment(a.at).isBefore(moment(b.at)) ? -1 : 1)).find(a => a.action === 'subscribe').at || undefined
                                    ).format('DD-MMM-YYYY kk:mm:ss')
                                  : ''}
                              </td>
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
    subscriptions: [],
  };
})(withRouter(PaymeterDashboard));
