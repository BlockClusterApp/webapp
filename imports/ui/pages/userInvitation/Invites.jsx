import React, { Component } from "react";
import { withTracker } from "meteor/react-meteor-data";
import { UserInvitation } from "../../../collections/user-invitation";
import helpers from "../../../modules/helpers";
import LocationSelector from "../../components/Selectors/LocationSelector";
import NetworkConfigSelector from '../../components/Selectors/NetworkConfigSelector.jsx'
import { withRouter } from "react-router-dom";
import CardVerification from '../billing/components/CardVerification.jsx';

import "./Invites.scss";

class Invites extends Component {
  constructor(props) {
    super(props);

    this.inviteLocationMapping = {};
    this.inviteConfigMapping = {};
    this.loading = {};
    this.state = {
      showModal: false,
      modalInvite: {},
      modalInviteId: undefined,
      locations: [],
      userData: [],
      loading: {}
    };
  }

  componentWillUnmount() {
    this.props.subscriptions.forEach(s => {
      s.stop();
    });
  }

  componentDidMount() {
    Meteor.call("getClusterLocations", (err, res) => {
      this.setState({
        locations: res
      });
    });
  }

  getLocationName = locationCode => {
    const locationConfig = this.state.locations.find(
      a => a.locationCode === locationCode
    );
    if (!locationConfig) {
      return undefined;
    }
    return locationConfig.locationName;
  };

  locationChangeListener = (inviteId, location) => {
    this.inviteLocationMapping[inviteId] = location;
  };

  configChangeListener = (inviteId, config) => {
    this.inviteConfigMapping[inviteId] = config;
    this.setState({});
  }

  cardVerificationListener = (isVerified) => {
    this.setState({
      cardVerified: isVerified
    });
  }

  acceptInvitation = (inviteId, invite, fromModal = false) => {
    const loading = this.state.loading;
    if(!fromModal){
      return this.setState({
        showModal: true,
        modalInvite: invite,
        modalInviteId: inviteId
      }, () => {
        $('#modalSlideLeft_soloAssetInfo').modal('show')
      });
    }
    loading[inviteId] = true;
    this.setState({
      loading
    });
    if (!this.loading[inviteId]) {
      Meteor.call(
        "acceptInvitation",
        inviteId,
        this.inviteLocationMapping[inviteId] || this.state.locations[0].locationCode,
        this.inviteConfigMapping[inviteId],
        () => {
          this.loading[inviteId] = false;
          const loading = this.state.loading;
          loading[inviteId] = false;
          $('#modalSlideLeft_soloAssetInfo').modal('hide');
          setTimeout(this.setState({
            loading,
            showModal: false
          }), 1000);
        }
      );
    }
    this.loading[inviteId] = loading;
  };

  rejectInvitation = inviteId => {
    const loading = this.state.loading;
    loading[inviteId] = true;
    this.setState({
      loading
    });
    if (!this.loading[inviteId]) {
      Meteor.call("rejectInvitation", inviteId, () => {
        this.loading[inviteId] = false;
        const loading = this.state.loading;
        loading[inviteId] = false;
        this.setState({
          loading
        });
      });
    }
    this.loading[inviteId] = loading;
  };

