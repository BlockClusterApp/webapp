import React, { Component } from 'react';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';
import { withTracker } from 'meteor/react-meteor-data';
import notifications from '../../../modules/notifications';
import { withRouter, Link } from 'react-router-dom';
import PrivateHive from '../../../collections/privatehive';

import 'react-fine-uploader/gallery/gallery.css';

class CreateChannelCode extends Component {
  constructor() {
    super();

    this.state = {};
  }

  componentDidMount() {}

  componentWillUnmount() {
    this.props.subscriptions.forEach(s => {
      s.stop();
    });
  }

  installChaincode = () => {
    if (!this.chaincodeName.value) {
      return this.setState({
        error: 'Name is required',
      });
    }
    if (!this.chainCodeVersion.value) {
      return this.setState({
        error: 'Version is required',
      });
    }

    if (!this.chaincodePath.value) {
      return this.setState({
        error: 'Path is required',
      });
    }

    if (!this.chaincodeFile.files[0]) {
      return this.setState({
        error: 'Chaincode file is required',
      });
    }

    this.setState({
      error: '',
      loading: true,
    });

    const { network } = this.props;

    console.log('Chaincodes', this.chaincodeFile.files[0]);

    const form = new FormData();
    form.append('chaincode', this.chaincodeFile.files[0]);
    form.append('name', this.chaincodeName.value);
    form.append('type', this.chaincodeType.value);
    form.append('version', this.chainCodeVersion.value);
    form.append('ccPath', this.chaincodePath.value);

    fetch(`https://${network.properties.apiEndPoint}/chaincode/install`, {
      method: 'POST',
      headers: {
        'x-access-key': network.properties.token ? network.properties.tokens[0] : undefined,
      },
      body: form,
    })
      .then(res => res.json())
      .then(data => {
        console.log('Uploaded chaincode', data);
        if (data.success) {
          notifications.success('Installed chaincode');
        } else {
          notifications.error(data.error);
        }
        this.setState({
          loading: false,
        });
      })
      .catch(err => {
        notifications.error(err.toString());
        this.setState({
          loading: false,
        });
      });
    // HTTP.call(
    //   'POST',
    //   url,
    //   {
    //     headers: {
    //
    //     },
    //     data: {
    //       channelName: this.channelName.value,
    //       externalBroker: network.properties.externalKafkaBroker,
    //       ordererOrg: network.isJoin ? '' : network.instanceId.replace('ph-', ''),
    //     },
    //   },
    //   (err, res) => {
    //     if (err) {
    //       return notifications.error(err.reason);
    //     }
    //     return notifications.success('Proposal sent');
    //   }
    // );
  };

