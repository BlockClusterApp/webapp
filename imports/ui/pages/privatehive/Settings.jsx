import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import PrivateHive from '../../../collections/privatehive';
import { withRouter } from 'react-router-dom';
import helpers from '../../../modules/helpers';
import notifications from '../../../modules/notifications';
import ReactHtmlParser, { processNodes, convertNodeToElement, htmlparser2 } from 'react-html-parser';
import ConfirmationButton from '../../components/Buttons/ConfirmationButton';
import { Link } from 'react-router-dom';
import moment from 'moment';
import EditableText from '../../components/EditableText/EditableText.jsx';

import './components/viewNetwork.scss';

class ViewEditNetwork extends Component {
  constructor() {
    super();
    this.state = {
      deleting: false,
      location: 'us-west-2',
      locations: [],
    };

    this.locationConfig = {};
  }

  componentWillUnmount() {
    this.props.subscriptions.forEach(s => {
      s.stop();
    });
  }

  componentDidMount() {
    Meteor.call('getClusterLocations', (err, res) => {
      this.setState({
        locations: res,
      });
    });
  }

  deleteNetwork = () => {
    this.setState({
      deleting: true,
    });

    Meteor.call('deletePrivateHiveNetwork', { id: this.props.network._id }, error => {
      this.setState({
        deleting: false,
      });
      if (error) {
        notifications.error(error.reason);
      } else {
        this.props.history.push('/app/privatehive/list');
        notifications.success('Network deleted');
      }
    });
  };

  getLocationName = locationCode => {
    const locationConfig = this.state.locations.find(a => a.locationCode === locationCode);
    if (!locationConfig) {
      return undefined;
    }
    return locationConfig.locationName;
  };

  nodeNameChange = newName => {
    Meteor.call('changePrivateHiveNodeName', { id: this.props.network.instanceId, newName }, (error, result) => {
      if (!error) {
        notifications.success('Name updated');
      } else {
        notifications.error(error.reason);
        console.log(error);
      }
    });
  };

