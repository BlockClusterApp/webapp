import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { Networks } from '../../../collections/networks/networks.js';
import { withRouter } from 'react-router-dom';
import helpers from '../../../modules/helpers';
import notifications from '../../../modules/notifications';
import ReactHtmlParser, { processNodes, convertNodeToElement, htmlparser2 } from 'react-html-parser';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';
import { Link } from 'react-router-dom';
import Config from '../../../modules/config/client';

import './ViewEditImpulse.scss';

class ViewEditImpulse extends Component {
  constructor() {
    super();
    this.state = {
      deleting: false,
      location: 'us-west-2',
      locations: [],
    };
  }

  componentWillUnmount() {
    this.props.subscriptions.forEach(s => {
      s.stop();
    });
  }

  componentDidMount() {
    Meteor.call('getClusterLocations', {}, (err, res) => {
      this.setState({
        locations: res,
      });
    });
  }

  deleteNetwork = () => {
    this.setState({
      deleting: true,
    });

    Meteor.call('deleteNetwork', this.props.network[0].instanceId, error => {
      if (error) {
        notifications.error(error.reason || error.message || 'An error occured');
      } else {
        this.props.history.push('/app/networks');
        notifications.success('Network deleted successful');
      }

      this.setState({
        deleting: false,
      });
    });
  };

  vote = e => {
    e.preventDefault();
    Meteor.call('vote', this.props.network[0]._id, this.authorityAddress.value, error => {
      if (error) {
        notifications.error(error.reason || error.message || 'An error occured');
      } else {
        notifications.success('Voted Successfully');
        this.authorityAddress.value = '';
      }
    });
  };

  unVote = e => {
    e.preventDefault();
    Meteor.call('unVote', this.props.network[0]._id, this.authorityAddress.value, error => {
      if (error) {
        notifications.error(error.reason || error.message || 'An error occured');
      } else {
        notifications.success('Unvoted Successfully');
        this.authorityAddress.value = '';
      }
    });
  };

  createAccount = e => {
    e.preventDefault();
    Meteor.call('createAccount', this.accountPassword.value, this.props.network[0]._id, error => {
      if (error) {
        notifications.error(error.reason || error.message || 'An error occured');
      } else {
        notifications.success('Account created');
        this.accountPassword.value = '';
      }
    });
  };

  downloadAccount = (e, address) => {
    e.preventDefault();
    this.setState({
      [address + '_downloading']: true,
    });

    Meteor.call('downloadAccount', this.props.network[0].instanceId, address, (error, result) => {
      if (!error) {
        helpers.downloadString(result, 'application/json', 'key.json');
      } else {
        notifications.error(error.reason || error.message || 'An error occured');
      }

      this.setState({
        [address + '_downloading']: false,
      });
    });
  };

  getLocationName = locationCode => {
    const locationConfig = this.state.locations.find(a => a.locationCode === locationCode);
    if (!locationConfig) {
      return undefined;
    }
    return locationConfig.locationName;
  };

  render() {
    console.log(this.props.network[0]);
    return (
      <div className="content ">
        <div className="m-t-20 container-fluid container-fixed-lg bg-white">
          <div className="row viewEditPulse">
            <div className="col-lg-12">
              <div className="m-t-20 m-b-20">
                <Link to={'/app/networks/' + this.props.match.params.id}>
                  {' '}
                  Control Panel <i className="fa fa-angle-right" />
                </Link>{' '}
                Impulse Info
                <div className="form-horizontal">
                  {(() => {
                    if (this.props.network.length === 1) {
                      if (this.props.network[0].impulseStatus) {
                        return (
                          <div className="form-group row">
                            <label className="col-md-3 control-label">Status</label>
                            <div className="col-md-9">
                              <span className="value-valign-middle-status">
                                {this.props.network.length === 1
                                  ? ReactHtmlParser(
                                      helpers.convertStatusToTag(
                                        helpers.calculateNodeStatus(this.props.network[0].impulseStatus),
                                        helpers.firstLetterCapital(helpers.calculateNodeStatus(this.props.network[0].impulseStatus))
                                      )
                                    )
                                  : ''}
                              </span>
                            </div>
                          </div>
                        );
                      }
                    }
                  })()}

                  {(() => {
                    if (this.props.network.length === 1) {
                      if (this.props.network[0].impulse) {
                        return (
                          <div className="form-group row">
                            <label className="col-md-3 control-label">Private Key</label>
                            <div className="col-md-9">
                              <span className="value-valign-middle">{helpers.hexToBase64(this.props.network[0].impulse.privateKey)}</span>
                            </div>
                          </div>
                        );
                      }
                    }
                  })()}

                  {(() => {
                    if (this.props.network.length === 1) {
                      if (this.props.network[0].impulse) {
                        return (
                          <div className="form-group row">
                            <label className="col-md-3 control-label">Public Key</label>
                            <div className="col-md-9">
                              <span className="value-valign-middle">{helpers.hexToBase64(this.props.network[0].impulse.publicKey)}</span>
                            </div>
                          </div>
                        );
                      }
                    }
                  })()}

                  {(() => {
                    if (this.props.network.length === 1) {
                      if (this.props.network[0].impulseURL) {
                        return (
                          <div className="form-group row">
                            <label className="col-md-3 control-label">Impulse URL</label>
                            <div className="col-md-9">
                              <b className="value-valign-middle">{this.props.network[0].impulseURL}</b>
                            </div>
                          </div>
                        );
                      }
                    }
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withTracker(function(props) {
  return {
    network: Networks.find({ instanceId: props.match.params.id }).fetch(),
    workerNodeIP: Config.workerNodeIP,
    subscriptions: [
      Meteor.subscribe('networks', {
        onReady: function() {
          if (Networks.find({ instanceId: props.match.params.id }).fetch().length !== 1) {
            props.history.push('/app/networks');
          }
        },
      }),
    ],
  };
})(withRouter(ViewEditImpulse));
