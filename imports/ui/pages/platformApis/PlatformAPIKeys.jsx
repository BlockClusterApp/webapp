import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter } from 'react-router-dom';
import ApiKeys from '../../../collections/api-keys/index.js';
import notifications from '../../../modules/notifications';
import ConfirmationButton from '../../components/Buttons/ConfirmationButton';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';

import moment from 'moment';

import './PlatformApiKeys.scss';

class PlatformApis extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentWillUnmount() {
    this.props.subscriptions.forEach(s => {
      s.stop();
    });
  }

  createApiKey = () => {
    this.setState({
      loading: true,
    });
    Meteor.call('generateApiKey', (err, res) => {
      this.setState({
        loading: false,
      });
      if (err) {
        return notifications.error(err.reason);
      }
      notifications.success('API Key created');
    });
  };

  deleteApiKey = id => {
    this.setState({
      [`deleting_${id}`]: true
    });
    Meteor.call('deleteApiKey', id, (err, res) => {
      this.setState({
        [`deleting_${id}`]: false,
      });
      if (err) {
        return notifications.error(err.reason);
      }
      return notifications.success('API Key Deleted');
    });
  };

  render() {
    return (
      <div className="platform-api-keys content">
        <div className="m-t-20 container-fluid container-fixed-lg bg-white">
          <div className="row">
            <div className="col-md-12 m-t-20 m-l-10">
              <h3>Manage your platform API keys</h3>
            </div>
          </div>
          <div className="row">
            <div className="col-lg-4">
              <div className="card card-transparent">
                <div className="card-block">
                  <p>These API Keys give you complete access to the blockcluster platform through which you can:</p>
                  <ul>
                    <li>Create or Delete Networks</li>
                    <li>Manage Invitations</li>
                  </ul>
                  <p>P.S. You cannot control the functionality of your blockchain nodes via these API keys.</p>
                  <p>
                    You can find the documentation&nbsp;
                    <a href="https://platform.api.blockcluster.io/" target="_blank">
                      here
                    </a>
                    .
                  </p>
                </div>
              </div>
            </div>
            <div className="col-lg-8">
              <div className="card card-transparent">
                <div className="card-block">
                  <div className="table-responsive">
                    <table className="table table-hover" id="basicTable">
                      <thead>
                        <tr>
                          <th style={{ width: '5%' }}>S.No</th>
                          {/* <th style={{width: "15%"}}>Id</th> */}
                          <th style={{ width: '55%' }}>Key</th>
                          <th style={{ width: '25%' }}>Created At</th>
                          <th style={{ width: '15%' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {this.props.apiKeys.map((apiKey, index) => {
                          return (
                            <tr key={index + 1}>
                              <td>
                                <center>{index + 1}</center>
                              </td>
                              <td style={{ fontFamily: 'monospace' }}>{apiKey.key}</td>
                              <td>{moment(apiKey.createdAt).format('DD-MMM-YY HH:mm')}</td>
                              <td>
                                <ConfirmationButton
                                  loadingText="Deleting"
                                  completedText="Already deleted"
                                  confirmationText="Are you sure?"
                                  actionText="Delete"
                                  cooldown={1500}
                                  loading={this.state[`deleting_${apiKey._id}`]}
                                  onConfirm={this.deleteApiKey.bind(this, apiKey._id)}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {this.props.apiKeys.length < 3 && (
                    <div className="row">
                      <LaddaButton
                        loading={this.state.loading}
                        data-size={S}
                        data-style={SLIDE_UP}
                        data-spinner-size={30}
                        data-spinner-lines={12}
                        className="btn btn-success m-t-10"
                        onClick={this.createApiKey}
                      >
                        <i className="fa fa-plus-circle" aria-hidden="true" />
                        &nbsp;&nbsp;Create API Key
                      </LaddaButton>
                    </div>
                  )}
                  {this.props.apiKeys.length >= 3 && <p>Maximum of only 3 API keys are allowed</p>}
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
    apiKeys: ApiKeys.find({ active: true }).fetch(),
    user: Meteor.user(),
    subscriptions: [Meteor.subscribe('apiKeys.all')],
  };
})(withRouter(PlatformApis));
