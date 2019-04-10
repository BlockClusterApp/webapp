import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter } from 'react-router-dom';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';
import { PrivatehivePeers } from '../../../collections/privatehivePeers/privatehivePeers';
import notifications from '../../../modules/notifications';
import moment from 'moment';

import '../platformNotifications/PlatformNotifications.scss';

class Notifications extends Component {
  constructor() {
    super();
    this.state = {
      channels: [],
      chaincodes: [],
      notifications: [],
    };
  }

  refresher = () => {
    this.getChaincodes();
    this.getChannels();
    this.getNotifications();
  };

  componentWillUnmount() {
    this.props.subscriptions.forEach(s => {
      s.stop();
    });
    clearInterval(this.timer);
  }

  componentDidMount() {
    this.refresher();
    this.timer = setInterval(this.refresher, 10 * 1000);
  }

  getChaincodes() {
    const { network } = this.props;
    Meteor.call('fetchChaincodes', { networkId: this.props.match.params.id }, (err, res) => {
      if (err) {
        return notifications.error(err.reason);
      }
      this.setState({
        chaincodes: res.message,
      });
    });
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

  getNotifications() {
    Meteor.call(
      'listChaincodeNotifications',
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
          notifications: res,
        });
      }
    );
  }

  addNotification = () => {
    if (this.state.notification) {
      return this.updateNotification();
    }
    if (!this.channel.value || !this.chaincode.value || !this.eventName.value || !this.notificationURL.value) {
      $('#modalSlideLeft_payload').modal('hide');
      return notification.error('Channel, chaincode, event and url are required');
    }

    Meteor.call(
      'addChaincodeNotification',
      {
        networkId: this.props.match.params.id,
        notificationURL: this.notificationURL.value,
        chaincodeName: this.chaincode.value,
        channelName: this.channel.value,
        chaincodeEventName: this.eventName.value,
        startBlock: this.startBlock.value,
      },
      (err, res) => {
        $('#modalSlideLeft_payload').modal('hide');
        if (err) {
          return notifications.error(err.reason);
        }

        this.refresher();
        return notifications.success('Notification added');
      }
    );
  };

  updateNotification = () => {
    if (!this.channel.value || !this.chaincode.value || !this.eventName.value || !this.notificationURL.value) {
      $('#modalSlideLeft_payload').modal('hide');
      return notification.error('Channel, chaincode, event and url are required');
    }

    Meteor.call(
      'updateChaincodeNotification',
      {
        networkId: this.props.match.params.id,
        notificationURL: this.notificationURL.value,
        chaincodeName: this.chaincode.value,
        channelName: this.channel.value,
        chaincodeEventName: this.eventName.value,
      },
      (err, res) => {
        $('#modalSlideLeft_payload').modal('hide');
        if (err) {
          return notifications.error(err.reason);
        }

        this.refresher();
        return notifications.success('Notification updated');
      }
    );
  };

  removeNotification = ({ channelName, chaincodeName, eventName }) => {
    this.setState({
      [`loading_${chaincodeName}_${eventName}`]: true,
    });
    Meteor.call(
      'removeChaincodeNotification',
      {
        networkId: this.props.match.params.id,
        chaincodeName,
        channelName,
        chaincodeEventName: eventName,
      },
      (err, res) => {
        this.setState({
          [`loading_${chaincodeName}_${eventName}`]: false,
        });
        if (err) {
          return notifications.error(err.reason);
        }
        this.refresher();
        return notifications.success('Notification removed');
      }
    );
  };

  render() {
    const channelOptions = this.state.channels.map((channel, index) => {
      return (
        <option key={channel.name} selected={this.state.notification ? this.state.notification.channelName === channel.name : index === 0}>
          {channel.name}
        </option>
      );
    });

    const chaincodeOptions = this.state.chaincodes.map((chaincode, index) => {
      return (
        <option key={chaincode.name} value={chaincode.name} selected={this.state.notification ? this.state.notification.chaincodeName === chaincode.name : index === 0}>
          {chaincode.name} - {chaincode.version}
        </option>
      );
    });

    return (
      <div className="nodeEvents content">
        <div className="modal fade slide-right" id="modalSlideLeft_payload" tabIndex="-1" role="dialog" aria-hidden="true">
          <div className="modal-dialog modal-md">
            <div className="modal-content-wrapper">
              <div className="modal-content">
                <button type="button" className="close" data-dismiss="modal" aria-hidden="true">
                  <i className="pg-close fs-14" />
                </button>
                <div className="container-xs-height full-height">
                  <div className="row-xs-height">
                    <div className="modal-body col-xs-height col-middle ">
                      <h6 className="text-primary ">{this.state.action || 'Add'} Notification</h6>

                      <div className="row clearfix">
                        <div className="col-md-12">
                          <div className="form-group form-group-default ">
                            <label>Select Channel</label>
                            <select className="form-control" ref={input => (this.channel = input)} disabled={!!this.state.notification}>
                              {channelOptions}
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="row clearfix">
                        <div className="col-md-12">
                          <div className="form-group form-group-default ">
                            <label>Select Chaincode</label>
                            <select
                              className="form-control"
                              ref={input => (this.chaincode = input)}
                              selected={this.state.notification && this.state.notification.chaincodeName}
                              disabled={!!this.state.notification}
                            >
                              {chaincodeOptions}
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="row clearfix">
                        <div className="col-md-12">
                          <div className="form-group form-group-default input-group">
                            <div className="form-input-group">
                              <label>Chaincode Event Name</label>
                              <input type="text" className="form-control" name="eventName" ref={input => (this.eventName = input)} disabled={!!this.state.notification} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {!this.state.notification && (
                        <div className="row clearfix">
                          <div className="col-md-12">
                            <div className="form-group form-group-default input-group">
                              <div className="form-input-group">
                                <label>Start Block</label>
                                <input type="number" className="form-control" name="startBlock" ref={input => (this.startBlock = input)} defaultValue="0" />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="row clearfix">
                        <div className="col-md-12">
                          <div className="form-group form-group-default input-group">
                            <div className="form-input-group">
                              <label>Notification URL</label>
                              <input type="text" className="form-control" name="notificationURL" ref={input => (this.notificationURL = input)} />
                            </div>
                          </div>
                        </div>
                      </div>

                      <LaddaButton
                        loading={this.state.loading}
                        data-size={S}
                        data-style={SLIDE_UP}
                        data-spinner-size={30}
                        data-spinner-lines={12}
                        className="btn btn-success m-t-10"
                        onClick={() => {
                          this.addNotification();
                        }}
                      >
                        <i className="fa fa-upload" aria-hidden="true" />
                        &nbsp;&nbsp;{this.state.notification ? 'Update' : 'Add'}
                      </LaddaButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="m-t-20 container-fluid container-fixed-lg bg-white">
          <div className="row dashboard">
            <div className="col-lg-12">
              <div className="card card-transparent">
                <div className="card-header ">
                  <div className="card-title">Notifications</div>
                </div>
                <div className="card-block">
                  <div className="card card-transparent col-md-3">
                    <LaddaButton
                      loading={this.state.loading}
                      data-size={S}
                      data-style={SLIDE_UP}
                      data-spinner-size={30}
                      data-spinner-lines={12}
                      className="btn btn-success m-t-10"
                      onClick={() => {
                        this.eventName.value = '';
                        this.notificationURL.value = '';
                        this.setState(
                          {
                            notification: undefined,
                          },
                          () => {
                            $('#modalSlideLeft_payload').modal('show');
                          }
                        );
                      }}
                    >
                      <i className="fa fa-upload" aria-hidden="true" />
                      &nbsp;&nbsp;Add Notification
                    </LaddaButton>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row dashboard">
            <div className="col-lg-12">
              <div className="card card-transparent">
                <div className="card-header ">
                  <div className="card-title text-primary fs-14">All Notifications</div>
                </div>
                <div className="card-block">
                  <div className="card card-transparent">
                    <div className="auto-overflow widget-11-2-table" style={{ maxHeight: '400px' }}>
                      <table className="table table-condensed table-hover">
                        <thead>
                          <tr>
                            <th style={{ width: '5%' }}>ID</th>
                            <th style={{ width: '15%' }}>Channel</th>
                            <th style={{ width: '20%' }}>Chaincode</th>
                            <th style={{ width: '15%' }}>Event</th>
                            <th style={{ width: '20%' }}>Notification</th>
                            <th style={{ width: '25%' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {this.state.notifications.map((notification, index) => {
                            return (
                              <tr key={index + 1}>
                                <td className="font-montserrat b-r b-dashed b-grey">{index + 1}</td>
                                <td className="font-montserrat b-r b-dashed b-grey">{notification.channelName}</td>
                                <td className="font-montserrat b-r b-dashed b-grey">{notification.chaincodeName}</td>
                                <td className="b-r b-dashed b-grey">{notification.chaincodeEventName}</td>
                                <td title={notification.notificationURL}>{notification.notificationURL}</td>
                                <td>
                                  <LaddaButton
                                    loading={this.state[`loading_${notification.chaincodeName}_${notification.chaincodeEventName}_update`]}
                                    disabled={this.state[`loading_${notification.chaincodeName}_${notification.chaincodeEventName}_update`]}
                                    data-size={S}
                                    data-style={SLIDE_UP}
                                    data-spinner-size={30}
                                    data-spinner-lines={12}
                                    onClick={this.onSubmit}
                                    className="btn btn-info"
                                    onClick={() => {
                                      this.eventName.value = notification.chaincodeEventName;
                                      this.notificationURL.value = notification.notificationURL;
                                      this.setState(
                                        {
                                          notification,
                                        },
                                        () => {
                                          $('#modalSlideLeft_payload').modal('show');
                                        }
                                      );
                                    }}
                                  >
                                    <i className="fa fa-save" aria-hidden="true" />
                                    &nbsp;&nbsp;Update
                                  </LaddaButton>
                                  &nbsp;&nbsp;
                                  <LaddaButton
                                    loading={this.state[`loading_${notification.chaincodeName}_${notification.chaincodeEventName}`]}
                                    disabled={this.state[`loading_${notification.chaincodeName}_${notification.chaincodeEventName}`]}
                                    data-size={S}
                                    data-style={SLIDE_UP}
                                    data-spinner-size={30}
                                    data-spinner-lines={12}
                                    onClick={this.onSubmit}
                                    className="btn btn-danger"
                                    onClick={() => {
                                      this.removeNotification({
                                        channelName: notification.channelName,
                                        chaincodeName: notification.chaincodeName,
                                        eventName: notification.chaincodeEventName,
                                      });
                                    }}
                                  >
                                    <i className="fa fa-trash" aria-hidden="true" />
                                    &nbsp;&nbsp;Remove
                                  </LaddaButton>
                                </td>
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
      </div>
    );
  }
}

export default withTracker(props => {
  return {
    user: Meteor.user(),
    network: PrivatehivePeers.findOne({ instanceId: props.match.params.id, active: true }),
    subscriptions: [
      Meteor.subscribe(
        'privatehive.one',
        { instanceId: props.match.params.id },
        {
          onReady: function() {
            if (PrivatehivePeers.find({ instanceId: props.match.params.id, active: true }).fetch().length !== 1) {
              props.history.push('/app/privatehive/list');
            }
          },
        }
      ),
    ],
  };
})(withRouter(Notifications));
