import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';

import { PrivatehiveOrderers } from '../../../collections/privatehiveOrderers/privatehiveOrderers';
import { PrivatehivePeers } from '../../../collections/privatehivePeers/privatehivePeers';
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
    Meteor.call('getClusterLocations', { service: 'privatehive' }, (err, res) => {
      this.setState({
        locations: res,
      });
    });
  }

  deleteNetwork = () => {
    this.setState({
      deleting: true,
    });

    Meteor.call('deletePrivateHiveNetwork', { instanceId: this.props.network.instanceId }, error => {
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
                      Name
                    </label>
                    <div className="col-md-9">
                      <span className="value-valign-middle">{<EditableText value={network.name} valueChanged={this.nodeNameChange} />}</span>
                    </div>
                  </div>
                  <div className="form-group row">
                    <label htmlFor="fname" className="col-md-3 control-label">
                      Instance ID
                    </label>
                    <div className="col-md-9">
                      <span className="value-valign-middle">{network.instanceId}</span>
                    </div>
                  </div>
                  <div className="form-group row">
                    <label className="col-md-3 control-label">Organisation Type</label>
                    <div className="col-md-9">
                      <span className="value-valign-middle">{network.type === 'peer' ? 'Peer' : 'Orderer network'}</span>
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
                    <label className="col-md-3 control-label">Organisation Name and ID</label>
                    <div className="col-md-9">
                      <b className="value-valign-middle">{network.orgName}</b>
                    </div>
                  </div>
                  {network.type === 'orderer' && (
                    <div className="form-group row">
                      <label className="col-md-3 control-label">Orderer URL</label>
                      <div className="col-md-9">
                        <b className="value-valign-middle">
                          grpc://{network.workerNodeIP}:{network.ordererNodePort}
                        </b>
                      </div>
                    </div>
                  )}
                  {network.type === 'orderer' && (
                    <div className="form-group row">
                      <label className="col-md-3 control-label">Orderer Type</label>
                      <div className="col-md-9">
                        <b className="value-valign-middle">{network.ordererType}</b>
                      </div>
                    </div>
                  )}

                  {network.type === 'orderer' && (
                    <div className="form-group row">
                      <label className="col-md-3 control-label">Zookeeper Nodes</label>
                      <div className="col-md-9">3</div>
                    </div>
                  )}

                  {network.type === 'orderer' && (
                    <div className="form-group row">
                      <label className="col-md-3 control-label">Kafka Nodes</label>
                      <div className="col-md-9">3</div>
                    </div>
                  )}

                  {network.type === 'peer' && (
                    <div className="form-group row">
                      <label className="col-md-3 control-label">DB Type</label>
                      <div className="col-md-9">CouchDB</div>
                    </div>
                  )}

                  {/* <div className="form-group row">
                    <label className="col-md-3 control-label">API Client</label>
                    <div className="col-md-9">
                      <b className="value-valign-middle">{network.instanceId}.blockcluster.io</b>
                    </div>
                  </div> */}

                  <div className="row form-group">
                    <div className="col-md-3">
                      <p>You can delete the organisation if you wish. Deleting will cause all the functions to stop</p>
                    </div>
                    <div className="col-md-9">
                      <ConfirmationButton
                        loading={this.state.deleting}
                        completed={!!network.deletedAt}
                        onConfirm={this.deleteNetwork.bind(this, network._id)}
                        loadingText="Deleting"
                        completedText="Deleted"
                        actionText="Delete Organisation"
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
    network: [
      ...PrivatehivePeers.find({ instanceId: props.match.params.id, active: true })
        .fetch()
        .map(o => ({ ...o, type: 'peer' })),
      ...PrivatehiveOrderers.find({ instanceId: props.match.params.id, active: true })
        .fetch()
        .map(o => ({ ...o, type: 'orderer' })),
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
})(withRouter(ViewEditNetwork));
