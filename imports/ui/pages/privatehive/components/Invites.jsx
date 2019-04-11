import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter } from 'react-router-dom';
import { UserInvitation } from '../../../../collections/user-invitation';
import PrivatehiveNetworkSelector from '../../../components/Selectors/PrivatehiveNetworkSelector';
import { PrivatehivePeers } from '../../../../collections/privatehivePeers/privatehivePeers';
import notifications from '../../../../modules/notifications';

import '../../userInvitation/Invites.scss';

class Invites extends Component {
  constructor(props) {
    super(props);
    this.inviteConfigMapping = {};
    this.loading = {};
    this.state = {
      showModal: false,
      modalInvite: {},
      modalInviteId: undefined,
      userData: [],
      loading: {},
    };
  }

  componentWillUnmount() {
    this.props.subscriptions.forEach(s => {
      s.stop();
    });
  }

  componentDidMount() {}

  configChangeListener = (inviteId, config) => {
    this.inviteConfigMapping[inviteId] = config;
    this.setState({});
  };

  cardVerificationListener = isVerified => {
    this.setState({
      cardVerified: isVerified,
    });
  };

  acceptInvitation = (inviteId, invite, fromModal = false) => {
    const loading = this.state.loading;
    if (!fromModal) {
      return this.setState(
        {
          showModal: true,
          modalInvite: invite,
          modalInviteId: inviteId,
        },
        () => {
          $('#modalSlideLeft_soloAssetInfo').modal('show');
        }
      );
    }
    loading[inviteId] = true;
    this.setState({
      loading,
    });
    if (!this.peer) {
      return notifications.error('Peer is required');
    }
    if (!this.loading[inviteId]) {
      Meteor.call(
        'acceptInvitation',
        {
          inviteId,
          type: this.state.modalInvite.type,
          peerId: this.peer && this.peer._id,
        },
        () => {
          this.loading[inviteId] = false;
          const loading = this.state.loading;
          loading[inviteId] = false;
          $('#modalSlideLeft_soloAssetInfo').modal('hide');
          setTimeout(
            this.setState({
              loading,
              showModal: false,
            }),
            1000
          );
        }
      );
    }
    this.loading[inviteId] = loading;
  };

  rejectInvitation = inviteId => {
    const loading = this.state.loading;
    loading[inviteId] = true;
    this.setState({
      loading,
    });
    if (!this.loading[inviteId]) {
      Meteor.call('rejectInvitation', inviteId, () => {
        this.loading[inviteId] = false;
        const loading = this.state.loading;
        loading[inviteId] = false;
        this.setState({
          loading,
        });
      });
    }
    this.loading[inviteId] = loading;
  };

  getActionStatus = (int, inviteId, invite) => {
    switch (int) {
      case 2:
        return (
          <button className="btn btn-success" disabled>
            Accepted
          </button>
        );
      case 3:
        return (
          <button className="btn btn-primary" disabled>
            Rejected
          </button>
        );
      case 4:
        return <button className="btn btn-danger">Cancelled</button>;
      case 1:
      default:
        return (
          <span>
            <button type="button" className="btn btn-success" onClick={this.acceptInvitation.bind(this, inviteId, invite, false)} disabled={this.state.loading[inviteId] === true}>
              {this.state.loading[inviteId] === true ? <i className="fa fa-spinner fa-spin" /> : <i className="fa fa-check" />}&nbsp;Accept
            </button>
            &nbsp;&nbsp;
            <button type="button" className="btn btn-danger" onClick={this.rejectInvitation.bind(this, inviteId)} disabled={this.state.loading[inviteId] === true}>
              {this.state.loading[inviteId] === true ? <i className="fa fa-spinner fa-spin" /> : <i className="fa fa-close" />}&nbsp;Reject
            </button>
          </span>
        );
    }
  };