  getLocationName = locationCode => {
    const locationConfig = this.state.locations.find(
      a => a.locationCode === locationCode
    );
    if (!locationConfig) {
      return undefined;
    }
    return locationConfig.locationName;
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
          <button className="btn btn-danger" disabled>
            Rejected
          </button>
        );
      case 4:
        return <button className="btn btn-warn">Cancelled</button>;
      case 1:
      default:
        return (
          <span>
            <button
              type="button"
              className="btn btn-success"
              onClick={this.acceptInvitation.bind(this, inviteId, invite, false)}
              disabled={this.state.loading[inviteId] === true}
            >
              {this.state.loading[inviteId] === true ? (
                <i className="fa fa-spinner fa-spin" />
              ) : (
                <i className="fa fa-check" />
              )}&nbsp;Accept
            </button>&nbsp;&nbsp;
            <button
              type="button"
              className="btn btn-danger"
              onClick={this.rejectInvitation.bind(this, inviteId)}
              disabled={this.state.loading[inviteId] === true}
            >
              {this.state.loading[inviteId] === true ? (
                <i className="fa fa-spinner fa-spin" />
              ) : (
                <i className="fa fa-close" />
              )}&nbsp;Reject
            </button>
          </span>
        );
    }
  };

  cancelInvite = inviteId => {
    const loading = this.state.loading;
    loading[inviteId] = true;
    this.setState({
      loading
    });
    Meteor.call("cancelInvitation", inviteId, Meteor.userId(), () => {
      this.loading[inviteId] = false;
      const loading = this.state.loading;
      loading[inviteId] = false;
      this.setState({
        loading
      });
    });
    this.loading[inviteId] = loading;
  };

  resendInvite = inviteId => {
    const loading = this.state.loading;
    loading[inviteId] = true;
    this.setState({
      loading
    });
    Meteor.call("resendInvitation", inviteId, Meteor.userId(), () => {
      this.loading[inviteId] = false;
      const loading = this.state.loading;
      loading[inviteId] = false;
      this.setState({
        loading
      });
    });
    this.loading[inviteId] = loading;
  };

  getStatus = (int, inviteId, resendCount) => {
    switch (int) {
      case 2:
        return <span className="label label-success">Accepted<span className="badge badge-dummy">{resendCount || 0}</span></span>;
      case 3:
        return <span className="label label-danger">Rejected<span className="badge badge-dummy">{resendCount || 0}</span></span>;
      case 4:
        return (
          <div className="row">
            <span className="label label-danger">Cancelled<span className="badge badge-dummy">{resendCount || 0}</span></span>&nbsp;
            <span
              className="label label-info"
              onClick={this.resendInvite.bind(this, inviteId)}
              disabled={this.state.loading[inviteId] === true}
              style={{ cursor: "pointer" }}
            >
              {this.state.loading[inviteId] === true ? (
                <i className="fa fa-spinner fa-spin" />
              ) : (
                <i className="fa fa-mail-forward" />
              )}&nbsp;Resend<span className="badge badge-dummy">{resendCount || 0}</span>
            </span>
          </div>
        );
      default:
        return (
          <div>
            {/* <div className="row">
            <span className="label label-info">Pending</span>
          </div> */}
            <div className="row">
              <span
                className="label label-warning"
                onClick={this.cancelInvite.bind(this, inviteId)}
                disabled={this.state.loading[inviteId] === true}
                style={{ cursor: "pointer" }}
              >
                {this.state.loading[inviteId] === true ? (
                  <i className="fa fa-spinner fa-spin" />
                ) : (
                  <i className="fa fa-warning" />
                )}&nbsp;Cancel<span className="badge badge-dummy">{resendCount || 0}</span>
              </span>
              &nbsp;
              <span
                className="label label-info"
                onClick={this.resendInvite.bind(this, inviteId)}
                disabled={this.state.loading[inviteId] === true}
                style={{ cursor: "pointer" }}
              >
                {this.state.loading[inviteId] === true ? (
                  <i className="fa fa-spinner fa-spin" />
                ) : (
                  <i className="fa fa-mail-forward" />
                )}&nbsp;Resend&nbsp;<span className="badge">{resendCount || 0}</span>
              </span>
            </div>
          </div>
        );
    }
  };

  render() {

    let isButtonDisabled = this.state.loading[this.state.modalInviteId] === true;
    let isVoucherAlertShown = false;
    if(!this.state.cardVerified){
      isButtonDisabled = true;
      isVoucherAlertShown = true;
    }
    if(this.inviteConfigMapping[this.state.modalInviteId] && this.inviteConfigMapping[this.state.modalInviteId].voucher){
      isButtonDisabled = false;
      isVoucherAlertShown = false;
    }else {
      isVoucherAlertShown = true;
    }


    const Modal = this.state.showModal && (
      <div className="modal fade slide-right" id="modalSlideLeft_soloAssetInfo" tabIndex="-1" role="dialog" aria-hidden="true">
          <div className="modal-dialog modal-md">
              <div className="modal-content-wrapper">
                  <div className="modal-content">
                      <button type="button" className="close" data-dismiss="modal" aria-hidden="true" ><i className="pg-close fs-14"></i>
                      </button>
                      <div className="container-md-height full-height">
                          <div className="row-md-height">
                              <div className="modal-body col-md-height col-middle">
                                  <h5 className="text-primary ">Accept Invitation</h5>
                                  <br />

                                  <p>Sent by:&nbsp;<b>{this.state.modalInvite.metadata.inviteFrom.name}</b></p>
                                  <p>Network Name:&nbsp;<b>{this.state.modalInvite.metadata.network.name}</b></p>
                                  <form role="form" className="modal-assetInfo">
                                    <p>Select Location to deploy</p>
                                    <LocationSelector locationChangeListener={this.locationChangeListener.bind(this, this.state.modalInviteId)} />
                                    <br />
                                    <p>Select Node Configuration</p>
                                    <NetworkConfigSelector configChangeListener={this.configChangeListener.bind(this, this.state.modalInviteId)} />
                                    {!isVoucherAlertShown? null : <CardVerification cardVerificationListener={this.cardVerificationListener}/>}
                                  </form>
                                  <button
                                    type="button"
                                    className="btn btn-success"
                                    onClick={this.acceptInvitation.bind(this, this.state.modalInviteId, this.state.modalInvite, true)}
                                    disabled={isButtonDisabled}
                                  >
                                    {this.state.loading[this.state.modalInviteId] === true ? (
                                      <i className="fa fa-spinner fa-spin" />
                                    ) : (
                                      <i className="fa fa-check" />
                                    )}&nbsp;Accept
                                  </button>&nbsp;<button type="button" className="btn btn-default" data-dismiss="modal" onClick={() => {
                                    $('#modalSlideLeft_soloAssetInfo').modal('hide')
                                    setTimeout(this.setState({showModal: false}), 1000);

                                  }}>Close</button>
                                  </div>

                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
  );


    // const Modal = this.state.showModal && (
    //   <div id="myModal" className="modal fade" role="dialog">
    //     <div className="modal-dialog">
    //       <div className="modal-content">
    //         <div className="modal-header">
    //           <button type="button" className="close" data-dismiss="modal" onClick={() => this.setState({showModal: false})}>&times;</button>
    //           <h5 className="modal-title">Accept Invitation </h5>
    //         </div>
    //         <div className="modal-body">
    //           <p>Sent by:&nbsp;<b>{this.state.modalInvite.metadata.inviteFrom.name}</b></p>
    //           <p>Network Name:&nbsp;<b>{this.state.modalInvite.metadata.network.name}</b></p>

    //           <p>Select Location to deploy</p>
    //           <LocationSelector locationChangeListener={this.locationChangeListener.bind(this, this.state.modalInviteId)} />
    //           <br />
    //           <p>Select Node Configuration</p>
    //           <NetworkConfigSelector configChangeListener={this.configChangeListener.bind(this, this.state.modalInviteId)} />
    //           {!isVoucherAlertShown? null : <CardVerification cardVerificationListener={this.cardVerificationListener}/>}
    //         </div>
    //         <div className="modal-footer">
    //         <button
    //           type="button"
    //           className="btn btn-success"
    //           onClick={this.acceptInvitation.bind(this, this.state.modalInviteId, this.state.modalInvite, true)}
    //           disabled={isButtonDisabled}
    //         >
    //           {this.state.loading[this.state.modalInviteId] === true ? (
    //             <i className="fa fa-spinner fa-spin" />
    //           ) : (
    //             <i className="fa fa-check" />
    //           )}&nbsp;Accept
    //         </button>&nbsp;<button type="button" className="btn btn-default" data-dismiss="modal" onClick={() => this.setState({showModal: false})}>Close</button>
    //         </div>
    //       </div>

    //     </div>
    //   </div>
    // );

    return (
      <div className="content invite">
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
                          <th style={{ width: "5%" }}>S.No</th>
                          <th style={{ width: "25%" }}>Invite From</th>
                          <th style={{ width: "25%" }}>Network</th>
                          <th style={{ width: "%" }}>
                            Action
                          </th>
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
                                <td title={data.inviteFrom.email}>
                                  {data.inviteFrom.name}
                                </td>
                                <td>{data.network.name}</td>
                                <td>
                                  <div className="row">
                                    {item.invitationStatus === 1 ? (
                                      // <LocationSelector
                                      //   style={{ width: "45%" }}
                                      //   locationChangeListener={this.locationChangeListener.bind(
                                      //     this,
                                      //     item._id
                                      //   )}
                                      // />
                                      undefined
                                    ) : (
                                      <input
                                        className="form-control"
                                        value={this.getLocationName(
                                          item.joinedLocation
                                        )}
                                        disabled
                                        type="text"
                                        style={{ width: "50%" }}
                                      />
                                    )}
                                    &nbsp;&nbsp;
                                    {this.getActionStatus(
                                      item.invitationStatus,
                                      item._id,
                                      item
                                    )}
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
                          <th style={{ width: "5%" }}>S.No</th>
                          <th style={{ width: "32%" }}>Invite Sent to</th>
                          <th style={{ width: "23%" }}>Invited On </th>
                          <th style={{ width: "20%" }}>Network</th>
                          <th style={{ width: "25%" }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {this.props.sentInvitations.filter(item => item.invitationStatus < 5).map((item, index) => {
                          const data = item.metadata;
                          return (
                            <tr key={item._id}>
                              <td>{index + 1}.</td>
                              <td>
                                {data.inviteTo.name
                                  ? `${data.inviteTo.name} | `
                                  : ""}{" "}
                                {data.inviteTo.email}
                              </td>
                              <td>
                                {new Date(item.createdAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                    hour: "numeric",
                                    minute: "numeric"
                                  }
                                )}
                              </td>
                              <td>{data.network.name}</td>
                              <td>
                                {this.getStatus(
                                  item.invitationStatus,
                                  item._id,
                                  item.resendCount
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
        {Modal}
      </div>
    );
  }
}

export default withTracker(() => {
  return {
    receivedInvitations: UserInvitation.find({
      inviteTo: Meteor.userId()
    }).fetch(),
    sentInvitations: UserInvitation.find({
      inviteFrom: Meteor.userId()
    }).fetch(),
    subscriptions: [
      Meteor.subscribe("receivedInvitations"),
      Meteor.subscribe("sentInvitations")
    ]
  };
})(withRouter(Invites));
