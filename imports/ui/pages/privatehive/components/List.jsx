import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import PrivateHive from '../../../../collections/privatehive';
import { PrivatehivePeers } from '../../../../collections/privatehivePeers/privatehivePeers';
import { PrivatehiveOrderers } from '../../../../collections/privatehiveOrderers/privatehiveOrderers';
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
      return <span className="label label-inverse">Initializing</span>;
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
  }

  openNetwork = network => {
    if (network.type === 'peer') {
      this.props.history.push(`/app/privatehive/${network.instanceId}/details`);
    } else {
      this.props.history.push(`/app/privatehive/${network.instanceId}/security`);
    }
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
                          <th style={{ width: '15%' }}>MSP ID</th>
                          <th style={{ width: '15%' }}>Organisation Type</th>
                          <th style={{ width: '18%' }}>Location</th>
                          <th style={{ width: '17%' }}>Status</th>
                          <th style={{ width: '15%' }}>Created on</th>
                        </tr>
                      </thead>
                      <tbody>
                        {this.props.networks
                          .sort(
                            (a, b) =>
                              moment(a.createdAt)
                                .toDate()
                                .getTime() -
                              moment(b.createdAt)
                                .toDate()
                                .getTime()
                          )
                          .map((item, index) => {
                            return (
                              <tr key={item._id} onClick={() => this.openNetwork(item)}>
                                <td className="v-align-middle ">{item.name}</td>
                                <td className="v-align-middle">{item.instanceId.toPascalCase()}</td>
                                <td className="v-align-middle">{item.type === 'peer' ? 'Peer' : 'Orderer'}</td>
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
    networks: [
      ...PrivatehivePeers.find({ userId: Meteor.userId(), active: true, deletedAt: null })
        .fetch()
        .map(o => ({ ...o, type: 'peer' })),
      ...PrivatehiveOrderers.find({ userId: Meteor.userId(), active: true, deletedAt: null })
        .fetch()
        .map(o => ({ ...o, type: 'orderer' })),
    ].sort((a, b) => (moment(a.createdAt).isBefore(moment(b.createdAt)) ? -1 : 1)),
    subscriptions: [Meteor.subscribe('privatehive')],
  };
})(withRouter(NetworksList));
