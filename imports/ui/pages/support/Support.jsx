import React, { Component } from "react";
import SupportTickets from '../../../collections/support-ticket';
import { Networks } from '../../../collections/networks/networks';
import {withRouter} from 'react-router-dom'
import { withTracker } from 'meteor/react-meteor-data';
import helpers from '../../../modules/helpers';

import './Support.scss';

class Support extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    if(this.props.ticket) {
      const props = this.props;
      this.setState({
        network: Networks.find({_id: props.ticket && props.ticket.supportObject && props.ticket.supportObject.serviceType === 'network' && props.ticket.supportObject.serviceTypeId}).fetch()[0],
        createdBy: Meteor.users.find({_id: props.ticket && props.ticket.createdBy}).fetch()[0],
      });
    }
  }

  componentWillUnmount() {
    this.props.subscriptions.forEach(s => s.stop());
  }

  componentWillReceiveProps(props, oldProps) {
    if(props && props.ticket && props.ticket._id !== (oldProps.ticket && oldProps.ticket._id)){
      this.setState({
        network: Networks.find({_id: props.ticket && props.ticket.supportObject && props.ticket.supportObject.serviceType === 'network' && props.ticket.supportObject.serviceTypeId}).fetch()[0],
        createdBy: Meteor.users.find({_id: props.ticket && props.ticket.createdBy}).fetch()[0],
      });
    }
  }

  render() {
    const { ticket } = this.props;
    if(!ticket) {
      return null;
    }
    return (
      <div className="content support-details">
        <div className="m-t-20 container-fluid container-fixed-lg">
          <div className="row">
            <div className="col-lg-12 col-sm-12  d-flex flex-column">
            <div
                  className="card social-card share  full-width m-b-10 no-border"
                  data-social="item"
                >
                  <div className="card-header ">
                    <h3 className="text-primary pull-left">
                      Case Details
                    </h3>
                    {/* <div className="pull-right small hint-text">
                      Details <i className="fa fa-comment-o" />
                    </div> */}
                    <div className="clearfix" />
                  </div>
                  <div className="card-description">
                    <div className="row">
                      <div className="col-md-12 subject">
                        <span className="case-label">Subject:</span>&nbsp;{ticket.subject}
                      </div>
                      <div className="col-md-6">
                        <p><span className="case-label">Case ID:</span>&nbsp;{ticket.caseId}</p>
                        <p><span className="case-label">Status:</span>&nbsp;{helpers.getSupportTicketStatus(ticket.status)}</p>
                        <p><span className="case-label">Case Type:</span>&nbsp;{helpers.firstLetterCapital(ticket.ticketType)}</p>
                      </div>
                      <div className="col-md-6">
                        <p><span className="case-label">Created By:</span>&nbsp;{this.state.createdBy ? `${this.state.createdBy.emails[0].address}` : null}</p>
                        {
                          ticket.supportObject ? <p><span className="case-label">Category:</span>&nbsp;{ticket.supportObject.serviceType}</p> : null
                        }
                        {
                          ticket.supportObject ? <p><span className="case-label">{helpers.firstLetterCapital(ticket.supportObject.serviceType)}:</span>&nbsp;{ticket.supportObject.serviceType === 'network' ? `${this.state.network && this.state.network.name} - ${this.state.network && this.state.network.instanceId}`: null}</p> : null
                        }
                      </div>
                    </div>
                  </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

}

export default withTracker((props) => {
  return {
    ticket: SupportTickets.find({caseId: props.match.params.id}).fetch()[0],
    subscriptions: [Meteor.subscribe("support.caseId", props.match.params.id)]
  }
})(withRouter(Support));
