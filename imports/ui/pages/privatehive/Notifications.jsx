import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter } from 'react-router-dom';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';
import { PrivatehivePeers } from '../../../collections/privatehivePeers/privatehivePeers';
import notifications from '../../../modules/notifications';
import moment from 'moment';
import { Link } from 'react-router-dom';

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
    Meteor.call('fetchChaincodes', { networkId: this.props.match.params.id }, (err, res) => {

      if(err){
        return
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
        if(err){
          return
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
        if(err){
          return
        }
        return this.setState({
          notifications: res,
        });
      }
    );
  }

  addNotification = () => {
    if (!this.add_channel.value || !this.add_chaincode.value || !this.add_eventName.value || !this.add_notificationURL.value) {
      return notifications.error('Channel, chaincode, event and url are required');
    }

    Meteor.call(
      'addChaincodeNotification',
      {
        networkId: this.props.match.params.id,
        notificationURL: this.add_notificationURL.value,
        chaincodeName: this.add_chaincode.value,
        channelName: this.add_channel.value,
        chaincodeEventName: this.add_eventName.value,
        startBlock: this.add_startBlock.value,
      },
      (err, res) => {
        if (err) {
          return notifications.error(err.reason);
        }

        this.refresher();
        return notifications.success('Notification added');
      }
    );
  };

  updateNotification = () => {
    if (!this.update_channel.value || !this.update_chaincode.value || !this.update_eventName.value || this.update_notificationURL.valye) {
      return notifications.error('Channel, chaincode, notify URL and event name are required');
    }

    Meteor.call(
      'updateChaincodeNotification',
      {
        networkId: this.props.match.params.id,
        notificationURL: this.update_notificationURL.value,
        chaincodeName: this.update_chaincode.value,
        channelName: this.update_channel.value,
        chaincodeEventName: this.update_eventName.value,
      },
      (err, res) => {
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
                    Notifications
                  </div>
                </div>
                <div className="card-block">
                  <div className="row">
                    <div className="col-xl-12">
                      <div className="card card-transparent">
                        <div>
                          <div>
                            <ul className="nav nav-tabs nav-tabs-fillup" data-init-reponsive-tabs="dropdownfx">
                              <li className="nav-item">
                                <a href="#" className="active" data-toggle="tab" data-target={'#' + this.props.match.params.id + '_slide1'}>
                                  <span>Add</span>
                                </a>
                              </li>
                              <li className="nav-item">
                                <a href="#" data-toggle="tab" data-target={'#' + this.props.match.params.id + '_slide2'}>
                                  <span>List</span>
                                </a>
                              </li>
                              <li className="nav-item">
                                <a href="#" data-toggle="tab" data-target={'#' + this.props.match.params.id + '_slide3'}>
                                  <span>Update</span>
                                </a>
                              </li>
                            </ul>
                            <div className="tab-content p-l-0 p-r-0">
                              <div className="tab-pane slide-left active" id={this.props.match.params.id + '_slide1'}>
                                <div className="row clearfix">
                                  <div className="col-md-12">
                                    <div className="form-group form-group-default ">
                                      <label>Select Channel</label>
                                      <select className="form-control" ref={input => (this.add_channel = input)}>
                                        {channelOptions}
                                      </select>
                                    </div>
                                  </div>
                                </div>

                                <div className="row clearfix">
                                  <div className="col-md-12">
                                    <div className="form-group form-group-default ">
                                      <label>Select Chaincode</label>
                                      <select className="form-control" ref={input => (this.add_chaincode = input)}>
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
                                        <input type="text" className="form-control" name="eventName" ref={input => (this.add_eventName = input)} />
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="row clearfix">
                                  <div className="col-md-12">
                                    <div className="form-group form-group-default input-group">
                                      <div className="form-input-group">
                                        <label>Start Block</label>
                                        <input type="number" className="form-control" name="startBlock" ref={input => (this.add_startBlock = input)} defaultValue="0" />
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="row clearfix">
                                  <div className="col-md-12">
                                    <div className="form-group form-group-default input-group">
                                      <div className="form-input-group">
                                        <label>Notification URL</label>
                                        <input type="text" className="form-control" name="notificationURL" ref={input => (this.add_notificationURL = input)} />
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
                                  &nbsp;&nbsp;Add
                                </LaddaButton>
                              </div>
                              <div className="tab-pane slide-left" id={this.props.match.params.id + '_slide2'}>
                                <div className="row">
                                  <div className="col-lg-12">
                                    <div className="card card-transparent">
                                      <div
                                        className="card-block"
                                        style={{
                                          padding: '0px',
                                        }}
                                      >
                                        <div className="card card-transparent">
                                          <div className="auto-overflow widget-11-2-table" style={{ maxHeight: '400px' }}>
                                            <table className="table table-condensed table-hover">
                                              <thead>
                                                <tr>
                                                  <th style={{ width: '5%' }}>ID</th>
                                                  <th style={{ width: '15%' }}>Channel</th>
                                                  <th style={{ width: '20%' }}>Chaincode</th>
                                                  <th style={{ width: '15%' }}>Event</th>
                                                  <th style={{ width: '25%' }}>Notification</th>
                                                  <th style={{ width: '20%' }}>Actions</th>
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
                              <div className="tab-pane slide-left" id={this.props.match.params.id + '_slide3'}>
                                <div className="row clearfix">
                                  <div className="col-md-12">
                                    <div className="form-group form-group-default ">
                                      <label>Select Channel</label>
                                      <select className="form-control" ref={input => (this.update_channel = input)}>
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
                                        ref={input => (this.update_chaincode = input)}
                                        selected={this.state.notification && this.state.notification.chaincodeName}
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
                                        <input type="text" className="form-control" name="eventName" ref={input => (this.update_eventName = input)} />
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="row clearfix">
                                  <div className="col-md-12">
                                    <div className="form-group form-group-default input-group">
                                      <div className="form-input-group">
                                        <label>Notification URL</label>
                                        <input type="text" className="form-control" name="notificationURL" ref={input => (this.update_notificationURL = input)} />
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
                                    this.updateNotification();
                                  }}
                                >
                                  <i className="fa fa-upload" aria-hidden="true" />
                                  &nbsp;&nbsp;Update
                                </LaddaButton>
                              </div>
                            </div>
                          </div>
                        </div>
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
