import React, { Component } from 'react';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter } from 'react-router-dom';
import { PrivatehiveOrderers } from '../../../collections/privatehiveOrderers/privatehiveOrderers';
import { PrivatehivePeers } from '../../../collections/privatehivePeers/privatehivePeers';
import { Link } from 'react-router-dom';
import Config from '../../../modules/config/client';

class APIsCreds extends Component {
  constructor() {
    super();

    this.state = {
      updateRPCFormSubmitError: '',
      updateRESTFormSubmitError: '',
      updateRPCFormSubmitSuccess: '',
      updateRESTFormSubmitSuccess: '',
      rpcLoading: false,
      restLoading: false,
    };
  }

  componentWillUnmount() {
    this.props.subscriptions.forEach(s => {
      s.stop();
    });
  }

  onRPCUpdateSubmit = e => {
    e.preventDefault();

    this.setState({
      updateRPCFormSubmitError: '',
      rpcLoading: true,
    });

    Meteor.call('privatehiveRpcPasswordUpdate', this.networkNameRPCUpdate.value, this.rpcPassword.value, this.props.network.locationCode, error => {
      if (!error) {
        this.setState({
          updateRPCFormSubmitError: '',
          updateRPCFormSubmitSuccess: 'Password updated successfully',
          rpcLoading: false,
        });
      } else {
        this.setState({
          updateRPCFormSubmitError: 'An error occured while updating password',
          updateRPCFormSubmitSuccess: '',
          rpcLoading: false,
        });
      }
    });
  };

  render() {
    return (
      <div className="content apis-creds">
        <div className="m-t-20 container-fluid container-fixed-lg">
          <div className="row">
            <div className="col-lg-12 m-b-10">
              <Link to={'/app/networks/' + this.props.match.params.id}>
                {' '}
                Control Panel <i className="fa fa-angle-right" />
              </Link>{' '}
              APIs
            </div>
            <div className="card card-borderless card-transparent">
              <ul className="nav nav-tabs nav-tabs-linetriangle" role="tablist" data-init-reponsive-tabs="dropdownfx">
                <li className="nav-item">
                  <a className="active" href="#" data-toggle="tab" role="tab" data-target="#jsonrpc">
                    Basic Authentication
                  </a>
                </li>
              </ul>
              <div className="tab-content">
                <div className="tab-pane active" id="jsonrpc">
                  <div className="row">
                    <div className="col-lg-5">
                      <div className="card card-transparent">
                        <div className="card-header ">
                          <div className="card-title">
                            <h5>Update Password of APIs</h5>
                          </div>
                        </div>
                        <div className="card-block">
                          <p>The node's HTTP APIs are protected using HTTP Basic Authentication.</p>
                          <pre>
                            https://{this.props.workerNodeDomainName(this.props.network ? this.props.network.locationCode : '')}/api/privatehive/
                            {this.props.network ? this.props.network.instanceId : ''}
                          </pre>
                          <p>By default basic auth is not enabled. Update password to enable basic auth.</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-7">
                      <div className="card card-transparent">
                        <div className="card-block">
                          <form id="form-project" role="form" onSubmit={this.onRPCUpdateSubmit} autoComplete="off">
                            <p>Set new password</p>
                            <div className="form-group-attached">
                              <div className="row clearfix">
                                <div className="col-md-12">
                                  <div className="form-group form-group-default required">
                                    <label>Username</label>
                                    {this.props.network && (
                                      <input
                                        type="text"
                                        className="form-control readOnly-Value"
                                        ref={input => {
                                          this.networkNameRPCUpdate = input;
                                        }}
                                        readOnly
                                        value={this.props.network.instanceId}
                                      />
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="row clearfix">
                                <div className="col-md-12">
                                  <div className="form-group form-group-default required">
                                    <label>Password</label>
                                    {this.props.network && (
                                      <input
                                        ref={input => {
                                          this.rpcPassword = input;
                                        }}
                                        type="password"
                                        className="form-control"
                                        name="password"
                                        placeholder={this.props.network.instanceId}
                                      />
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <br />
                            {this.state.updateRPCFormSubmitError != '' && (
                              <div className="row">
                                <div className="col-md-12">
                                  <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                    <button className="close" data-dismiss="alert" />
                                    {this.state.updateRPCFormSubmitError}
                                  </div>
                                </div>
                              </div>
                            )}

                            {this.state.updateRPCFormSubmitSuccess != '' && (
                              <div className="row">
                                <div className="col-md-12">
                                  <div className="m-b-20 alert alert-success m-b-0" role="alert">
                                    <button className="close" data-dismiss="alert" />
                                    {this.state.updateRPCFormSubmitSuccess}
                                  </div>
                                </div>
                              </div>
                            )}

                            <LaddaButton
                              loading={this.state.rpcLoading}
                              data-size={S}
                              data-style={SLIDE_UP}
                              data-spinner-size={30}
                              data-spinner-lines={12}
                              className="btn btn-success"
                              type="submit"
                            >
                              <i className="fa fa-wrench" aria-hidden="true" />
                              &nbsp;&nbsp;Update
                            </LaddaButton>
                          </form>
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
    network: PrivatehivePeers.findOne({ instanceId: props.match.params.id }) || PrivatehiveOrderers.findOne({ instanceId: props.match.params.id }),
    workerNodeIP: Config.workerNodeIP,
    workerNodeDomainName: Config.workerNodeDomainName,
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
              props.history.push('/app/privatehive');
            }
          },
        }
      ),
    ],
  };
})(withRouter(APIsCreds));
