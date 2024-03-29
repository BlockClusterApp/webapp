import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import helpers from '../../../../modules/helpers';
import { withRouter } from 'react-router-dom';
import { Link } from 'react-router-dom';
import moment from 'moment';
import notifications from '../../../../modules/notifications';
import KubeDashboard from './components/KubeDashboard';
import ConfirmationButton from '../../../components/Buttons/ConfirmationButton';

class NetworkList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      locations: [],
      page: 0,
      networkId: null,
      network: {},
      deleteConfirmAsked: false,
    };
  }

  componentWillUnmount() {
    this.unmounted = true;
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.props.subscriptions.forEach(s => {
      s.stop();
    });
  }

  componentDidMount() {
    this.setState({
      networkId: this.props.match.params.id,
    });
    this.fetchNetwork();
  }

  fetchNetwork() {
    Meteor.call('fetchPrivateHiveNetworkForAdmin', this.props.match.params.id, (err, res) => {
      if (err) {
        return console.log(err);
      }
      this.setState({
        network: res,
      });
    });
  }

  // getNetworkType = config => {
  //   if (!config) {
  //     return null;
  //   }
  //   return (
  //     <div className="row p-t-10">
  //       <div className="col-md-12">
  //         <i className="fa fa-save" />
  //         &nbsp;Kafka: <b>{config.kafka.cpu}</b> vCPUs, <b>{config.kafka.ram}</b> GB RAM,{' '}
  //         <b>
  //           {config.kafka.disk}
  //           {config.kafka.isDiskChangeable ? <sup>*</sup> : ''}
  //         </b>{' '}
  //         GB Disk
  //       </div>
  //       <div className="col-md-12">
  //         <i className="fa fa-save" />
  //         &nbsp;Orderer: <b>{config.orderer.cpu}</b> vCPUs, <b>{config.orderer.ram}</b> GB RAM,{' '}
  //         <b>
  //           {config.kafka.disk}
  //           {config.orderer.isDiskChangeable ? <sup>*</sup> : ''}
  //         </b>{' '}
  //         GB Disk
  //       </div>
  //       <div className="col-md-12">
  //         <i className="fa fa-save" />
  //         &nbsp;Peer: <b>{config.peer.cpu}</b> vCPUs, <b>{config.peer.ram}</b> GB RAM
  //       </div>
  //       <div className="col-md-12">
  //         <i className="fa fa-save" />
  //         &nbsp;Data:{' '}
  //         <b>
  //           {config.kafka.disk}
  //           {config.data.isDiskChangeable ? <sup>*</sup> : ''}
  //         </b>{' '}
  //         GB Disk
  //       </div>
  //     </div>
  //   );
  // };

  getNetworkStatus = status => {
    if (status === 'initializing' || status === 'pending' || 'testing') {
      return <span className="label label-inverse">{status}</span>;
    } else if (status === 'running' || status === 'completed') {
      return <span className="label label-success">{status}</span>;
    } else if (status === 'down' || status === 'cancelled') {
      return <span className="label label-important">{status}</span>;
    } else {
      return <span className="label label-primary">{status}</span>;
    }
  };

  deleteNode = () => {
    this.setState({
      deleteDisabled: true,
      loading: true,
    });

    Meteor.call('adminDeletePrivatehiveNetwork', this.state.network.network.instanceId, (err, res) => {
      this.setState({
        deleteDisabled: true,
        loading: false,
      });
      if (!err) {
        this.fetchNetwork();
        notifications.success('Network deleted successfully');
      } else {
        notifications.error(err.reason);
      }
    });
  };

  restartPod = () => {
    if (!this.state.restartConfirmAsked) {
      this.restartTimer = setTimeout(() => {
        if (this.state && !this.unmounted) {
          this.setState({
            restartConfirmAsked: false,
          });
        }
      }, 5 * 1000);

      return this.setState({
        restartConfirmAsked: true,
      });
    }

    // this.setState({
    //   restartingPod: true,
    // });

    // Meteor.call('restartPod', this.state.network.network.instanceId, (err, res) => {
    //   this.setState({
    //     restartConfirmAsked: false,
    //   });
    //   if (!err) {
    //     this.restartTimer = setTimeout(() => {
    //       this.setState({
    //         restartingPod: false,
    //       });
    //     }, 60 * 1000);
    //     notifications.success('Pod restarted successfully');
    //   } else {
    //     notifications.error(err.reason);
    //   }
    // });
  };

  render() {
    const { network, user, locations, voucher } = this.state.network;
    if (!user) {
      const LoadingView = (
        <div
          className="d-flex justify-content-center flex-column full-height"
          style={{
            marginTop: '250px',
            paddingBottom: '250px',
            paddingLeft: '250px',
          }}
        >
          <div id="loader" />
          <br />
          <p style={{ textAlign: 'center', fontSize: '1.2em' }}>Just a minute</p>
        </div>
      );
      return LoadingView;
    }

    let thisLocation = locations.find(loc => loc.locationCode === network.locationCode);

    if (!thisLocation) {
      thisLocation = locations[0];
    }

    return (
      <div className="page-content-wrapper ">
        <div className="content sm-gutter">
          <div data-pages="parallax">
            <div className="container-fluid p-l-25 p-r-25 sm-p-l-0 sm-p-r-0">
              <div className="inner">
                <ol className="breadcrumb sm-p-b-5">
                  <li className="breadcrumb-item">
                    <Link to="/app/admin">Admin</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link to="/app/admin/networks">Networks</Link>
                  </li>
                  <li className="breadcrumb-item active">{this.state.networkId}</li>
                </ol>
              </div>
            </div>
          </div>
          <div className="container-fluid p-l-25 p-r-25 p-t-0 p-b-25 sm-padding-10">
            <div className="row">
              <div className="col-lg-3 col-sm-6  d-flex flex-column">
                <div className="card social-card share  full-width m-b-10 no-border" data-social="item">
                  <div className="card-header ">
                    <h5 className="text-primary pull-left fs-12">
                      User <i className="fa fa-circle text-complete fs-11" />
                    </h5>
                    <div className="pull-right small hint-text">
                      <Link to={`/app/admin/users/${user._id}`}>
                        Details <i className="fa fa-comment-o" />
                      </Link>
                    </div>
                    <div className="clearfix" />
                  </div>
                  <div className="card-description">
                    <p>
                      <Link to={`/app/admin/users/${user._id}`}>
                        {user.profile.firstName} {user.profile.lastName}
                      </Link>
                    </p>
                  </div>
                </div>
                <div className="card no-border widget-loader-bar m-b-10">
                  <div className="container-xs-height full-height">
                    <div className="row-xs-height">
                      <div className="col-xs-height col-top">
                        <div className="card-header  top-left top-right">
                          <div className="card-title">
                            <span className="font-montserrat fs-11 all-caps">
                              Email <i className="fa fa-chevron-right" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="row-xs-height">
                      <div className="col-xs-height col-top">
                        <div className="p-l-20 p-t-50 p-b-40 p-r-20">
                          <p className="no-margin p-b-5">{user.emails[0].address}</p>
                        </div>
                      </div>
                    </div>
                    <div className="row-xs-height">
                      <div className="col-xs-height col-bottom">
                        <div className="progress progress-small m-b-0">
                          <div
                            className="progress-bar progress-bar-primary"
                            style={{
                              width: '100%',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-4 col-sm-6  d-flex flex-column">
                <div className="card social-card share  full-width m-b-10 no-border" data-social="item">
                  <div className="card-header clearfix">
                    <h5 className="text-success pull-left fs-12">Network Info | {network.instanceId}</h5>
                    <div className="clearfix" />
                  </div>
                  <div className="card-description">
                    {this.getNetworkStatus(network.status)}&nbsp;{helpers.firstLetterCapital(network.name)}
                    <br />
                    <span style={{ fontSize: '10px', color: '#888' }}>Created On: {moment(network.createdAt).format('DD-MMM-YYYY kk:mm:ss')}</span>
                  </div>
                  <div className="clearfix" />
                </div>
                <div className="card social-card share  full-width m-b-10 no-border" data-social="item">
                  <div className="card-header clearfix">
                    <h5 className="text-danger pull-left fs-12">Actions</h5>
                    <div className="clearfix" />
                  </div>
                  <div className="card-description">
                    <ConfirmationButton
                      loading={this.state.loading}
                      completed={!!network.deletedAt}
                      onConfirm={this.deleteNode}
                      loadingText="Deleting"
                      completedText={'Already deleted'}
                      actionText="Delete Node"
                    />
                    &nbsp;
                    {/* <button className="btn btn-danger" style={{ marginBottom: '5px' }} onClick={this.restartPod} disabled={this.state.restartingPod}>
                      {this.state.restartingPod && <i className="fa fa-spinner fa-spin" />}&nbsp;
                      {!!this.state.restartingPod ? 'Restarting Pod' : this.state.restartConfirmAsked ? 'Are you sure? This is irreversible' : 'Restart Pod'}
                    </button> */}
                  </div>
                  <div className="clearfix" />
                </div>
              </div>
              <div className="col-lg-5 col-sm-6 d-flex flex-column">
                <div className="card social-card share  full-width m-b-10 no-border" data-social="item">
                  <div className="card-header clearfix">
                    <h5 className="text-info pull-left fs-12">Network Config</h5>
                    <div className="clearfix" />
                  </div>
                  <div className="card-description">
                    Location: <b>{thisLocation.locationCode}</b> <span style={{ color: '#777', fontSize: '11px' }}>&nbsp;{thisLocation.locationName} </span>
                    <br />
                    Type: {network.type} | {network.networkConfig.name}
                    <br />
                    {network.networkConfig.cpu} | {network.networkConfig.ram} | {network.networkConfig.disk}
                  </div>
                  <div className="clearfix" />
                </div>
                {voucher && (
                  <div>
                    <div className="card social-card share  full-width m-b-10 no-border" data-social="item">
                      <div className="card-header clearfix">
                        <h5 className="text-primary pull-left fs-12">Voucher</h5>
                        <div className="clearfix" />
                      </div>
                      <div className="card-description" style={{ fontSize: '0.8em', color: '#888' }}>
                        <h5>{voucher.code}&nbsp;</h5>
                        {voucher.isDiskChangeable ? 'Disk configurable' : null}
                        <p>Expires on: {moment(voucher.expiryDate).format('DD-MMM-YYYY')}</p>
                      </div>

                      <div className="clearfix" />
                    </div>
                  </div>
                )}
              </div>
            </div>
            {!network.deletedAt && (
              <div className="row">
                <div className="col-md-12">
                  <KubeDashboard instanceId={network.instanceId} networkId={network._id} type={network.type} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default withTracker(() => {
  return {
    users: Meteor.users.find({}).fetch(),
    subscriptions: [Meteor.subscribe('users.all', { page: 0 })],
  };
})(withRouter(NetworkList));
