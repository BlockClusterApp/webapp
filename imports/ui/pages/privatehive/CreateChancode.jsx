import React, { Component } from 'react';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';
import { withTracker } from 'meteor/react-meteor-data';
import notifications from '../../../modules/notifications';
import FineUploaderTraditional from 'fine-uploader-wrappers';
import Gallery from 'react-fine-uploader';
import { withRouter, Link } from 'react-router-dom';

import 'react-fine-uploader/gallery/gallery.css';

import moment from 'moment';

const wrapperStyles = {
  width: '100%',
  maxWidth: 2500,
  marginTop: '20px',
};

class CreateChannelCode extends Component {
  constructor() {
    super();

    this.state = {};

    this.uploader = new FineUploaderTraditional({
      options: {
        chunking: {
          enabled: false,
        },
        request: {
          endpoint: ``,
          inputName: 'file',
        },
        deleteFile: {
          enabled: false,
        },
        retry: {
          enableAuto: false,
        },
        callbacks: {
          onSubmit: async (id, fileName) => {
            function setUploaderURL(userId, locationCode, uploader) {
              return new Promise((resolve, reject) => {
                Meteor.call('getHyperionToken', { userId: userId }, (err, token) => {
                  if (!err) {
                    uploader.methods._endpointStore.set(`${window.location.origin}/api/hyperion/upload?location=${locationCode}&token=${token}`, id);

                    resolve();
                  } else {
                    reject();
                  }
                });
              });
            }

            await setUploaderURL(Meteor.userId(), this.state.locationCode, this.uploader);
          },
          onError: (id, fileName, reason, d) => {
            notifications.error(reason);
          },
          onTotalProgress: (a, b) => {},
        },
      },
    });
  }

  componentDidMount() {}

  componentWillUnmount() {
    this.props.subscriptions.forEach(s => {
      s.stop();
    });
  }

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

                <div className="row">
                  <div className="col-md-12">
                    <div className="form-group p-l-15">
                      <LaddaButton
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
      </div>
    );
  }
}

export default withTracker(props => {
  return {
    subscriptions: [],
  };
})(withRouter(CreateChannelCode));
