import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter } from 'react-router-dom';
import PrivateHive from '../../../collections/privatehive';
import helpers from '../../../modules/helpers';
import { Link } from 'react-router-dom';
import moment from 'moment';

import './components/viewNetwork.scss';

class ViewNetwork extends Component {
  constructor() {
    super();
  }

  render() {
    return (
      <div className="content viewNetwork">
        <div className=" container-fluid   container-fixed-lg">
          <div className="row">
            <div className="col-sm-12">
              <div className="card card-transparent">
                <div className="card-header ">
                  <div className="card-title">
                    <Link to={'/app/privatehive'}>
                      {' '}
                      <i className="fa fa-angle-left" /> All Networks
                    </Link>
                  </div>
                </div>
                <div className="card-block">
                  <h2>{this.props.network ? this.props.network.name : ''}</h2>
                  <h5>
                    {this.props.network ? helpers.firstLetterCapital(!this.props.network.isJoin ? 'Orderer' : 'Remote Peer') : ''} network created on{' '}
                    {this.props.network ? moment(this.props.network.createdAt).format('DD-MMM-YYYY kk:mm:SS') : ''}. Here is the control panel for this blockchain node.
                  </h5>
                  <hr />
                  <div className="row ">
                    <div className="col-lg-3">
                      <p>Channels</p>
                      <div className="row m-l-5 m-t-10">
                        <div className="col-1 card-left-piller no-padding ">
                          <div className="light-black-bg p-t-30 p-b-35" />
                          <div className="bg-master-light p-t-30 p-b-35" />
                          <div className="light-black-bg p-t-30 p-b-35" />
                        </div>
                        <div className="col-10 bg-white b-a b-grey padding-10">
                          <div
                            className="clickable"
                            onClick={() => {
                              this.props.network ? this.props.history.push('/app/privatehive/' + this.props.network.instanceId + '/assets/create') : '';
                            }}
                          >
                            <p className="no-margin text-black bold text-uppercase fs-12">Create Channels</p>
                            <p className="no-margin fs-12">Private Subnet</p>
                          </div>
                          <div
                            className="clickable"
                            onClick={() => {
                              this.props.network ? this.props.history.push('/app/privatehive/' + this.props.network.instanceId + '/channels/manage') : '';
                            }}
                          >
                            <p className="p-t-20 no-margin text-black bold text-uppercase fs-12">Manage Channels</p>
                            <p className="no-margin fs-12">Add/Remove Members</p>
                          </div>
                          <div
                            className="clickable"
                            onClick={() => {
                              this.props.network ? this.props.history.push('/app/privatehive/' + this.props.network.instanceId + '/channels/explorer') : '';
                            }}
                          >
                            <p className="p-t-20 no-margin text-black bold text-uppercase fs-12">Explorer</p>
                            <p className="no-margin fs-12">Audit the blockchain</p>
                          </div>
                        </div>
                      </div>
                      <br />
                      <p className="small hint-text">Create mini blockchains for communicating privately between other peer organizations</p>
                    </div>
                    <div className="col-lg-3">
                      <p>Chaincodes</p>
                      <div className="row m-l-5 m-t-10">
                        <div className="col-1 card-left-piller no-padding ">
                          <div className="light-black-bg p-t-30 p-b-35" />
                          <div className="bg-master-light p-t-30 p-b-35" />
                          <div className="light-black-bg p-t-30 p-b-35" />
                        </div>
                        <div className="col-10 bg-white b-a b-grey padding-10">
                          <div
                            className="clickable"
                            onClick={() => {
                              this.props.network ? this.props.history.push('/app/privatehive/' + this.props.network.instanceId + '/chaincode/create') : '';
                            }}
                          >
                            <p className="no-margin text-black bold text-uppercase fs-12">Create Chaincode</p>
                            <p className="no-margin fs-12">Install and Initiate</p>
                          </div>
                          <div
                            className="clickable"
                            onClick={() => {
                              this.props.network ? this.props.history.push('/app/privatehive/' + this.props.network.instanceId + '/chaincode/manage') : '';
                            }}
                          >
                            <p className="p-t-20 no-margin text-black bold text-uppercase fs-12">Manage Chaincodes</p>
                            <p className="no-margin fs-12">Management</p>
                          </div>
                          <div
                            className="clickable"
                            onClick={() => {
                              this.props.network ? this.props.history.push('/app/privatehive/' + this.props.network.instanceId + '/chaincode/access-control') : '';
                            }}
                          >
                            <p className="p-t-20 no-margin text-black bold text-uppercase fs-12">APIs</p>
                            <p className="no-margin fs-12">Integrate Chaincode</p>
                          </div>
                        </div>
                      </div>
                      <br />
                      <p className="small hint-text">Write, deploy and generate APIs for smart contracts using JavaScript, Java and Golang</p>
                    </div>
                    <div className="col-lg-3">
                      <p>Settings</p>
                      <div className="row m-l-5 m-t-10">
                        <div className="col-1 card-left-piller no-padding ">
                          <div className="light-black-bg p-t-30 p-b-35" />
                          <div className="bg-master-light p-t-30 p-b-35" />
                          <div className="light-black-bg p-t-30 p-b-35" />
                        </div>
                        <div className="col-10 bg-white b-a b-grey padding-10">
                          <div
                            className="clickable"
                            onClick={() => {
                              this.props.network ? this.props.history.push('/app/privatehive/' + this.props.network.instanceId + '/settings') : '';
                            }}
                          >
                            <p className="no-margin text-black bold text-uppercase fs-12">Node Info and Settings</p>
                            <p className="no-margin fs-12">Network and Hardware</p>
                          </div>

                          <div
                            className="clickable"
                            onClick={() => {
                              this.props.network ? this.props.history.push('/app/privatehive/' + this.props.network.instanceId + '/security/peers') : '';
                            }}
                          >
                            <p className="p-t-20 no-margin text-black bold text-uppercase fs-12">Explorer</p>
                            <p className="no-margin fs-12">Audit</p>
                          </div>
                          <div
                            className="clickable"
                            onClick={() => {
                              this.props.network ? this.props.history.push('/app/privatehive/' + this.props.network.instanceId + '/security/apis') : '';
                            }}
                          >
                            <p className="p-t-20 no-margin text-black bold text-uppercase fs-12">Notifications</p>
                            <p className="no-margin fs-12">Events and Alerts</p>
                          </div>
                        </div>
                      </div>
                      <br />
                      <p className="small hint-text">Control the node settings, network authorities, peers and measure performance</p>
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
      Meteor.subscribe(
        'privatehive.one',
        { instanceId: props.match.params.id },
        {
          onReady: function() {
            if (PrivateHive.find({ instanceId: props.match.params.id, active: true }).fetch().length !== 1) {
              props.history.push('/app/privatehive');
            }
          },
        }
      ),
    ],
  };
})(withRouter(ViewNetwork));
