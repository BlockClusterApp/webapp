import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { Networks } from '../../../collections/networks/networks.js';
import helpers from '../../../modules/helpers';
import { withRouter } from 'react-router-dom';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';
import notifications from '../../../modules/notifications';
import { Link } from 'react-router-dom';
import Config from '../../../modules/config/client';
import LoadingIcon from '../../components/LoadingIcon/LoadingIcon.jsx';

import './BCAccountsView.scss';

class BCAccountsView extends Component {
  constructor() {
    super();
    this.state = {
      defaultJSONQuery: JSON.stringify(JSON.parse('{"assetName":"license","uniqueIdentifier":"1234","company":"blockcluster"}'), undefined, 4),
      accounts: [],
    };

    this.getAccounts = this.getAccounts.bind(this);
  }

  componentDidMount() {
    this.setState({
      refreshAccountsTimer: setInterval(this.getAccounts, 500),
    });
  }

  componentWillUnmount() {
    this.props.subscriptions.forEach(s => {
      s.stop();
    });

    clearInterval(this.state.refreshAccountsTimer);
  }

  getAccounts() {
    if (this.props.network[0]) {
      let url = `https://${Config.workerNodeDomainName(this.props.network[0].locationCode)}/api/node/${this.props.network[0].instanceId}/utility/accounts`;
      HTTP.get(
        url,
        {
          headers: {
            Authorization: 'Basic ' + new Buffer(`${this.props.network[0].instanceId}:${this.props.network[0]['api-password']}`).toString('base64'),
          },
        },
        (err, res) => {
          if (!err) {
            this.setState({
              accounts: res.data,
            });
          }
        }
      );
    }
  }

  createAccount(e) {
    e.preventDefault();

    this.setState({
      ['_accounts_formSubmitError']: '',
      ['_accounts_formloading']: true,
      ['_accounts_formSubmitSuccess']: '',
    });

    e.preventDefault();
    Meteor.call('createAccount', this.name.value, this.accountPassword.value, this.props.network[0]._id, error => {
      if (error) {
        this.setState({
          ['_accounts_formSubmitError']: error.reason,
          ['_accounts_formSubmitSuccess']: '',
          ['_accounts_formloading']: false,
        });
      } else {
        this.setState({
          ['_accounts_formSubmitError']: '',
          ['_accounts_formSubmitSuccess']: 'Successfully created account',
          ['_accounts_formloading']: false,
        });
        this.accountPassword.value = '';
      }
    });
  }

  downloadAccount = (e, item) => {
    e.preventDefault();
    let address = item.address;

    this.setState({
      [address + '_downloading']: true,
    });

    Meteor.call('downloadAccount', this.props.network[0].instanceId, address, (error, result) => {
      if (!error) {
        helpers.downloadString(result, 'application/json', 'key.json');
      } else {
        notifications.error(err.reason || err.message || 'An error occured');
      }

      this.setState({
        [address + '_downloading']: false,
      });
    });
  };

  render() {
    return (
      <div className="accounts content">
        <div className="m-t-20 container-fluid container-fixed-lg bg-white">
          <div className="row dashboard">
            <div className="col-lg-12">
              <div className="card card-transparent">
                <div className="card-header ">
                  <div className="card-title">
                    <Link to={'/app/networks/' + this.props.match.params.id}>
                      {' '}
                      Control Panel <i className="fa fa-angle-right" />
                    </Link>{' '}
                    Accounts Management
                  </div>
                </div>
                <div className="card-block">
                  {this.props.network.length === 1 && (
                    <div>
                      <div className="row column-seperation">
                        <div className="col-lg-12">
                          <div className="card card-transparent">
                            <div className="row column-seperation">
                              <div className="col-lg-4">
                                <h4>Create New Account</h4>
                                <form
                                  role="form"
                                  onSubmit={e => {
                                    this.createAccount(e);
                                  }}
                                >
                                  <div className="form-group">
                                    <label>Name</label>
                                    <input
                                      type="text"
                                      className="form-control"
                                      ref={input => {
                                        this.name = input;
                                      }}
                                      required
                                    />
                                  </div>
                                  <div className="form-group">
                                    <label>Password</label>
                                    <input
                                      type="password"
                                      className="form-control"
                                      ref={input => {
                                        this.accountPassword = input;
                                      }}
                                      required
                                    />
                                  </div>
                                  {this.state['_accounts_formSubmitError'] && (
                                    <div className="row m-t-15">
                                      <div className="col-md-12">
                                        <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                          <button className="close" data-dismiss="alert" />
                                          {this.state['_accounts_formSubmitError']}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  {this.state['_accounts_formSubmitSuccess'] && (
                                    <div className="row m-t-15">
                                      <div className="col-md-12">
                                        <div className="m-b-20 alert alert-success m-b-0" role="alert">
                                          <button className="close" data-dismiss="alert" />
                                          {this.state['_accounts_formSubmitSuccess']}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  <p className="pull-right">
                                    <LaddaButton
                                      loading={this.state['_accounts_formloading']}
                                      data-size={S}
                                      data-style={SLIDE_UP}
                                      data-spinner-size={30}
                                      data-spinner-lines={12}
                                      className="btn btn-success"
                                      type="submit"
                                    >
                                      <i className="fa fa-plus" aria-hidden="true" />
                                      &nbsp;&nbsp;Create
                                    </LaddaButton>
                                  </p>
                                </form>
                              </div>
                              <div className="col-lg-8">
                                <h4>Accounts</h4>
                                <div className="table-responsive">
                                  <table className="table table-hover" id="basicTable">
                                    <thead>
                                      <tr>
                                        <th style={{ width: '25%' }}>Name</th>
                                        <th style={{ width: '25%' }}>Address</th>
                                        <th style={{ width: '25%' }}>Download</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {this.state.accounts.map(item => {
                                        return (
                                          <tr key={item.address}>
                                            <td className="v-align-middle">{item.name}</td>
                                            <td className="v-align-middle">{item.address}</td>
                                            <td className="v-align-middle">
                                              {this.state[item.address + '_downloading'] == true && <LoadingIcon />}
                                              {this.state[item.address + '_downloading'] != true && (
                                                <i
                                                  className="clickable fa fa-download"
                                                  onClick={e => {
                                                    this.downloadAccount(e, item);
                                                  }}
                                                />
                                              )}
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
                  )}
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
    network: Networks.find({
      instanceId: props.match.params.id,
      active: true,
    }).fetch(),
    workerNodeDomainName: Config.workerNodeDomainName,
    subscriptions: [
      Meteor.subscribe('networks', {
        onReady: function() {
          if (
            Networks.find({
              instanceId: props.match.params.id,
              active: true,
            }).fetch().length !== 1
          ) {
            props.history.push('/app/networks');
          }
        },
      }),
      Meteor.subscribe('bcAccounts', props.match.params.id),
    ],
  };
})(withRouter(BCAccountsView));
