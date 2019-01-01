import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import Vouchers from '../../../../../collections/vouchers/voucher';
import helpers from '../../../../../modules/helpers';
import { withRouter, Link } from 'react-router-dom';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';
import ReactHtmlParser from 'react-html-parser';
import moment from 'moment';

const PAGE_LIMIT = 20;
class VoucherList extends Component {
  constructor(props) {
    super(props);

    this.query = {
      type: props.type,
    };

    this.state = {
      page: 0,
      vouchers: Vouchers.find(this.query).fetch(),
    };
  }

  componentWillUnmount() {
    // this.props.subscriptions.forEach(s => {
    //   s.stop();
    // });
    // this.voucherSubscription.stop();
  }

  componentDidMount() {
    this.search();
  }

  search = () => {
    this.voucherSubscription = Meteor.subscribe(
      'vouchers.search',
      {
        query: this.query,
        type: this.props.type,
      },
      {
        onReady: () => {
          if (this.props.type === 'network') {
            this.query.type = {
              $in: [null, 'network'],
            };
          } else {
            this.query.type = this.props.type;
          }
          this.setState({
            vouchers: Vouchers.find(this.query).fetch(),
          });
        },
      }
    );
  };

  changePage = pageOffset => {
    if (this.state.page + pageOffset < 0) {
      return;
    }
    this.voucherSubscription.stop();
    this.voucherSubscription = Meteor.subscribe(
      'vouchers.all',
      { query: this.query, page: this.state.page + pageOffset, type: this.props.type },
      {
        onReady: () => {
          const page = this.state.page + pageOffset;
          this.setState({
            vouchers: Vouchers.find(this.query, {
              limit: PAGE_LIMIT,
              skip: 10 * page,
            }).fetch(),
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
    if (searchQuery.length <= 2) {
      delete this.query.$or;
      return this.changePage(0);
    }
    this.query.$or = [{ code: { $regex: `${searchQuery}*`, $options: 'i' } }, { _id: { $regex: `${searchQuery}*`, $options: 'i' } }];
    this.query.type = this.props.type;
    this.search();
  };

  onInstanceStateChange = e => {
    this.query.status = e.target.value;
    if (this.query.status === 'all') {
      delete this.query.status;
    }
    this.search();
  };

  getActiveStatus = (active, expiry) => {
    if (active) {
      return <span className="label label-success">Active</span>;
    } else if (new Date(expiry) < new Date()) {
      return <span className="label label-danger">Expired</span>;
    } else {
      return <span className="label label-danger">Inactive</span>;
    }
  };

  openVoucher = voucherId => {
    this.props.history.push('/app/admin/voucher/details/' + voucherId);
  };

  getNetworkType = config => {
    if (!config) {
      return null;
    }
    return `${config.cpu >= 100 ? config.cpu / 1000 : config.cpu} vCPU | ${config.ram} GB | ${config.disk} GB`;
  };

  onClaimChange = e => {
    const value = e.target.value;
    if (value === 'all') {
      delete this.query['availability.for_all'];
      delete this.query['usability.recurring'];
    } else if (value === 'recurring') {
      delete this.query['availability.for_all'];
      this.query['usability.recurring'] = true;
    } else if (value === 'for_all') {
      delete this.query['usability.recurring'];
      this.query['availability.for_all'] = true;
    } else if (value === 'not_for_all') {
      delete this.query['usability.recurring'];
      this.query['availability.for_all'] = false;
    } else {
      //more options will come here
      delete this.query['availability.for_all'];
      delete this.query['usability.recurring'];
    }
    this.search();
  };

  render() {
    return (
      <div className="voucherList">
        <div className="m-t-20 container-fluid container-fixed-lg bg-white">
          <div className="row">
            <div className="col-lg-12">
              <div className="card card-transparent">
                <div className="card-header ">
                  <div className="card-title">{this.props.type} Vouchers</div>
                </div>
                <div className="card-block">
                  <div className="row">
                    <div className="col-md-4">
                      <div className="input-group transparent">
                        <span className="input-group-addon">
                          <i className="fa fa-search" />
                        </span>
                        <input type="text" placeholder="Voucher code or Id" className="form-control" onChange={this.onSearch} />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="form-group ">
                        <select className="full-width select2-hidden-accessible" data-init-plugin="select2" tabIndex="-1" aria-hidden="true" onChange={this.onClaimChange}>
                          <option value="running">Show by: All</option>
                          <option value="recurring">Recurring Vouchers</option>
                          <option value="for_all">Accessible to all</option>
                          <option value="not_for_all">Not accessible to all</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-hover" id="basicTable">
                      <thead>
                        <tr>
                          <th style={{ width: '5%' }}>S.No</th>
                          <th style={{ width: '25%' }}>Voucher Code</th>
                          <th style={{ width: '13%' }}>Times Used</th>
                          <th style={{ width: '30%' }}>Config</th>
                          <th style={{ width: '7%' }}>Status</th>
                          <th style={{ width: '25%' }}>Created At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {this.state.vouchers.map((voucher, index) => {
                          return (
                            <tr key={index + 1} onClick={() => this.openVoucher(voucher._id)}>
                              <td>{this.state.page * PAGE_LIMIT + index + 1}</td>
                              <td>{voucher.code}</td>
                              <td>{voucher.voucher_claim_status ? voucher.voucher_claim_status.length : 0}</td>
                              <td>{this.getNetworkType(voucher.networkConfig)}</td>
                              <td>{this.getActiveStatus(voucher.voucher_status, voucher.expiryDate)}</td>
                              <td>{moment(voucher.createdAt).format('DD-MMM-YYYY')}</td>
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

export default withTracker(props => {
  return {
    subscriptions: [Meteor.subscribe('vouchers.all', { page: 0, type: props.type })],
  };
})(withRouter(VoucherList));
