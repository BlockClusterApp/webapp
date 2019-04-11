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

class InviteChannel extends Component {
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

  addOrgToChannel = () => {
    if (!this.email.value) {
      return this.setState({
        modalError: 'Email is required',
      });
    }
    this.setState({
      loading: true,
    });

    let ordererOrgName = '';

    this.state.channels.forEach(channel => {
      if (channel.name === this.channelName.value) {
        ordererOrgName = channel.ordererOrgName;
      }
    });

    Meteor.call(
      'inviteUserToChannel',
      {
        channelName: this.channelName.value,
        ordererId: ordererOrgName.toLowerCase(),
        networkId: this.props.network._id,
        email: this.email.value,
      },
      (err, res) => {
        this.setState({
          loading: false,
        });
        if (err) {
          return notifications.error(err.reason);
        }
        return notifications.success('Invite sent');
      }
    );
  };

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
    const channelOptions = this.state.channels.map((channel, index) => {
      return (
        <option key={channel.name} selected={index === 0}>
          {channel.name}
        </option>
      );
    });

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
                    Invite Organisation to Channel
                  </div>
                </div>
                <div className="card-block">
                  <div className="row">
                    <div className="col-xl-12">
                      <div className="card card-transparent m-b-0">
                        <div className="form-group">
                          <label>Channel</label>
                          <select className="form-control" ref={input => (this.channelName = input)} onChange={this.channelChangeListener}>
                            {channelOptions}
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="col-xl-12">
                      <div className="card card-transparent m-b-0">
                        <div className="form-group">
                          <label>User Email</label>
                          <input
                            type="email"
                            className="form-control"
                            required
                            ref={input => {
                              this.email = input;
                            }}
                            defaultValue={this.props.user.emails[0].address}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="col-sm-12">
                      <LaddaButton
                        loading={this.state.loading}
                        data-size={S}
                        data-style={SLIDE_UP}
                        data-spinner-size={30}
                        data-spinner-lines={12}
                        className="btn btn-success"
                        onClick={this.addOrgToChannel}
                      >
                        <i className="fa fa-plus-circle" aria-hidden="true" />
                        &nbsp;&nbsp;Invite User
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
})(withRouter(InviteChannel));
