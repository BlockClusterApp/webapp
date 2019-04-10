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

  showAddOrgModal = (channelName, ordererOrgName) => {
    return this.setState(
      {
        showAddOrgModal: true,
        modalChannel: {
          name: channelName,
          ordererOrgName,
        },
      },
      () => {
        $('#channel_add_org_details').modal('show');
      }
    );
  };

  addOrgToChannel = () => {
    if (!this.email.value) {
      return this.setState({
        modalError: 'Email is required',
      });
    }
    this.setState({
      loading: true,
    });
    Meteor.call(
      'inviteUserToChannel',
      {
        channelName: this.state.modalChannel.name,
        ordererId: this.state.modalChannel.ordererOrgName.toLowerCase(),
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
        $('#channel_add_org_details').modal('hide');
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
    let Modal = this.state.showAddOrgModal && (
      <div className="modal fade slide-right" id="channel_add_org_details" tabIndex="-1" role="dialog" aria-hidden="true">
        <div className="modal-dialog modal-md">
          <div className="modal-content-wrapper">
            <div className="modal-content">
              <button type="button" className="close" data-dismiss="modal" aria-hidden="true">
                <i className="pg-close fs-14" />
              </button>
              <div className="container-md-height full-height">
                <div className="row-md-height">
                  <div className="modal-body col-md-height col-middle">
                    <h3>
                      Invite user to channel <b>{this.state.modalChannel.name}</b>
                    </h3>
                    <br />
                    <br />
                    <div className="row clearfix">
                      <div className="col-md-12">
                        <div className="form-group form-group-default input-group">
                          <div className="form-input-group">
                            <label>User email</label>
                            <input type="email" className="form-control" name="projectName" ref={input => (this.email = input)} defaultValue={this.props.user.emails[0].address} />
                          </div>
                        </div>
                      </div>
                    </div>
                    <br />
                    <LaddaButton
                      loading={this.state.loading}
                      data-size={S}
                      data-style={SLIDE_UP}
                      data-spinner-size={30}
                      data-spinner-lines={12}
                      className="btn btn-success"
                      onClick={this.addOrgToChannel}
                    >
                      <i className="fa fa-circle-plus" aria-hidden="true" />
                      &nbsp;&nbsp;Invite User
                    </LaddaButton>
                    &nbsp;
                    <button
                      type="button"
                      className="btn btn-default"
                      data-dismiss="modal"
                      onClick={() => {
                        $('#channel_add_org_details').modal('hide');
                        setTimeout(this.setState({ showAddOrgModal: false }), 1000);
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

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
                                  <th style={{ width: '50%' }}>Channel Name</th>
                                  <th style={{ width: '50%' }}>Action</th>
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
                                        <td>
                                          <LaddaButton
                                            data-size={S}
                                            data-style={SLIDE_UP}
                                            data-spinner-size={30}
                                            data-spinner-lines={12}
                                            className="btn btn-primary"
                                            onClick={() => {
                                              this.props.history.push(`/app/privatehive/${this.props.match.params.id}/channels/explorer?channel=${channel.channel_id}`);
                                            }}
                                          >
                                            <i className="fa fa-eye" aria-hidden="true" />
                                            &nbsp;&nbsp;Audit
                                          </LaddaButton>
                                          &nbsp;&nbsp;
                                          <LaddaButton
                                            data-size={S}
                                            data-style={SLIDE_UP}
                                            data-spinner-size={30}
                                            data-spinner-lines={12}
                                            className="btn btn-success"
                                            onClick={this.showAddOrgModal.bind(this, channel.name, channel.ordererOrgName)}
                                          >
                                            <i className="fa fa-circle-plus" aria-hidden="true" />
                                            &nbsp;&nbsp;Invite Org
                                          </LaddaButton>
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
        {Modal}
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