  render() {
    return (
      <div className="assetsStats content">
        <div className="container-fluid container-fixed-lg m-t-20 p-l-25 p-r-25 p-t-25 p-b-25 sm-padding-10 bg-white">
          <div className="row">
            <div className="col-lg-12 m-b-10">
              <Link to={`/app/privatehive/${this.props.match.params.id}/details`}>
                {' '}
                Control Panel <i className="fa fa-angle-right" />
              </Link>{' '}
              Install Chaincode
            </div>
          </div>
          <div className="row">
            <div className="col-md-6">
              <div className="card card-transparent">
                <div className="card-block" style={{ padding: '0px' }}>
                  <h3>Install Your Chaincode on peer</h3>
                  <p>Install a new chaincode on the fabric network. We support only golang based chaincodes for now</p>
                  <ul>
                    <li>
                      <i>Name</i>: A valid name for the chaincode.
                    </li>
                    <li>
                      <i>Version</i>: Any alphanumeric string to maintain revisions.
                    </li>
                    <li>
                      <i>ZIP File</i>: The path containing the chaincode in the zip file. It should be a valid golang package path Eg:{' '}
                      <i>github.com/BlockClusterApp/sample-chaincode/</i>
                    </li>
                    <li>
                      The zip file should contain{' '}
                      <b>
                        <i>src</i>
                      </b>
                      &nbsp; folder at root with all the dependencies inside. The file will be unziped at $GOPATH before compiling Eg: If your chaincode depends on two different
                      packages, the folder structure should be:
                      <br />
                      src/
                      <br />
                      &nbsp;&nbsp;|- github.com/ <br />
                      &nbsp;&nbsp;|&nbsp;&nbsp;|- BlockClusterApp/ <br />
                      &nbsp;&nbsp;|&nbsp;&nbsp;|&nbsp;&nbsp;| - sample-chaincode/
                      <br />
                      &nbsp;&nbsp;|&nbsp;&nbsp;|&nbsp;&nbsp;| - dependency-package/ <br />
                      &nbsp;&nbsp;|- gopkg.com/ <br />
                      &nbsp;&nbsp;|&nbsp;&nbsp;|- vendor/ <br />
                      &nbsp;&nbsp;|&nbsp;&nbsp;|&nbsp;&nbsp;| - another-dependency-package/
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="row clearfix">
                <div className="col-md-12">
                  <div className="form-group form-group-default required">
                    <label>Chaincode name</label>
                    <input
                      ref={input => {
                        this.chaincodeName = input;
                      }}
                      type="text"
                      className="form-control"
                      name="ccname"
                      required
                      placeholder="marbles"
                    />
                  </div>
                </div>
              </div>
              <div className="row clearfix">
                <div className="col-md-12">
                  <div className="form-group form-group-default required">
                    <label>Chaincode Version</label>
                    <input
                      ref={input => {
                        this.chainCodeVersion = input;
                      }}
                      type="text"
                      className="form-control"
                      name="ccname"
                      required
                      placeholder="v1"
                    />
                  </div>
                </div>
              </div>
              <div className="row clearfix">
                <div className="col-md-12">
                  <div className="form-group form-group-default required">
                    <label>Chaincode Path</label>
                    <input
                      ref={input => {
                        this.chaincodePath = input;
                      }}
                      type="text"
                      className="form-control"
                      name="ccpath"
                      required
                      placeholder="github.com/fabric-samples/marbles/"
                    />
                  </div>
                </div>
              </div>
              <div className="row clearfix">
                <div className="col-md-12">
                  <div className="form-group form-group-default ">
                    <label>Chaincode Source ZIP file</label>
                    <input
                      type="file"
                      className="form-control file-button"
                      name="firstName"
                      required
                      ref={input => {
                        this.chaincodeFile = input;
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-md-12">
                  <div className="form-group ">
                    <select
                      className="full-width select2-hidden-accessible"
                      data-init-plugin="select2"
                      tabIndex="-1"
                      aria-hidden="true"
                      ref={input => (this.chaincodeType = input)}
                    >
                      <option value="golang">Go Lang</option>
                    </select>
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
                  <div className="form-group p-l-15">
                    <LaddaButton
                      loading={this.state.loading}
                      disabled={this.state.loading}
                      data-size={S}
                      data-style={SLIDE_UP}
                      data-spinner-size={30}
                      data-spinner-lines={12}
                      onClick={this.onSubmit}
                      className="btn btn-success"
                      onClick={() => {
                        this.installChaincode();
                      }}
                    >
                      <i className="fa fa-save" aria-hidden="true" />
                      &nbsp;&nbsp;Install Chaincode
                    </LaddaButton>
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
    network: PrivateHive.find({ instanceId: props.match.params.id, active: true }).fetch()[0],
    subscriptions: [
      Meteor.subscribe(
        'privatehive.one',
        { instanceId: props.match.params.id, active: true },
        {
          onReady: function() {
            if (PrivateHive.find({ instanceId: props.match.params.id, active: true }).fetch().length !== 1) {
              props.history.push('/app/privatehive');
            }
          },
        }
      ),
    ],
  };
})(withRouter(CreateChannelCode));