  render() {
    const { network } = this.props;
    if (network) {
      this.locationConfig = this.state.locations.find(i => i && i.locationCode === network.locationCode);
      if (!this.locationConfig) {
        this.locationConfig = {};
      }
    }

    if (!network) {
      return (
        <div className="d-flex justify-content-center flex-column full-height ">
          <img src="assets/img/logo/blockcluster.png" alt="logo" width="250" />
          <div id="loader" />
          <br />
          <p style={{ textAlign: 'center', fontSize: '1.2em' }}>Fetching network details</p>
        </div>
      );
    }

    return (
      <div className="content ">
        <div className="m-t-20 container-fluid container-fixed-lg bg-white">
          <div className="row viewEditNetwork">
            <div className="col-lg-12">
              <div className="m-t-20 m-b-20">
                <Link to={`/app/privatehive/${this.props.match.params.id}/details`}>
                  Control Panel <i className="fa fa-angle-right" />
                </Link>
                &nbsp; Node Info
                <div className="form-horizontal">
                  <div className="form-group row">
                    <label htmlFor="fname" className="col-md-3 control-label">
                      Instance ID
                    </label>
                    <div className="col-md-9">
                      <span className="value-valign-middle">{network.instanceId}</span>
                    </div>
                  </div>
                  <div className="form-group row">
                    <label htmlFor="fname" className="col-md-3 control-label">
                      Node Name
                    </label>
                    <div className="col-md-9">
                      <span className="value-valign-middle">{<EditableText value={network.name} valueChanged={this.nodeNameChange} />}</span>
                    </div>
                  </div>
                  <div className="form-group row">
                    <label className="col-md-3 control-label">Member Type</label>
                    <div className="col-md-9">
                      <span className="value-valign-middle">{network.isJoin ? 'Peer only' : 'Orderer network'}</span>
                    </div>
                  </div>
                  <div className="form-group row">
                    <label className="col-md-3 control-label">Status</label>
                    <div className="col-md-9">
                      <b className="value-valign-middle-status">
                        {ReactHtmlParser(
                          helpers.convertStatusToTag(helpers.calculateNodeStatus(network.status), helpers.firstLetterCapital(helpers.calculateNodeStatus(network.status)))
                        )}
                      </b>
                    </div>
                  </div>

                  <div className="form-group row">
                    <label className="col-md-3 control-label">Location</label>
                    <div className="col-md-9">
                      <b className="value-valign-middle-status">{this.getLocationName(network.locationCode)}</b>
                    </div>
                  </div>

                  <div className="form-group row">
                    <label className="col-md-3 control-label">HLF Version</label>
                    <div className="col-md-9">{network.networkConfig.fabric.version}</div>
                  </div>

                  <div className="form-group row">
                    <label className="col-md-3 control-label">Total Orderers</label>
                    <div className="col-md-9">{network.networkConfig.fabric.orderers}</div>
                  </div>

                  <div className="form-group row">
                    <label className="col-md-3 control-label">Orderer Configuration</label>
                    <div className="col-md-9">
                      {network.networkConfig.orderer.cpu} vCPUs - {network.networkConfig.orderer.ram} GB RAM - {network.networkConfig.orderer.disk}
                      {network.networkConfig.orderer.isDiskChangeable ? '*' : ''} GD Disk Space
                    </div>
                  </div>

                  <div className="form-group row">
                    <label className="col-md-3 control-label">Total Peers</label>
                    <div className="col-md-9">{network.networkConfig.fabric.peers}</div>
                  </div>

                  <div className="form-group row">
                    <label className="col-md-3 control-label">Peer Configuration</label>
                    <div className="col-md-9">
                      {network.networkConfig.orderer.cpu} vCPUs - {network.networkConfig.orderer.ram} GB RAM - {network.networkConfig.orderer.disk}
                      {network.networkConfig.orderer.isDiskChangeable ? '*' : ''} GD Disk Space
                    </div>
                  </div>
                  <div className="form-group row">
                    <label className="col-md-3 control-label">Created At</label>
                    <div className="col-md-9">
                      <span className="value-valign-middle">{moment(network.createdAt).format('DD-MMM-YYYY kk:mm:ss')}</span>
                    </div>
                  </div>
                  <div className="form-group row">
                    <label className="col-md-3 control-label">External Orderer Addresses</label>
                    <div className="col-md-9">
                      <b className="value-valign-middle">
                        {(network.properties.externalOrderers || []).map((orderer, index) => {
                          return <li key={`${network.instanceId}_orderers_${index}`}>{orderer}</li>;
                        })}
                      </b>
                    </div>
                  </div>

                  <div className="form-group row">
                    <label className="col-md-3 control-label">Anchor Peer External Addresses</label>
                    <div className="col-md-9">
                      <b className="value-valign-middle">
                        {(network.properties.externalAnchorPeers || []).map((peer, index) => {
                          return <li key={`${network.instanceId}_anchor_peer_${index}`}>{peer}</li>;
                        })}
                      </b>
                    </div>
                  </div>

                  <div className="form-group row">
                    <label className="col-md-3 control-label">API Client</label>
                    <div className="col-md-9">
                      <b className="value-valign-middle">{network.properties.apiEndPoint}</b>
                    </div>
                  </div>

                  <div className="row form-group">
                    <div className="col-md-3">
                      <p>You can leave the network if you wish but if you are only one member then all data will be lost. Deleting orderer will cause all the functions to stop</p>
                    </div>
                    <div className="col-md-9">
                      <ConfirmationButton
                        loading={this.state.deleting}
                        completed={!!network.deletedAt}
                        onConfirm={this.deleteNetwork.bind(this, network._id)}
                        loadingText="Deleting"
                        completedText="Deleted"
                        actionText="Delete Network"
                      />
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

export default withTracker(function(props) {
  return {
    network: PrivateHive.find({ instanceId: props.match.params.id, active: true }).fetch()[0],
    subscriptions: [
      Meteor.subscribe('privatehive', {
        onReady: function() {
          if (PrivateHive.find({ instanceId: props.match.params.id, active: true }).fetch().length !== 1) {
            props.history.push('/app/privatehive/list');
          }
        },
      }),
    ],
  };
})(withRouter(ViewEditNetwork));