  cancelInvite = inviteId => {
    const loading = this.state.loading;
    loading[inviteId] = true;
    this.setState({
      loading,
    });
    Meteor.call('cancelInvitation', inviteId, Meteor.userId(), () => {
      this.loading[inviteId] = false;
      const loading = this.state.loading;
      loading[inviteId] = false;
      this.setState({
        loading,
      });
    });
    this.loading[inviteId] = loading;
  };

  resendInvite = inviteId => {
    const loading = this.state.loading;
    loading[inviteId] = true;
    this.setState({
      loading,
    });
    Meteor.call('resendInvitation', inviteId, Meteor.userId(), () => {
      this.loading[inviteId] = false;
      const loading = this.state.loading;
      loading[inviteId] = false;
      this.setState({
        loading,
      });
    });
    this.loading[inviteId] = loading;
  };

  getStatus = (int, inviteId, resendCount) => {
    switch (int) {
      case 2:
        return <span className="label label-success">Accepted</span>;
      case 3:
        return <span className="label label-danger">Rejected</span>;
      case 4:
        return <span className="label label-danger">Cancelled</span>;
      default:
        return <span className="label label-info">Pending</span>;
    }
  };

  onPrivateHivePeerChange = peer => {
    this.peer = peer;
  };

  getActions = (int, inviteId, resendCount) => {
    switch (int) {
      case 2:
        return <span />;
      case 3:
        return <span />;
      case 4:
        return (
          <div className="btn-group btn-group-xs">
            <button className="btn btn-complete" onClick={this.resendInvite.bind(this, inviteId)} disabled={this.state.loading[inviteId] === true}>
              {this.state.loading[inviteId] === true ? <i className="fa fa-spinner fa-spin" /> : <i className="fa fa-mail-forward" />}&nbsp;Resend&nbsp;
              <span className="badge badge-inverse">{resendCount || 0}</span>
            </button>
          </div>
        );
      default:
        return (
          <div className="btn-group btn-group-xs">
            <button className="btn btn-danger" onClick={this.cancelInvite.bind(this, inviteId)} disabled={this.state.loading[inviteId] === true}>
              {this.state.loading[inviteId] === true ? <i className="fa fa-spinner fa-spin" /> : <i className="fa fa-warning" />}&nbsp;Cancel
            </button>
            &nbsp;
            <button className="btn btn-complete" onClick={this.resendInvite.bind(this, inviteId)} disabled={this.state.loading[inviteId] === true}>
              {this.state.loading[inviteId] === true ? <i className="fa fa-spinner fa-spin" /> : <i className="fa fa-mail-forward" />}&nbsp;Resend&nbsp;
              <span className="badge badge-inverse">{resendCount || 0}</span>
            </button>
          </div>
        );
    }
  };

