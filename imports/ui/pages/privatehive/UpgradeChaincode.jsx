import React, { Component } from 'react';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';
import { withTracker } from 'meteor/react-meteor-data';
import notifications from '../../../modules/notifications';
import { withRouter, Link } from 'react-router-dom';
import { PrivatehivePeers } from '../../../collections/privatehivePeers/privatehivePeers';

import 'react-fine-uploader/gallery/gallery.css';

class UpgradeChaincode extends Component {
  constructor() {
    super();

    this.state = {
      channels: [],
      chaincodes: [],
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

  upgradeChaincode = e => {
    e.preventDefault();
    if (!this.chaincodeFile.files[0]) {
      return this.setState({
        error: 'Chaincode file is required',
      });
    }

    this.setState({
      error: '',
      loading: true,
    });

    let args = [];

    if (this.chaincodeArgs.value) {
      args = this.chaincodeArgs.value;
    }

    try {
      args = JSON.parse(args);
      args = JSON.stringify(args);
    } catch (e) {
      this.setState({
        loading: false,
      });
      return notifications.error('Arguments is invalid');
    }

    let collectionsConfig = this.collectionsConfig.value || '';

    if (collectionsConfig) {
      try {
        collectionsConfig = JSON.parse(collectionsConfig);
      } catch (e) {
        this.setState({
          loading: false,
        });
        return notifications.error('Collections config is invalid');
      }
    }

    const reader = new FileReader();
    reader.onload = fileLoadEvent => {
      Meteor.call(
        'upgradeChaincode',
        {
          file: this.chaincodeFile.files[0],
          content: reader.result,
          name: this.chaincodeName.value,
          args: this.chaincodeArgs.value,
          fcn: this.chaincodeFcn.value,
          networkId: this.props.match.params.id,
          version: this.chaincodeVersion.value,
          channel: this.invoke_channel.value,
          endorsmentPolicy: this.endorsmentPolicy.value,
          collectionsConfig: this.collectionsConfig.value,
          // ccPath: this.chaincodePath.value,
        },
        (err, res) => {
          this.setState({
            loading: false,
          });
          if (err) {
            return notifications.error(err.reason);
          } else {
            return notifications.success('Chaincode Upgraded');
          }
        }
      );
    };

    reader.readAsBinaryString(this.chaincodeFile.files[0]);
  };

  render() {
    const channelOptions = this.state.channels.map((channel, index) => {
      return <option key={channel.name}>{channel.name}</option>;
    });

    const chaincodeOptions = this.state.chaincodes.map((chaincode, index) => {
      return (
        <option key={chaincode.name} value={chaincode.name}>
          {chaincode.name}
        </option>
      );
    });

    let defaultEP = `
    {
      "identities": [
        { "role": { "name": "member", "mspId": "${this.props.network ? this.props.network.orgName : ''}" }}
      ],
      "policy": {
        "1-of":[{ "signed-by": 0 }]
      }
    }
    `;

    return (
      <div className="assetsStats content">
        <div className="container-fluid container-fixed-lg m-t-20 p-l-25 p-r-25 p-t-25 p-b-25 sm-padding-10 bg-white">
          <div className="row">
            <div className="col-lg-12 m-b-10">
              <Link to={`/app/privatehive/${this.props.match.params.id}/details`}>
                {' '}
                Control Panel <i className="fa fa-angle-right" />
              </Link>{' '}
              Upgrade Chaincode
            </div>
          </div>
          <div className="row">
            <div className="col-md-6">
              <div className="card card-transparent">
                <div className="card-block" style={{ padding: '0px' }}>
                  <h3>Upgrade Your Chaincode on peer</h3>
                  <p>Upgrade an existing chaincode on the peer. We support both Golang and Node.js chaincodes</p>
                  <ul>
                    <li>
                      <i>Version</i>: New version of chaincode
                    </li>
                    <li>
                      <i>ZIP File</i>: The .zip file should contain a directory with same name as the chaincode name. Inside the directory place the code files. For example: in
                      case of golang, the directory should contain &#123;chaincodeName&#125;.go file.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <form
              className="col-md-6"
              onSubmit={e => {
                this.upgradeChaincode(e);
              }}
            >
              <div className="row clearfix">
                <div className="col-md-6">
                  <div className="form-group form-group-default required">
                    <label>Select Channel</label>
                    <select required className="form-control" ref={input => (this.invoke_channel = input)}>
                      {channelOptions}
                    </select>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group form-group-default required">
                    <label>Select Chaincode</label>
                    <select required className="form-control" ref={input => (this.chaincodeName = input)}>
                      {chaincodeOptions}
                    </select>
                  </div>
                </div>
              </div>
              <div className="row clearfix">
                <div className="col-md-6">
                  <div className="form-group form-group-default required">
                    <label>Chaincode Source ZIP file</label>
                    <input
                      type="file"
                      className="form-control file-button"
                      name="firstName"
                      required
                      style={{
                        marginTop: '5px',
                      }}
                      ref={input => {
                        this.chaincodeFile = input;
                      }}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group form-group-default input-group required">
                    <div className="form-input-group">
                      <label>Chaincode Version</label>
                      <input required type="text" className="form-control" name="eventName" ref={input => (this.chaincodeVersion = input)} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group form-group-default">
                    <label>Arguments</label>
                    <input type="text" defaultValue="[]" className="form-control" name="eventName" ref={input => (this.chaincodeArgs = input)} />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group form-group-default">
                    <label>Function Name</label>
                    <input type="text" placeholder="" className="form-control" name="eventName" ref={input => (this.chaincodeFcn = input)} />
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-md-12">
                  <div className="form-group form-group-default">
                    <label>Endorsment Policy</label>
                    <textarea
                      placeholder="Default is only your organisation has to sign"
                      className="form-control"
                      name="eventName"
                      style={{
                        height: '170px',
                      }}
                      ref={input => (this.endorsmentPolicy = input)}
                    />
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-md-12">
                  <div className="form-group form-group-default">
                    <label>Collections Config</label>
                    <textarea
                      className="form-control"
                      name="eventName"
                      style={{
                        height: '170px',
                      }}
                      ref={input => (this.collectionsConfig = input)}
                    />
                  </div>
                </div>
              </div>

              {this.state.error && (
                <div className="row">
                  <div className="col-md-12">
                    <div className="alert alert-danger">{this.state.error}</div>
                  </div>
                </div>
              )}

              <div className="row">
                <div className="col-md-12">
                  <div className="form-group">
                    <LaddaButton
                      loading={this.state.loading}
                      disabled={this.state.loading}
                      data-size={S}
                      data-style={SLIDE_UP}
                      data-spinner-size={30}
                      data-spinner-lines={12}
                      className="btn btn-success"
                      type="submit"
                    >
                      <i className="fa fa-upload" aria-hidden="true" />
                      &nbsp;&nbsp;Upgrade Chaincode
                    </LaddaButton>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }
}

export default withTracker(props => {
  return {
    network: PrivatehivePeers.findOne({ instanceId: props.match.params.id, active: true }),
    subscriptions: [
      Meteor.subscribe(
        'privatehive',
        {},
        {
          onReady: function() {
            if ([...PrivatehivePeers.find({ instanceId: props.match.params.id, active: true }).fetch()].length !== 1) {
              props.history.push('/app/privatehive/list');
            }
          },
        }
      ),
    ],
  };
})(withRouter(UpgradeChaincode));
