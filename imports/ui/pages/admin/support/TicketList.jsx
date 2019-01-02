import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import SupportTicket from '../../../../collections/support-ticket';
import helpers from '../../../../modules/helpers';
import { withRouter } from 'react-router-dom';
import ReactHtmlParser from 'react-html-parser';
import moment from 'moment';
import querystring from 'querystring';

const PAGE_LIMIT = 10;
class TicketList extends Component {
  constructor(props) {
    super(props);

    this.pagination = {
      limit: 10,
    };
    if (props.location.search) {
      const query = querystring.parse(props.location.search.substr(1));
      if (query.searchText) {
        this.searchText = query.searchText;
      }
      delete query.searchText;
      if (this.searchText) {
        query.caseId = { $regex: `${this.searchText}*`, $options: 'i' };
      }

      if (query.page) {
        this.page = Number(query.page);
        this.pagination.skip = (this.page - 1) * PAGE_LIMIT;
      }
      delete query.page;

      if (query.status) {
        query.status = Number(query.status);
      }
      if (query.active === 'true') {
        query.active = true;
      } else if (query.active === 'false') {
        query.active = false;
      } else {
        delete query.active;
      }
      this.query = query;
    } else {
      this.query = {};
      this.page = 1;
    }

    this.state = {
      page: 0,
      support: SupportTicket.find(this.query, this.pagination).fetch(),
    };
  }

  updateRoute = () => {
    const sanitizedQuery = { ...this.query };
    delete sanitizedQuery.caseId;
    delete sanitizedQuery.$or;
    delete sanitizedQuery.page;
    this.props.history.replace({
      pathname: this.props.location.pathname,
      search: `?${querystring.stringify({ ...sanitizedQuery, searchText: this.searchText, page: this.page })}`,
    });
  };

  componentWillUnmount() {
    // this.props.subscriptions.forEach(s => {
    //   s.stop();
    // });
    // this.supportSubscription.stop();
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
    this.pagination.limit = PAGE_LIMIT;
    this.supportSubscription = Meteor.subscribe(
      'support.search',
      {
        query: this.query,
      },
      {
        onReady: () => {
          this.setState({
            support: SupportTicket.find(this.query, this.pagination).fetch(),
            loading: false,
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
    this.searchText = e.target.value;
    if (!searchQuery) {
      delete this.query.caseId;
      this.searchText = '';
      this.updateRoute();
      return this.changePage(0);
    }
    this.query.caseId = { $regex: `${searchQuery}*`, $options: 'i' };
    this.search();
  };

  onTicketStatusChange = e => {
    this.query.status = e.target.value;
    if (this.query.status === 'all') {
      delete this.query.status;
    } else {
      this.query.status = Number(this.query.status);
    }
    this.search();
  };

  openSupportTicket = supportId => {
    this.props.history.push('/app/admin/support/' + supportId);
  };

  render() {
    return (
      <div className="content supportList">
        <div className="m-t-20 container-fluid container-fixed-lg bg-white">
          <div className="row">
            <div className="col-lg-12">
              <div className="card card-transparent">
                <div className="card-header ">
                  <div className="card-title">Support Tickets</div>
                </div>
                <div className="card-block">
                  <div className="row">
                    <div className="col-md-8">
                      <div className="input-group transparent">
                        <span className="input-group-addon">
                          <i className="fa fa-search" />
                        </span>
                        <input type="text" placeholder="Case ID" defaultValue={this.searchText} className="form-control" onChange={this.onSearch} />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group ">
                        <select className="full-width select2-hidden-accessible" data-init-plugin="select2" tabIndex="-1" aria-hidden="true" onChange={this.onTicketStatusChange}>
                          <option value="all" selected={!this.query.status}>
                            States: All
                          </option>
                          <option value="1" selected={this.query.status === 1}>
                            New
                          </option>
                          <option value="2" selected={this.query.status === 2}>
                            BlockCluster Action Pending
                          </option>
                          <option value="3" selected={this.query.status === 3}>
                            Customer Action Pending
                          </option>
                          <option value="4" selected={this.query.status === 4}>
                            Cancelled
                          </option>
                          <option value="5" selected={this.query.status === 5}>
                            Resolved
                          </option>
                          <option value="6" selected={this.query.status === 6}>
                            System Closed
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-hover" id="basicTable">
                      <thead>
                        <tr>
                          <th style={{ width: '5%' }}>S.No</th>
                          {/* <th style={{width: "15%"}}>Id</th> */}
                          <th style={{ width: '40%' }}>Subject</th>
                          <th style={{ width: '15%' }}>Case Id</th>
                          <th style={{ width: '20%' }}>Status</th>
                          <th style={{ width: '20%' }}>Created At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {this.state.support.map((ticket, index) => {
                          return (
                            <tr key={index + 1} onClick={() => this.openSupportTicket(ticket._id)}>
                              <td>{this.state.loading ? <i className="fa fa-spin fa-circle-o-notch text-primary" /> : (this.page - 1) * PAGE_LIMIT + index + 1}</td>
                              <td>{ticket.subject}</td>
                              <td>{ticket.caseId}</td>
                              <td>{helpers.getSupportTicketStatus(ticket.status)}</td>
                              <td>{moment(ticket.createdAt).format('DD-MMM-YY hh:mm A')}</td>
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
    subscriptions: [Meteor.subscribe('support.all', { page: 0 })],
  };
})(withRouter(TicketList));
