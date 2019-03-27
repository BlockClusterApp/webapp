import React, { Component } from 'react';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter } from 'react-router-dom';

import { PrivatehiveOrderers } from '../../../collections/privatehiveOrderers/privatehiveOrderers';
import { PrivatehivePeers } from '../../../collections/privatehivePeers/privatehivePeers';
import notifications from '../../../modules/notifications';
import { Link } from 'react-router-dom';
import ConfirmationButton from '../../components/Buttons/ConfirmationButton';

class Security extends Component {
  constructor() {
    super();

    this.state = {
      tokens: [],
    };
  }

  componentWillUnmount() {
    this.props.subscriptions.forEach(s => {
      s.stop();
    });
  }

  createToken = e => {
    e.preventDefault();

    this.setState({
      loading: true,
    });

    Meteor.call('generatePrivateHiveToken', { instanceId: this.props.match.params.id }, (error, res) => {
      this.setState({
        loading: false,
      });
      if (error) {
        return notifications.error(error.reason);
      } else {
        return notifications.success('Token Generated');
      }
    });
  };

  revokeToken = token => {
    this.setState({
      loading: true,
    });
    Meteor.call('revokePrivateHiveToken', { instanceId: this.props.match.params.id, token }, (error, res) => {
      this.setState({
        loading: false,
      });
      if (error) {
        return notifications.error(error.reason);
      } else {
        return notifications.success('Token revoked');
      }
    });
  };

  render() {
    if (!this.props.network) {
      return null;
    }
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
                    API Authentication
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
                            <h5>Secure your network</h5>
                          </div>
                        </div>
                        <div className="card-block">
                          <p>The node's HTTP APIs are protected using Bearer token.</p>
                          <p>By default the auth is not enabled. Generate an API Key to enable basic auth.</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-7">
                      <div className="card card-transparent">
                        <div className="card-block">
                          <div className="table-responsive">
                            <table className="table table-hover" id="basicTable">
                              <thead>
                                <tr>
                                  <th style={{ width: '5%' }}>S.No</th>
                                  {/* <th style={{width: "15%"}}>Id</th> */}
                                  <th style={{ width: '60%' }}>Key</th>
                                  <th style={{ width: '35%' }}>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {this.props.network &&
                                  this.props.network.properties &&
                                  this.props.network.properties.tokens &&
                                  this.props.network.properties.tokens.map((apiKey, index) => {
                                    return (
                                      <tr key={index + 1}>
                                        <td>
                                          <center>{index + 1}</center>
                                        </td>
                                        <td style={{ fontFamily: 'monospace' }}>{apiKey}</td>
                                        <td>
                                          <ConfirmationButton
                                            loadingText="Deleting"
                                            completedText="Already deleted"
                                            confirmationText="Are you sure?"
                                            actionText="Delete"
                                            cooldown={1500}
                                            loading={this.state[`deleting_${apiKey}`]}
                                            onConfirm={this.revokeToken.bind(this, apiKey)}
                                          />
                                        </td>
                                      </tr>
                                    );
                                  })}
                              </tbody>
                            </table>
                          </div>
                          {this.props.network &&
                            this.props.network.properties &&
                            (!this.props.network.properties.tokens || (this.props.network.properties.tokens && this.props.network.properties.tokens.length < 3)) && (
                              <div className="row">
                                <LaddaButton
                                  loading={this.state.loading}
                                  data-size={S}
                                  data-style={SLIDE_UP}
                                  data-spinner-size={30}
                                  data-spinner-lines={12}
                                  className="btn btn-success m-t-10"
                                  onClick={this.createToken}
                                >
                                  <i className="fa fa-plus-circle" aria-hidden="true" />
                                  &nbsp;&nbsp;Create Token
                                </LaddaButton>
                              </div>
                            )}
                          {this.props.network && this.props.network.properties && this.props.network.properties.tokens && this.props.network.properties.tokens.length > 3 && (
                            <p>Maximum of only 3 API keys are allowed</p>
                          )}
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
              props.history.push('/app/privatehive');
            }
          },
        }
      ),
    ],
  };
})(withRouter(Security));
