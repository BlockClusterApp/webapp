import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter } from 'react-router-dom';
import moment from 'moment';
import querystring from 'querystring';

const PAGE_LIMIT = 10;
class UserList extends Component {
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
          { 'profile.firstName': { $regex: `${this.searchText}*`, $options: 'i' } },
          { 'profile.lastName': { $regex: `${this.searchText}*`, $options: 'i' } },
          { _id: { $regex: `${this.searchText}*`, $options: 'i' } },
          { 'emails.address': { $regex: `${this.searchText}*`, $options: 'i' } },
        ];
      }
      if (query['emails.verified'] === 'false') {
        query['emails.verified'] = false;
      } else if (query['emails.verified'] === 'true') {
        query['emails.verified'] = true;
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
      locations: [],
      page: 0,
      users: Meteor.users.find(this.query, this.pagination).fetch(),
    };
  }

  componentWillUnmount() {
    // this.props.subscriptions.forEach((s) =>{
    //     s.stop();
    // });
    // this.userSubscription.stop();
  }

  componentDidMount() {
    this.search();
  }
  updateRoute = () => {
    const sanitizedQuery = { ...this.query };
    delete this.query.page;
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
    this.userSubscription = Meteor.subscribe(
      'users.search',
      {
        query: this.query,
        page: this.page,
      },
      {
        onReady: () => {
          this.setState({
            users: Meteor.users.find(this.query, this.pagination).fetch(),
            loading: false,
          });
        },
      }
    );
  };

  onSearch = e => {
    this.searchText = e.target.value;
    const searchQuery = e.target.value;
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
      { 'profile.firstName': { $regex: `${searchQuery}*`, $options: 'i' } },
      { 'profile.lastName': { $regex: `${searchQuery}*`, $options: 'i' } },
      { _id: { $regex: `${searchQuery}*`, $options: 'i' } },
      { 'emails.address': { $regex: `${searchQuery}*`, $options: 'i' } },
    ];
    this.search();
  };

  onEmailVerificationChange = e => {
    const value = e.target.value;
    if (value === 'all') {
      delete this.query['emails.verified'];
    } else if (value === 'verified') {
      this.query['emails.verified'] = true;
    } else if (value === 'unverified') {
      this.query['emails.verified'] = false;
    }
    this.search();
  };

  changePage = pageOffset => {
    if (this.page + pageOffset < 0) {
      return;
    }
    this.page = Number(this.page) + pageOffset;
    this.search();
  };

  openUser = userId => {
    this.props.history.push('/app/admin/users/' + userId);
  };

  getEmailVerificationLabel = verification => {
    if (verification) {
      return <span className="label label-success">Yes</span>;
    } else {
      return <span className="label label-important">No</span>;
    }
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
                  <div className="card-title">Users</div>
                  <div className="row">
                    <div className="col-md-9">
                      <div className="input-group transparent">
                        <span className="input-group-addon">
                          <i className="fa fa-search" />
                        </span>
                        <input type="text" placeholder="User name, email or id" defaultValue={this.searchText} className="form-control" onChange={this.onSearch} />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="form-group ">
                        <select
                          className="full-width select2-hidden-accessible"
                          data-init-plugin="select2"
                          tabIndex="-1"
                          aria-hidden="true"
                          onChange={this.onEmailVerificationChange}
                        >
                          <option value="all" selected={!this.query['emails.verified'] === undefined}>
                            Email: All
                          </option>
                          <option value="verified" selected={this.query['emails.verified'] === true}>
                            Verified
                          </option>
                          <option value="unverified" selected={this.query['emails.verified'] === false}>
                            Not Verified
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card-block">
                  <div className="table-responsive">
                    <table className="table table-hover" id="basicTable">
                      <thead>
                        <tr>
                          <th style={{ width: '5%' }}>S.No</th>
                          {/* <th style={{width: "15%"}}>Id</th> */}
                          <th style={{ width: '30%' }}>Name</th>
                          <th style={{ width: '33%' }}>Email</th>
                          <th style={{ width: '12%' }}>Email Verified</th>
                          <th style={{ width: '20%' }}>Created on</th>
                        </tr>
                      </thead>
                      <tbody>
                        {this.state.users.map((user, index) => {
                          return (
                            <tr key={index + 1} onClick={() => this.openUser(user._id)}>
                              <td>{this.state.loading ? <i className="fa fa-spin fa-circle-o-notch text-primary" /> : (this.page - 1) * PAGE_LIMIT + index + 1}</td>
                              <td>
                                {user.profile.firstName} {user.profile.lastName}
                              </td>
                              <td>{user.emails[0].address}</td>
                              <td>{this.getEmailVerificationLabel(user.emails[0].verified)}</td>
                              <td>{moment(user.createdAt).format('DD-MMM-YYYY kk:mm:ss')}</td>
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
    users: Meteor.users.find({}).fetch(),
    subscriptions: [Meteor.subscribe('users.all', { page: 0 })],
  };
})(withRouter(UserList));
