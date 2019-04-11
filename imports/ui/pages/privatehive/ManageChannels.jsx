import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter } from 'react-router-dom';
import { Link } from 'react-router-dom';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';
import notifications from '../../../modules/notifications';
import { PrivatehiveOrderers } from '../../../collections/privatehiveOrderers/privatehiveOrderers';
import { PrivatehivePeers } from '../../../collections/privatehivePeers/privatehivePeers';
import moment from 'moment';

import './Explorer.scss';

class ManageChannels extends Component {
  constructor() {
    super();

    this.state = {
      channels: [],
      modalChannel: {},
    };

    this.getChannels = this.getChannels.bind(this);
  }

  componentDidMount() {
    setTimeout(() => this.getChannels(), 1000);
    this.setState({
      refreshAssetTypesTimer: setInterval(this.getChannels, 15000),
    });
  }

  componentWillUnmount() {
    this.props.subscriptions.forEach(s => {
      s.stop();
    });

    clearInterval(this.state.refreshAssetTypesTimer);
  }

  getChannels() {
    Meteor.call(
      'fetchChannels',
      {
        networkId: this.props.match.params.id,
      },
      (err, res) => {
        this.setState({
          loading: false,
        });
        if (err) {
          return notifications.error(err.reason);
        }
        return this.setState({
          channels: res.message,
        });
      }
    );
  }

  getChannelInfo = channelName => {
    this.setState(
      {
        showChannelInfoModal: true,
        channelInfo: null,
      },
      () => {
        $('#channel_info_modal').modal('show');
      }
    );
    const { network } = this.props;
    const url = `https://${network.properties.apiEndPoint}/channels/${channelName}/info`;
    HTTP.get(
      url,
      {
        headers: {
          'x-access-key': network.properties.tokens ? network.properties.tokens[0] : undefined,
        },
      },
      (err, res) => {
        if (err) {
          return notifications.error(err);
        }
        if (!res.data.success) {
          return notifications.error(res.data.error);
        }
        this.setState({
          channelInfo: res.data.data,
        });
      }
    );
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
                    Channel Management
                  </div>
                </div>
                <div className="card-block">
                  <div className="row">
                    <div className="col-xl-12">
                      <div className="card card-transparent">
                        {this.props.network && (
                          <div className="table-responsive">
                            <table className="table table-hover" id="basicTable">
                              <thead>
                                <tr>
                                  <th style={{ width: '30%' }}>Channel Name</th>
                                  <th style={{ width: '30%' }}>Orderer Org Name</th>
                                </tr>
                              </thead>
                              <tbody>
                                {this.state.channels
                                  .sort((a, b) => (a.name < b.name ? -1 : 1))
                                  .map(channel => {
                                    return (
                                      <tr key={channel.name}>
                                        <td className="v-align-middle " style={{ cursor: 'pointer' }}>
                                          {channel.name}
                                        </td>
                                        <td className="v-align-middle " style={{ cursor: 'pointer' }}>
                                          {channel.ordererOrgName}
                                        </td>
                                      </tr>
                                    );
                                  })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
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
    user: Meteor.user(),
    network: [
      ...PrivatehivePeers.find({ instanceId: props.match.params.id, active: true }).fetch(),
      ...PrivatehiveOrderers.find({ instanceId: props.match.params.id, active: true }).fetch(),
    ][0],
    subscriptions: [
      Meteor.subscribe(
        'privatehive.one',
        { instanceId: props.match.params.id },
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
})(withRouter(ManageChannels));