  render() {
    let Modal = undefined;

    if (this.state.modalInvite.type === 'privatehive-channel') {
      Modal = (
        <div className="modal fade slide-right" id="modalSlideLeft_soloAssetInfo" tabIndex="-1" role="dialog" aria-hidden="true">
          <div className="modal-dialog modal-md">
            <div className="modal-content-wrapper">
              <div className="modal-content">
                <button type="button" className="close" data-dismiss="modal" aria-hidden="true">
                  <i className="pg-close fs-14" />
                </button>
                <div className="container-md-height full-height">
                  <div className="row-md-height">
                    <div className="modal-body col-md-height col-middle">
                      <form role="form" className="modal-assetInfo">
                        <h5 class="text-primary ">
                          Join Channel <span class="semi-bold">{this.state.modalInvite.metadata.channel.name}</span>
                        </h5>
                        <PrivatehiveNetworkSelector label="Select Peer" networks={this.props.networks} onValueChangeListener={this.onPrivateHivePeerChange} />
                      </form>
                      <button type="button" className="btn btn-success" onClick={this.acceptInvitation.bind(this, this.state.modalInviteId, this.state.modalInvite, true)}>
                        {this.state.loading[this.state.modalInviteId] === true ? <i className="fa fa-spinner fa-spin" /> : <i className="fa fa-check" />}&nbsp;Join
                      </button>
                      &nbsp;
                      <button
                        type="button"
                        className="btn btn-default"
                        data-dismiss="modal"
                        onClick={() => {
                          $('#modalSlideLeft_soloAssetInfo').modal('hide');
                        }}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="invite">
        <div className="m-t-20 container-fluid container-fixed-lg bg-white">
          <div className="row">
            <div className="col-lg-12">
              <div className="card card-transparent">
                <div className="card-header ">
                  <div className="card-title">Received Invitations</div>
                </div>
                <div className="card-block">
                  <div className="table-responsive">
                    <table className="table table-hover" id="basicTable">
                      <thead>
                        <tr>
                          <th style={{ width: '5%' }}>S.No</th>
                          <th style={{ width: '25%' }}>Invite From</th>
                          <th style={{ width: '25%' }}>Channel</th>
                          <th style={{ width: '%' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {this.props.receivedInvitations
                          .filter(item => item.invitationStatus < 4)
                          .map((item, index) => {
                            const data = item.metadata;
                            return (
                              <tr key={item._id}>
                                <td>{index + 1}.</td>
                                <td title={data.inviteFrom.email}>{data.inviteFrom.name}</td>
                                <td>{data.channel ? data.channel.name : null}</td>
                                <td>
                                  <div className="row">
                                    {[1, 3, 4, 5].includes(item.invitationStatus) ? (
                                      undefined
                                    ) : (
                                      <input className="form-control" value={item.joinedNetwork} disabled type="text" style={{ width: '50%' }} />
                                    )}
                                    &nbsp;&nbsp;
                                    {this.getActionStatus(item.invitationStatus, item._id, item)}
                                  </div>
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
          <div className="row">
            <div className="col-lg-12">
              <div className="card card-transparent">
                <div className="card-header ">
                  <div className="card-title">Sent Invitations</div>
                </div>
                <div className="card-block">
                  <div className="table-responsive">
                    <table className="table table-hover" id="basicTable">
                      <thead>
                        <tr>
                          <th style={{ width: '5%' }}>S.No</th>
                          <th style={{ width: '32%' }}>Invite Sent to</th>
                          <th style={{ width: '23%' }}>Invited On </th>
                          <th style={{ width: '10%' }}>Network</th>
                          <th style={{ width: '10%' }}>Status</th>
                          <th style={{ width: '20%' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {this.props.sentInvitations
                          .filter(item => item.invitationStatus < 5)
                          .map((item, index) => {
                            const data = item.metadata;
                            return (
                              <tr key={item._id}>
                                <td>{index + 1}.</td>
                                <td>
                                  {data.inviteTo.name ? `${data.inviteTo.name} | ` : ''} {data.inviteTo.email}
                                </td>
                                <td>
                                  {new Date(item.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: 'numeric',
                                  })}
                                </td>
                                <td>{data.network ? data.network.name : data.channel ? data.channel.name : null}</td>
                                <td>{this.getStatus(item.invitationStatus, item._id, item.resendCount)}</td>
                                <td>{this.getActions(item.invitationStatus, item._id, item.resendCount)}</td>
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
        {Modal}
      </div>
    );
  }
}

export default withTracker(() => {
  return {
    receivedInvitations: UserInvitation.find({
      inviteTo: Meteor.userId(),
      type: 'privatehive-channel',
    }).fetch(),
    sentInvitations: UserInvitation.find({
      inviteFrom: Meteor.userId(),
      type: 'privatehive-channel',
    }).fetch(),
    subscriptions: [Meteor.subscribe('receivedInvitations'), Meteor.subscribe('sentInvitations'), Meteor.subscribe('privatehive')],
    networks: [...PrivatehivePeers.find({ userId: Meteor.userId(), active: true }).fetch()],
  };
})(withRouter(Invites));
