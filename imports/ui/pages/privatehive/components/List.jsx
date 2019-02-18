import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import PrivateHive from '../../../../collections/privatehive';
import helpers from '../../../../modules/helpers';
import moment from 'moment';
import { withRouter } from 'react-router-dom';

class NetworksList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      locations: [],
    };
  }

  componentWillUnmount() {
    // this.props.subscriptions.forEach(s => {
    //   s.stop();
    // });
  }

  convertStatusToTag = status => {
    if (!status) {
      return null;
    }
    if (status === 'initializing' || status === 'pending') {
      return <span className="label label-inverse">{helpers.firstLetterCapital(status)}</span>;
    } else if (status === 'running' || status === 'completed') {
      return <span className="label label-success">{helpers.firstLetterCapital(status)}</span>;
    } else if (status === 'down' || status === 'cancelled' || status.includes('delete')) {
      return <span className="label label-important">{helpers.firstLetterCapital(status)}</span>;
    }
    return <span className="label label-inverse">{helpers.firstLetterCapital(status)}</span>;
  };

  componentDidMount() {
    Meteor.call('getClusterLocations', {}, (err, res) => {
      if (err) {
        console.log(err);
      } else {
        this.setState({
          locations: res,
        });
      }
    });
    Meteor.call('getPrivateHiveNetworkCount', (err, res) => {
      console.log('Count', res);
      if (!err) {
        if (res <= 0) {
          this.props.history.push(`/app/privatehive/create`);
        }
      }
    });
  }

  openNetwork = networkId => {
    this.props.history.push(`/app/privatehive/${networkId}/details`);
  };

  getLocationName = locationCode => {
    const locationConfig = this.state.locations.find(a => a.locationCode === locationCode);
    if (!locationConfig) {
      return undefined;
    }
    return locationConfig.locationName;
  };

  render() {
    return (
      <div className="networksList">
        <div className="m-t-20  container-fluid container-fixed-lg bg-white">
          <div className="row">
            <div className="col-lg-12">
              <div className="card card-transparent">
                <div className="card-header ">
                  <div className="card-title">List of Networks</div>
                </div>
                <div className="card-block">
                  <div className="table-responsive">
                    <table className="table table-hover" id="basicTable">
                      <thead>
                        <tr>
                          <th style={{ width: '20%' }}>Name</th>
                          <th style={{ width: '15%' }}>Instance ID</th>
                          <th style={{ width: '15%' }}>Member Type</th>
                          <th style={{ width: '18%' }}>Location</th>
                          <th style={{ width: '17%' }}>Status</th>
                          <th style={{ width: '15%' }}>Created on</th>
                        </tr>
                      </thead>
                      <tbody>
                        {this.props.networks.map((item, index) => {
                          return (
                            <tr key={item._id} onClick={() => this.openNetwork(item.instanceId)}>
                              <td className="v-align-middle ">{item.name}</td>
                              <td className="v-align-middle">{item.instanceId}</td>
                              <td className="v-align-middle">{item.isJoin ? 'Peer' : 'Authority'}</td>
                              <td className="v-align-middle">{this.getLocationName(item.locationCode)}</td>
                              <td className="v-align-middle">{this.convertStatusToTag(item.status)}</td>
                              <td className="v-align-middle">{moment(item.createdAt).format('DD-MMM-YYYY kk:mm')}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
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
    networks: PrivateHive.find({ userId: Meteor.userId(), active: true, deletedAt: null }).fetch(),
    subscriptions: [Meteor.subscribe('privatehive')],
  };
})(withRouter(NetworksList));
