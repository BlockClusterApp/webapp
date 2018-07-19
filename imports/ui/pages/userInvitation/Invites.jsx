import React, { Component } from "react";
import { withTracker } from "meteor/react-meteor-data";
import { UserInvitation } from "../../../collections/user-invitation";
import helpers from "../../../modules/helpers";
import LocationSelector from "../../components/LocationSelector/LocationSelectorSimple";
import { withRouter } from "react-router-dom";

import "./Invites.scss";

function getStatus(int) {
  switch (int) {
    case 1:
      return <span className="label label-info">Pending</span>;
    case 2:
      return <span className="label label-success">Accepted</span>;
    case 3:
      return <span className="label label-danger">Rejected</span>;
    case 4:
      return <span className="label label-danger">Cancelled</span>;
    default:
      return <span className="label label-info">Pending</span>;
  }
}



class NetworksList extends Component {
  constructor(props) {
    super(props);

    this.inviteLocationMapping= {};
    this.state = {
      locations: [],
      userData: []
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
    this.inviteLocationMappingnetworkId] = location;
  }

  acceptInvitation = (inviteId) => {
    Meteor.call("acceptInvitation", inviteId, this.inviteLocationMappinginviteId] || "us-west-2");
  }

  rejectInvitation = (inviteId) => {
    Meteor.call("rejectInvitation", inviteId);
  }

  getActionStatus = (int, inviteId) => {
    switch (int) {
      case 2:
        return <span className="label label-success">Accepted</span>;
      case 3:
        return <span className="label label-danger">Rejected</span>;
      case 4:
        return <span className="label label-danger">Cancelled</span>;
      case 1:
      default:
      return (
          <span>
            <button type="button" className="btn btn-success" onClick={this.acceptInvitation(inviteId)}>
              <i className="fa fa-check" />&nbsp;Accept
            </button>&nbsp;&nbsp;
            <button type="button" className="btn btn-danger" onClick={this.rejectInvitation(inviteId)}>
              <i className="fa fa-close" />&nbsp;Reject
            </button>
          </span>
        );
    }
  }

  render() {
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
                          <th style={{ width: "%" }}>Select Location to deploy</th>
                        </tr>
                      </thead>
                      <tbody>
                        {this.props.receivedInvitations.map((item, index) => {
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
                                    <LocationSelector style={{width: '45%'}} locationChangeListener={this.locationChangeListener.bind(this, item._id)}/>
                                    &nbsp;&nbsp;
                                    {this.getActionStatus(item.invitationStatus, item._id)}
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
                          <th style={{ width: "50%" }}>Invite Sent to</th>
                          <th style={{ width: "25%" }}>Network</th>
                          <th style={{ width: "25%" }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {this.props.sentInvitations.map((item, index) => {
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
                              <td>{data.network.name}</td>
                              <td>{getStatus(item.invitationStatus)}</td>
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
})(withRouter(NetworksList));
