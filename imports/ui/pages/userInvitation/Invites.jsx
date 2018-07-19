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



class Invites extends Component {
  constructor(props) {
    super(props);

    this.inviteLocationMapping= {};
    this.loading = {};
    this.state = {
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
  }

  acceptInvitation = (inviteId) => {
    const loading = this.state.loading;
    loading[inviteId] = true;
    this.setState({
      loading
    });
    if(!this.loading[inviteId]){
      Meteor.call("acceptInvitation", inviteId, this.inviteLocationMapping[inviteId] || "us-west-2", () => {
        this.loading[inviteId] = false;
        const loading = this.state.loading;
        loading[inviteId] = false;
        this.setState({
          loading
        });
      }); 
    }
    this.loading[inviteId] = loading;
  }

  rejectInvitation = (inviteId) => {
    const loading = this.state.loading;
    loading[inviteId] = true;
    this.setState({
      loading
    });
    if(!this.loading[inviteId]){
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
  }

  getLocationName = (locationCode) => {
		const locationConfig = this.state.locations.find(a => a.locationCode === locationCode);
		if(!locationConfig) {
			return undefined;
		}
		return locationConfig.locationName
	}

  getActionStatus = (int, inviteId) => {
    switch (int) {
      case 2:
        return <button className="btn btn-success" disabled>Accepted</button>;
      case 3:
        return <button className="btn btn-danger" disabled>Rejected</button>;
      case 4:
        return <button className="btn btn-warn">Cancelled</button>;
      case 1:
      default:
      return (
          <span>
            <button type="button" className="btn btn-success" onClick={this.acceptInvitation.bind(this, inviteId)} disabled={this.state.loading[inviteId] === true}>
              {this.state.loading[inviteId] === true ? <i className="fa fa-spinner fa-spin"></i> : <i className="fa fa-check" />}&nbsp;Accept
            </button>&nbsp;&nbsp;
            <button type="button" className="btn btn-danger" onClick={this.rejectInvitation.bind(this, inviteId)} disabled={this.state.loading[inviteId] === true}>
              {this.state.loading[inviteId] === true ? <i className="fa fa-spinner fa-spin"></i> : <i className="fa fa-close" />}&nbsp;Reject
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
                                    {item.invitationStatus === 1 ? 
                                      <LocationSelector style={{width: '45%'}} locationChangeListener={this.locationChangeListener.bind(this, item._id)}/> :
                                      <input className="form-control" value={this.getLocationName(item.joinedLocation)} disabled type="text" style={{width: '50%'}} />
                                    }
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
                          <th style={{ width: "35%" }}>Invite Sent to</th>
                          <th style={{width: '25%'}}>Invited On </th>
                          <th style={{ width: "20%" }}>Network</th>
                          <th style={{ width: "20%" }}>Status</th>
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
                              <td>{new Date(item.createdAt).toLocaleDateString("en-US", {year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric'})}</td>
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
})(withRouter(Invites));
