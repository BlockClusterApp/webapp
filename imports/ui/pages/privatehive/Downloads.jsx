import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter } from 'react-router-dom';
import { Link } from 'react-router-dom';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';
import notifications from '../../../modules/notifications';
import { PrivatehiveOrderers } from '../../../collections/privatehiveOrderers/privatehiveOrderers';
import { PrivatehivePeers } from '../../../collections/privatehivePeers/privatehivePeers';
import moment from 'moment';
import LoadingIcon from '../../components/LoadingIcon/LoadingIcon.jsx';

import './Privatehive.scss';

function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:application/zip;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

class Downloads extends Component {
  constructor() {
    super();

    this.state = {
      downloading_connection_profile: false,
      org_details: false,
      orderer_certs: false,
      crypto_certs: false,
    };

    this.downloadConnectionProfile = this.downloadConnectionProfile.bind(this);
    this.downloadOrdererCerts = this.downloadOrdererCerts.bind(this);
    this.downloadCryptoConfig = this.downloadCryptoConfig.bind(this);
  }

  componentWillUnmount() {
    this.props.subscriptions.forEach(s => {
      s.stop();
    });
  }

  downloadConnectionProfile() {
    this.setState({
      downloading_connection_profile: true,
    });

    Meteor.call(
      'fetchConnectionProfile',
      {
        networkId: this.props.match.params.id,
      },
      (err, res) => {
        this.setState({
          downloading_connection_profile: false,
        });

        if (err) {
          notifications.error('An error occured');
        } else {
          download('network.map.yaml', res);
          notifications.success('Download started');
        }
      }
    );
  }

  downloadOrgDetails() {
    this.setState({
      org_details: true,
    });

    Meteor.call(
      'fetchOrgDetails',
      {
        networkId: this.props.match.params.id,
      },
      (err, res) => {
        this.setState({
          org_details: false,
        });

        if (err) {
          notifications.error('An error occured');
        } else {
          download(`${this.props.network.orgName}.json`, res);
          notifications.success('Download started');
        }
      }
    );
  }

  downloadOrdererCerts() {
    this.setState({
      orderer_certs: true,
    });

    Meteor.call(
      'fetchChannelInviteCerts',
      {
        networkId: this.props.match.params.id,
      },
      (err, res) => {
        this.setState({
          orderer_certs: false,
        });

        if (err) {
          notifications.error('An error occured');
        } else {
          download(`invite-${this.props.network.orgName}.json`, JSON.stringify(res, null, 4));
          notifications.success('Download started');
        }
      }
    );
  }

  downloadCryptoConfig() {
    this.setState({
      crypto_certs: true,
    });

    Meteor.call(
      'fetchCryptoConfig',
      {
        networkId: this.props.match.params.id,
      },
      (err, res) => {
        this.setState({
          crypto_certs: false,
        });

        if (err) {
          notifications.error('An error occured');
        } else {
          var url = 'data:application/zip;base64,' + res;

          fetch(url)
            .then(res => res.blob())
            .then(blob => {
              let url = window.URL.createObjectURL(blob);
              var element = document.createElement('a');
              element.setAttribute('href', url);
              element.setAttribute('download', 'crypto-config.zip');

              element.style.display = 'none';
              document.body.appendChild(element);

              element.click();

              document.body.removeChild(element);

              notifications.success('Download started');
            });
        }
      }
    );
  }

  render() {
    return (
      <div className="assetsStats content">
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
                    Downloads
                  </div>
                </div>
                <div className="card-block">
                  <div className="row">
                    <div className="col-xl-12">
                      <div className="card card-transparent">
                        <div className="table-responsive">
                          <table className="table table-hover" id="basicTable">
                            <thead>
                              <tr>
                                <th style={{ width: '30%' }}>Name</th>
                                <th style={{ width: '30%' }}>Download</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr key="connection-profile">
                                <td className="v-align-middle">Connection Profile</td>
                                <td className="v-align-middle">
                                  {this.state['downloading_connection_profile'] == true && <LoadingIcon />}
                                  {this.state['downloading_connection_profile'] != true && (
                                    <i
                                      className="clickable fa fa-download"
                                      onClick={e => {
                                        this.downloadConnectionProfile();
                                      }}
                                    />
                                  )}
                                </td>
                              </tr>
                              <tr key="certs">
                                <td className="v-align-middle">Invite Channel Certs</td>
                                <td className="v-align-middle">
                                  {this.state['orderer_certs'] == true && <LoadingIcon />}
                                  {this.state['orderer_certs'] != true && (
                                    <i
                                      className="clickable fa fa-download"
                                      onClick={e => {
                                        this.downloadOrdererCerts();
                                      }}
                                    />
                                  )}
                                </td>
                              </tr>
                              <tr key="details">
                                <td className="v-align-middle">Organisation Details</td>
                                <td className="v-align-middle">
                                  {this.state['org_details'] == true && <LoadingIcon />}
                                  {this.state['org_details'] != true && (
                                    <i
                                      className="clickable fa fa-download"
                                      onClick={e => {
                                        this.downloadOrgDetails();
                                      }}
                                    />
                                  )}
                                </td>
                              </tr>
                              <tr key="cryptoConfig">
                                <td className="v-align-middle">Crypto Config</td>
                                <td className="v-align-middle">
                                  {this.state['crypto_certs'] == true && <LoadingIcon />}
                                  {this.state['crypto_certs'] != true && (
                                    <i
                                      className="clickable fa fa-download"
                                      onClick={e => {
                                        this.downloadCryptoConfig();
                                      }}
                                    />
                                  )}
                                </td>
                              </tr>
                            </tbody>
                          </table>
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
              props.history.push('/app/privatehive/list');
            }
          },
        }
      ),
    ],
  };
})(withRouter(Downloads));
