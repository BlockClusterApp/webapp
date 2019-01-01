import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { Networks } from '../../../../collections/networks/networks.js';
import helpers from '../../../../modules/helpers';
import { withRouter } from 'react-router-dom';
import ReactHtmlParser from 'react-html-parser';
import moment from 'moment';

const PAGE_LIMIT = 20;
class NetworkList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      locations: [],
      page: 0,
      networks: Networks.find({}).fetch(),
    };

    this.query = {
      deletedAt: null,
    };
  }

  componentWillUnmount() {
    // this.props.subscriptions.forEach((s) =>{
    //     s.stop();
    // });
    // this.networkSubscription.stop();
  }

  componentDidMount() {
    Meteor.call('getClusterLocations', (err, res) => {
      this.setState({
        locations: res,
      });
    });

    this.search();
  }

  search = () => {
    this.networkSubscription = Meteor.subscribe(
      'networks.search',
      {
        query: this.query,
      },
      {
        onReady: () => {
          this.setState({
            networks: Networks.find(this.query).fetch(),
          });
        },
      }
    );
  };

  changePage = pageOffset => {
    if (this.state.page + pageOffset < 0) {
      return;
    }
    this.networkSubscription.stop();
    this.networkSubscription = Meteor.subscribe(
      'networks.all',
      { query: this.query, page: this.state.page + pageOffset },
      {
        onReady: () => {
          const page = this.state.page + pageOffset;
          this.setState({
            networks: Networks.find(this.query).fetch(),
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
      { name: { $regex: `${searchQuery}*`, $options: 'i' } },
      { instanceId: { $regex: `${searchQuery}*`, $options: 'i' } },
      { _id: { $regex: `${searchQuery}*`, $options: 'i' } },
    ];
    this.search();
  };

  onInstanceStateChange = e => {
    this.query.status = e.target.value;
    if (this.query.status === 'all') {
      delete this.query.status;
    }
    this.search();
  };

  onLocationChange = e => {
    this.query.locationCode = e.target.value;
    if (this.query.locationCode === 'all') {
      delete this.query.locationCode;
    }
    this.search();
  };

  openNetwork = networkId => {
    this.props.history.push('/app/admin/networks/' + networkId);
  };

  getEmailVerificationLabel = verification => {
    if (verification) {
      return <span className="label label-success">Yes</span>;
    } else {
      return <span className="label label-important">No</span>;
    }
  };

  render() {
    const locationOptions = this.state.locations.map(location => {
      return (
        <option value={location.locationCode} key={location.locationCode}>
          {location.locationName}
        </option>
      );
    });
    return (
      <div className="content networksList">
        <div className="m-t-20 container-fluid container-fixed-lg bg-white">
          <div className="row">
            <div className="col-lg-12">
              <div className="card card-transparent">
                <div className="card-header ">
                  <div className="card-title">Networks</div>
                </div>
                <div className="card-block">
                  <div className="row">
                    <div className="col-md-4">
                      <div className="input-group transparent">
                        <span className="input-group-addon">
                          <i className="fa fa-search" />
                        </span>
                        <input type="text" placeholder="Network name or instance id" className="form-control" onChange={this.onSearch} />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="form-group ">
                        <select className="full-width select2-hidden-accessible" data-init-plugin="select2" tabIndex="-1" aria-hidden="true" onChange={this.onInstanceStateChange}>
                          <option value="running">States: All</option>
                          <option value="running">Running</option>
                          <option value="down">Down</option>
                          <option value="initializing">Initializing</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="form-group ">
                        <select className="full-width select2-hidden-accessible" data-init-plugin="select2" tabIndex="-1" aria-hidden="true" onChange={this.onLocationChange}>
                          <option value="all">Locations: All</option>
                          {locationOptions}
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
                              this.query.deletedAt = null;
                            } else {
                              delete this.query.deletedAt;
                            }
                            this.search();
                          }}
                        />
                        <label htmlFor="checkbox2">Only live nodes</label>
                      </div>
                    </div>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-hover" id="basicTable">
                      <thead>
                        <tr>
                          <th style={{ width: '5%' }}>S.No</th>
                          {/* <th style={{width: "15%"}}>Id</th> */}
                          <th style={{ width: '30%' }}>Name</th>
                          <th style={{ width: '25%' }}>Instance id</th>
                          <th style={{ width: '20%' }}>Status</th>
                          <th style={{ width: '20%' }}>Created At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {this.state.networks.map((network, index) => {
                          return (
                            <tr key={index + 1} onClick={() => this.openNetwork(network._id)}>
                              <td>{this.state.page * PAGE_LIMIT + index + 1}</td>
                              <td>{network.name}</td>
                              <td>{network.instanceId}</td>
                              <td>
                                {ReactHtmlParser(
                                  helpers.convertStatusToTag(helpers.calculateNodeStatus(network.status), helpers.firstLetterCapital(helpers.calculateNodeStatus(network.status)))
                                )}
                              </td>
                              <td>{moment(network.createdAt).format('DD-MMM-YYYY kk:ss')}</td>
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
    subscriptions: [Meteor.subscribe('networks.all', { page: 0 })],
  };
})(withRouter(NetworkList));
