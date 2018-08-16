import React, { Component } from "react";
import SupportTickets from "../../../collections/support-ticket";
import { Networks } from "../../../collections/networks/networks";
import { withRouter } from "react-router-dom";
import { withTracker } from "meteor/react-meteor-data";
import helpers from "../../../modules/helpers";
import LaddaButton, { S, SLIDE_UP } from "react-ladda";
import Conversation from './components/Conversation.jsx';
import "./Support.scss";


class Support extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    if (this.props.ticket) {
      const props = this.props;
      this.setState({
        network: Networks.find({
          _id:
            props.ticket &&
            props.ticket.supportObject &&
            props.ticket.supportObject.serviceType === "network" &&
            props.ticket.supportObject.serviceTypeId
        }).fetch()[0],
        createdBy: Meteor.users
          .find({ _id: props.ticket && props.ticket.createdBy })
          .fetch()[0]
      });
    }
  }

  componentWillUnmount() {
    this.props.subscriptions.forEach(s => s.stop());
  }

  componentWillReceiveProps(props, oldProps) {
    if (
      props &&
      props.ticket &&
      props.ticket._id !== (oldProps.ticket && oldProps.ticket._id)
    ) {
      this.setState({
        network: Networks.find({
          _id:
            props.ticket &&
            props.ticket.supportObject &&
            props.ticket.supportObject.serviceType === "network" &&
            props.ticket.supportObject.serviceTypeId
        }).fetch()[0],
        createdBy: Meteor.users
          .find({ _id: props.ticket && props.ticket.createdBy })
          .fetch()[0]
      });
    }
  }

  addCommentByUser = () => {
    if(!(this.description && this.description.value)) {
      return this.setState({
        descriptionError: 'Required'
      });
    }

    this.setState({
      loading: true,
      descriptionError: null
    });
    Meteor.call("addSupportTicketReplyByCustomer", {
      id: this.props.ticket._id,
      description: this.description.value
    }, (err, res) => {
      this.setState({
        loading: false
      });
      if(err) {
        this.setState({
          description: err.error
        });
      }
      this.description.value = '';
    });
  }

  closeTicket = () => {
    if (![4, 5, 6].includes(this.props.ticket.status) ){
      Meteor.call("closeTicketFromCustomer", this.props.ticket._id);
    } else {
      Meteor.call("reopenTicketFromCustomer", this.props.ticket._id);
    }
  }

  render() {
    const { ticket } = this.props;
    if (!ticket) {
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
                  <h3 className="text-primary pull-left">Case Details</h3>
                  <div className="pull-right">
                      <button className="btn btn-danger" onClick={this.closeTicket}>{[4, 5, 6].includes(ticket.status) ?'Reopen ticket' : 'Close Ticket'}</button>
                    </div>
                  <div className="clearfix" />
                </div>
                <div className="card-description">
                  <div className="row">
                    <div className="col-md-12 subject">
                      <span className="case-label">Subject:</span>
                      &nbsp;
                      {ticket.subject}
                    </div>
                    <div className="col-md-6">
                      <p>
                        <span className="case-label">Case ID:</span>
                        &nbsp;
                        #{ticket.caseId}
                      </p>
                      <p>
                        <span className="case-label">Status:</span>
                        &nbsp;
                        {helpers.getSupportTicketStatus(ticket.status)}
                      </p>
                      <p>
                        <span className="case-label">Case Type:</span>
                        &nbsp;
                        {helpers.firstLetterCapital(ticket.ticketType)}
                      </p>
                    </div>
                    <div className="col-md-6">
                      <p>
                        <span className="case-label">Created By:</span>
                        &nbsp;
                        {this.state.createdBy
                          ? `${this.state.createdBy.emails[0].address}`
                          : null}
                      </p>
                      {ticket.supportObject ? (
                        <p>
                          <span className="case-label">Category:</span>
                          &nbsp;
                          {ticket.supportObject.serviceType}
                        </p>
                      ) : null}
                      {ticket.supportObject ? (
                        <p>
                          <span className="case-label">
                            {helpers.firstLetterCapital(
                              ticket.supportObject.serviceType
                            )}
                            :
                          </span>
                          &nbsp;
                          {ticket.supportObject.serviceType === "network"
                            ? `${this.state.network &&
                                this.state.network.name} - ${this.state
                                .network && this.state.network.instanceId}`
                            : null}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
              <div
                className="card social-card share  full-width m-b-10 no-border"
                data-social="item"
              >
                <div className="card-header ">
                  <h3 className="text-primary pull-left">Correspondance</h3>
                  <div className="clearfix" />
                </div>
                <div className="card-description">
                  {![4, 5, 6].includes(ticket.status) && <div className="row">
                    <div className="form-group col-md-9">
                      <textarea type="text" className="form-control" ref={input => this.description = input} required style={{minHeight: '150px'}} description="Add Reply"/>
                      {this.state.descriptionError && <span className="form-error">{this.state.descriptionError}</span>}
                    </div>
                    <div className="col-md-3">
                      <LaddaButton
                        loading={this.state.loading}
                        data-size={S}
                        disabled={this.state.loading}
                        data-style={SLIDE_UP}
                        data-spinner-size={30}
                        data-spinner-lines={12}
                        className="btn btn-success"
                        onClick={this.addCommentByUser}
                        type="submit"
                        >
                        <i className="fa fa-plus-circle" aria-hidden="true"></i>&nbsp;&nbsp;Add Reply
                      </LaddaButton>
                    </div>
                  </div>}
                  {
                    ticket.history && ticket.history.sort((h1, h2) => (new Date(h2.createdAt).getTime()) - (new Date(h1.createdAt).getTime())).map((history, index) => {
                      return <Conversation key={`history_${index}`} isCustomerMessage={!history.isFromBlockcluster} message={history.description} extra={{time: history.createdAt}}/>
                    })
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withTracker(props => {
  return {
    ticket: SupportTickets.find({ caseId: props.match.params.id }).fetch()[0],
    subscriptions: [Meteor.subscribe("support.caseId", props.match.params.id)]
  };
})(withRouter(Support));
