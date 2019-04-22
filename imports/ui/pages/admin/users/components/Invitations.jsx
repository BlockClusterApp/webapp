import React from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter, Link } from 'react-router-dom';
import moment from 'moment';

import { UserInvitation } from '../../../../../collections/user-invitation';

class Invitations extends React.Component {
  getInvitationStatus = (int, inviteId, resendCount) => {
    switch (int) {
      case 2:
        return <span className="label label-success">Accepted</span>;
      case 3:
        return <span className="label label-danger">Rejected</span>;
      case 4:
        return <span className="label label-warn">Cancelled</span>;
      default:
        return <span className="label label-info">Pending</span>;
    }
  };

  render() {
    const { invitations } = this.props;
    return (
      <div className="row">
        <div className="col-lg-12 m-b-10 d-flex">
          <div className=" card no-border card-condensed no-margin widget-loader-circle align-self-stretch d-flex flex-column">
            <div className="padding-25">
              <div className="pull-left">
                <h2 className="text-success no-margin">Invitations</h2>
                <p className="no-margin">Invitation History</p>
              </div>
              <h3 className="pull-right semi-bold">{invitations && invitations.length}</h3>
              <div className="clearfix" />
            </div>
            <div className="auto-overflow -table" style={{ maxHeight: '275px' }}>
              <table className="table table-condensed table-hover">
                <tbody>
                  {invitations &&
                    invitations.map((invitation, index) => {
                      const data = invitation.metadata;
                      return (
                        <tr key={index + 1}>
                          <td className="font-montserrat fs-12 w-20" title={data.network.name}>
                            <Link to={`/app/admin/networks/${invitation.networkId}`}>{data.network.name}</Link>
                          </td>
                          <td className="text-right b-r b-dashed b-grey w-20" title={data.inviteTo.name | data.inviteTo.email}>
                            <Link to={`/app/admin/users/${invitation.inviteTo}`}>{data.inviteTo.email}</Link>
                          </td>
                          <td className="w-20">{invitation.type}</td>
                          <td className="w-20">
                            <span className="font-montserrat fs-12">{this.getInvitationStatus(invitation.invitationStatus)}</span>
                          </td>
                          <td className="w-20">
                            <span className="font-montserrat fs-12">{moment(invitation.createdAt).format('DD-MMM-YY')}</span>
                          </td>
                        </tr>
                      );
                    })}
                  {!invitations && (
                    <tr>
                      <td className="font-montserrat fs-12 w-100">No Invitations sent out yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withTracker(props => {
  return {
    invitations: UserInvitation.find({ userId: props.match.params.id }).fetch(),
    subscriptions: [Meteor.subscribe('user.details.userInvitations', { userId: props.match.params.id })],
  };
})(withRouter(Invitations));
