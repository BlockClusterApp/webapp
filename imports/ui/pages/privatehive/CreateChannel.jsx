import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import PrivateHive from '../../../collections/privatehive';
import { withRouter } from 'react-router-dom';
import { Link } from 'react-router-dom';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';
import notifications from '../../../modules/notifications';
import { PrivatehiveOrderers } from '../../../collections/privatehiveOrderers/privatehiveOrderers';
import { PrivatehivePeers } from '../../../collections/privatehivePeers/privatehivePeers';
import PrivateHiveNetworkSelector from '../../components/Selectors/PrivatehiveNetworkSelector';

class CreateChannel extends Component {
  constructor() {
    super();

    this.state = {
      channels: [],
    };
  }

  componentDidMount() {}

  createChannel = () => {
    const { network } = this.props;
    if (!this.channelName.value) {
      return '';
    }
    this.setState({
      loading: true,
    });

    Meteor.call('privatehiveCreateChannel', { peerId: this.props.match.params.id, ordererId: this.ordererNetwork.instanceId, channelName: this.channelName.value }, (err, res) => {
      this.setState({
        loading: false,
      });
      if (err) {
        return notifications.error(err.reason);
      } else {
        return notifications.success('Channel created');
      }
    });
  };

  render() {
    return (
      <div className="assetsStats content">
        <div className="m-t-20 container-fluid container-fixed-lg bg-white">
          <div className="row dashboard">
            <div className="col-lg-12">
              <div className="card card-transparent">
                <div className="card-header ">
                  <div className="card-title">
                    <Link to={`/app/privatehive/${this.props.match.params.id}/details`}>
                      {' '}
                      Control Panel <i className="fa fa-angle-right" />
                    </Link>{' '}
                    Create Channel
                  </div>
                </div>
                <div className="card-block">
                  <div className="row">
                    <div className="col-xl-12">
                      <div className="card card-transparent m-b-0">
                        <div className="form-group">
                          <label>Channel Name</label>
                          <span className="help"> e.g. "EU Banks"</span>
                          <input
                            type="text"
                            className="form-control"
                            required
                            ref={input => {
                              this.channelName = input;
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="col-sm-12">
                      <PrivateHiveNetworkSelector
                        key={this.props.networks.length}
                        networks={this.props.networks.length > 0 ? this.props.networks.filter(p => p.type === 'orderer') : []}
                        onValueChangeListener={network => {
                          this.ordererNetwork = network;
                        }}
                        label="Select Orderer"
                      />
                    </div>
                    <div className="col-sm-12">
                      <LaddaButton
                        loading={this.state.loading}
                        data-size={S}
                        data-style={SLIDE_UP}
                        data-spinner-size={30}
                        data-spinner-lines={12}
                        className="btn btn-success m-t-10 col-md-3"
                        onClick={this.createChannel}
                      >
                        <i className="fa fa-plus-circle" aria-hidden="true" />
                        &nbsp;&nbsp;Create
                      </LaddaButton>
                    </div>
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
    network: [
      ...PrivatehivePeers.find({ instanceId: props.match.params.id, active: true })
        .fetch()
        .map(p => ({ ...p, type: 'peer' })),
      ...PrivatehiveOrderers.find({ instanceId: props.match.params.id, active: true })
        .fetch()
        .map(p => ({ ...p, type: 'orderer' })),
    ][0],
    networks: [
      ...PrivatehivePeers.find({ userId: Meteor.userId(), active: true })
        .fetch()
        .map(p => ({ ...p, type: 'peer' })),
      ...PrivatehiveOrderers.find({ userId: Meteor.userId(), active: true })
        .fetch()
        .map(p => ({ ...p, type: 'orderer' })),
    ],
    subscriptions: [
      Meteor.subscribe(
        'privatehive',
        {},
        {
          onReady: function() {
            if (
              [
                ...PrivatehivePeers.find({ instanceId: props.match.params.id, active: true }).fetch(),
                ...PrivatehiveOrderers.find({ instanceId: props.match.params.id, active: true }).fetch(),
              ].length !== 1
            ) {
              props.history.push('/app/privatehive/list');
            }
          },
        }
      ),
    ],
  };
})(withRouter(CreateChannel));
