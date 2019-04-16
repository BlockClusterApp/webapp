import React, { Component } from 'react';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';
import { withTracker } from 'meteor/react-meteor-data';
import notifications from '../../../modules/notifications';
import { withRouter, Link } from 'react-router-dom';
import { PrivatehivePeers } from '../../../collections/privatehivePeers/privatehivePeers';

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
    if (!this.chaincodeFile.files[0]) {
      return this.setState({
        error: 'Chaincode file is required',
      });
    }

    this.setState({
      error: '',
      loading: true,
    });

    const reader = new FileReader();
    reader.onload = fileLoadEvent => {
      Meteor.call(
        'addChaincode',
        {
          file: this.chaincodeFile.files[0],
          content: reader.result,
          name: this.chaincodeName.value,
          type: this.chaincodeType.value,
          networkId: this.props.match.params.id,
          // version: this.chainCodeVersion.value,
          // ccPath: this.chaincodePath.value,
        },
        (err, res) => {
          this.setState({
            loading: false,
          });
          if (err) {
            return notifications.error(err.reason);
          } else {
            return notifications.success('Chaincode added');
          }
        }
      );
    };

    reader.readAsBinaryString(this.chaincodeFile.files[0]);
  };

  render() {
    let directoryStructure = `
    marbles
    ├── META-INF
    │   └── statedb
    │       └── couchdb
    │           ├── indexOwner.json
    │           └── indexes
    │               └── indexOwner.json
    └── marbles_chaincode_private.go
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
              Upload Chaincode
            </div>
          </div>
          <div className="row">
            <div className="col-md-6">
              <div className="card card-transparent">
                <div className="card-block" style={{ padding: '0px' }}>
                  <h3>Upload Your Chaincode on Peer</h3>
                  <p>Upload a new chaincode on the peer. We support both Golang and Node.js chaincodes</p>
                  <ul>
                    <li>
                      <i>Name</i>: A valid name for the chaincode.
                    </li>
                    <li>
                      <i>Version</i>: When you upload a new chaincode we assign default version to be 1.0. While upgrading chaincode you can change the version.
                    </li>
                    <li>
                      <i>ZIP File</i>: The .zip file should contain a directory with same name as the chaincode name. Inside the directory place the code files.
                    </li>
                  </ul>
                  <p>
                    <b>CouchDB Indexes</b>: You can place .json files for indexes inside <i>&lt;chaincode-node&gt;/META-INF/statedb/couchdb/indexes</i> directory. Similarly,
                    indexes can also be applied to private data collections, by packaging indexes in a{' '}
                    <i>&lt;chaincode-node&gt;/META-INF/statedb/couchdb/collections/&lt;collection-name&gt;/indexes directory</i>
                  </p>
                  <p
                    style={{
                      whiteSpace: 'pre-line',
                    }}
                  >
                    <b>Example</b>: Here is the directory structure you need to follow to upload the marbles chaincode:
                    <p>
                      ├── META-INF
                      <br />
                      │&nbsp;&nbsp;&nbsp;&nbsp; └── statedb
                      <br />
                      │&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; └── couchdb
                      <br />
                      │&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ├── indexOwner.json
                      <br />
                      │&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; └── indexes
                      <br />
                      │&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                      └── indexOwner.json
                      <br />
                      └── marbles_chaincode_private.go
                    </p>
                  </p>
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
              {/* <div className="row clearfix">
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
              </div> */}
              {/* <div className="row clearfix">
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
              </div> */}
              <div className="row clearfix">
                <div className="col-md-12">
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
              </div>
              <div className="row">
                <div className="col-md-12">
                  <div className="form-group form-group-default required">
                    <label>Chaincode Language</label>
                    <select className="form-control" data-init-plugin="select2" tabIndex="-1" aria-hidden="true" ref={input => (this.chaincodeType = input)}>
                      <option value="golang">Go</option>
                      <option value="node">Node</option>
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
                  <div className="form-group">
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
                      <i className="fa fa-upload" aria-hidden="true" />
                      &nbsp;&nbsp;Upload Chaincode
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
    network: [
      ...PrivatehivePeers.find({ instanceId: props.match.params.id, active: true })
        .fetch()
        .map(p => ({ ...p, type: 'peer' })),
    ][0],
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
})(withRouter(CreateChannelCode));
