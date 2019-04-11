import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter } from 'react-router-dom';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';
import { Link } from 'react-router-dom';

import { PrivatehivePeers } from '../../../collections/privatehivePeers/privatehivePeers';
import notifications from '../../../modules/notifications';

import '../platformNotifications/PlatformNotifications.scss';
import '/node_modules/codemirror/lib/codemirror.css';
import '/node_modules/codemirror/theme/mdn-like.css';
import '/node_modules/codemirror/theme/ttcn.css';
import '/node_modules/codemirror/mode/javascript/javascript.js';

const CodeMirror = require('react-codemirror');

class InvokeChaincode extends Component {
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
      if (err) {
        return;
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
        if (err) {
          return;
        }
        return this.setState({
          channels: res.message,
        });
      }
    );
  }

  invokeOrQueryChaincode = (action, cb) => {
    Meteor.call(
      'invokeOrQueryChaincode',
      {
        channelName: this.invoke_channel.value,
        chaincodeName: this.invoke_chaincode.value,
        functionName: this.invoke_functionName.value,
        args: this.invoke_args.value,
        action,
        networkId: this.props.match.params.id,
      },
      (err, res) => {
        if (err) {
          cb(err, null);
          return notifications.error(err.reason);
        }
        cb(null, res);
      }
    );
  };

  invokeChaincode = () => {
    this.setState({
      invoking: true,
      queryRes: undefined,
    });
    this.invokeOrQueryChaincode('invoke', (err, res) => {
      this.setState({
        invoking: false,
      });
      if (res) {
        return notifications.success('Invoked');
      }
    });
  };

  queryChaincode = () => {
    this.setState({
      querying: true,
    });
    this.invokeOrQueryChaincode('query', (err, res) => {
      this.setState({
        querying: false,
      });
      if (res) {
        return this.setState({
          queryRes: res,
        });
      }
    });
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
                    Invoke Or Query Chaincode
                  </div>
                </div>
                <div className="card-block">
                  <div className="row">
                    <div className="col-xl-12">
                      <div className="card card-transparent">
                        <div>
                          <div>
                            <div className="tab-content p-l-0 p-r-0">
                              <div className="tab-pane slide-left active">
                                <div className="row clearfix">
                                  <div className="col-md-12">
                                    <div className="form-group form-group-default ">
                                      <label>Select Channel</label>
                                      <select className="form-control" ref={input => (this.invoke_channel = input)}>
                                        {channelOptions}
                                      </select>
                                    </div>
                                  </div>
                                </div>
                                <div className="row clearfix">
                                  <div className="col-md-12">
                                    <div className="form-group form-group-default ">
                                      <label>Select Chaincode</label>
                                      <select className="form-control" ref={input => (this.invoke_chaincode = input)}>
                                        {chaincodeOptions}
                                      </select>
                                    </div>
                                  </div>
                                </div>
                                <div className="row clearfix">
                                  <div className="col-md-12">
                                    <div className="form-group form-group-default input-group">
                                      <div className="form-input-group">
                                        <label>Function Name</label>
                                        <input type="text" className="form-control" name="eventName" ref={input => (this.invoke_functionName = input)} />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="row clearfix">
                                  <div className="col-md-12">
                                    <div className="form-group form-group-default input-group">
                                      <div className="form-input-group">
                                        <label>Args</label>
                                        <input type="text" className="form-control" name="startBlock" ref={input => (this.invoke_args = input)} defaultValue="[]" />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <LaddaButton
                                  loading={this.state.invoking}
                                  data-size={S}
                                  data-style={SLIDE_UP}
                                  data-spinner-size={30}
                                  data-spinner-lines={12}
                                  className="btn btn-success m-t-10"
                                  onClick={() => {
                                    this.invokeChaincode();
                                  }}
                                >
                                  <i className="fa fa-upload" aria-hidden="true" />
                                  &nbsp;&nbsp;Invoke
                                </LaddaButton>
                                &nbsp;
                                <LaddaButton
                                  loading={this.state.querying}
                                  data-size={S}
                                  data-style={SLIDE_UP}
                                  data-spinner-size={30}
                                  data-spinner-lines={12}
                                  className="btn btn-success m-t-10"
                                  onClick={() => {
                                    this.queryChaincode();
                                  }}
                                >
                                  <i className="fa fa-search" aria-hidden="true" />
                                  &nbsp;&nbsp;Query
                                </LaddaButton>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    {this.state.queryRes && (
                      <div className="col-md-12">
                        <CodeMirror
                          value={this.state.queryRes}
                          options={{ readOnly: true, autofocus: true, indentUnit: 2, theme: 'mdn-like', mode: { name: 'javascript', json: true } }}
                        />
                      </div>
                    )}
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
})(withRouter(InvokeChaincode));
