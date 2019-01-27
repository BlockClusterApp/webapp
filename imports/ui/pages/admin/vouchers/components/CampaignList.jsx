import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import Campaign from '../../../../../collections/vouchers/campaign';
import helpers from '../../../../../modules/helpers';
import { withRouter, Link } from 'react-router-dom';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';
import ReactHtmlParser from 'react-html-parser';
import moment from 'moment';

const PAGE_LIMIT = 20;
class VoucherList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      page: 0,
      vouchers: Campaign.find({}).fetch(),
    };

    this.query = {};
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
        type: 'campaign',
      },
      {
        onReady: () => {
          delete this.query.type;
          this.setState({
            vouchers: Campaign.find(this.query).fetch(),
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
      { query: this.query, page: this.state.page + pageOffset, type: 'campaign' },
      {
        onReady: () => {
          const page = this.state.page + pageOffset;
          delete this.query.type;
          this.setState({
            vouchers: Campaign.find(this.query, {
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
    this.query.$or = [{ description: { $regex: `${searchQuery}*`, $options: 'i' } }];
    this.query.type = 'campaign';
    this.search();
  };

  getActiveStatus = (active, expiry) => {
    if (active) {
      return <span className="label label-success">Live</span>;
    } else if (new Date(expiry) < new Date()) {
      return <span className="label label-danger">Expired</span>;
    } else {
      return <span className="label label-danger">Offline</span>;
    }
  };

  openVoucher = voucherId => {
    this.props.history.push('/app/admin/campaign/details/' + voucherId);
  };

  render() {
    return (
      <div className="voucherList">
        <div className="m-t-20 container-fluid container-fixed-lg bg-white">
          <div className="row">
            <div className="col-lg-12">
              <div className="card card-transparent">
                <div className="card-header ">
                  <div className="card-title">Vouchers</div>
                </div>
                <div className="card-block">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="input-group transparent">
                        <span className="input-group-addon">
                          <i className="fa fa-search" />
                        </span>
                        <input type="text" placeholder="Campaign description" className="form-control" onChange={this.onSearch} />
                      </div>
                    </div>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-hover" id="basicTable">
                      <thead>
                        <tr>
                          <th style={{ width: '5%' }}>S.No</th>
                          <th style={{ width: '55%' }}>Title</th>
                          <th style={{ width: '10%' }}>Live</th>
                          <th style={{ width: '30%' }}>Expiry</th>
                        </tr>
                      </thead>
                      <tbody>
                        {this.state.vouchers.map((voucher, index) => {
                          return (
                            <tr key={index + 1}>
                              <td>{this.state.page * PAGE_LIMIT + index + 1}</td>
                              <td>{voucher.description}</td>
                              <td>{this.getActiveStatus(voucher.live, voucher.expiryDate)}</td>
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
    subscriptions: [Meteor.subscribe('vouchers.all', { page: 0, type: 'campaign' })],
  };
})(withRouter(VoucherList));
