import React, { Component } from 'react';
import SupportTickets from '../../../../collections/support-ticket';
import { Networks } from '../../../../collections/networks/networks';
import { withRouter, Link } from 'react-router-dom';
import { withTracker } from 'meteor/react-meteor-data';
import helpers from '../../../../modules/helpers';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';
import Conversation from '../../support/components/Conversation.jsx';

class Support extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    this.subscriptions = [
      Meteor.subscribe('support.id', this.props.match.params.id, {
        onReady: () => {
          const support = SupportTickets.find({ _id: this.props.match.params.id }).fetch()[0];
          const user = Meteor.users
            .find({
              _id: support.createdBy,
            })
            .fetch()[0];
          const network = Networks.find({
            _id: support.serviceType === 'network' && support.serviceTypeId,
          }).fetch()[0];

          this.setState({
            createdBy: user,
            network,
          });
        },
      }),
    ];
  }

  componentWillUnmount() {
    this.subscriptions.forEach(s => s.stop());
  }

  addCommentByUser = () => {
    if (!(this.description && this.description.value)) {
      return this.setState({
        descriptionError: 'Required',
      });
    }

    this.setState({
      loading: true,
      descriptionError: null,
    });
    Meteor.call(
      'addSupportBlockclusterReply',
      {
        id: this.props.ticket._id,
        description: this.description.value,
      },
      (err, res) => {
        this.setState({
          loading: false,
        });
        if (err) {
          this.setState({
            description: err.error,
          });
        }
        this.description.value = '';
      }
    );
  };

  closeTicket = () => {
    if (![4, 5, 6].includes(this.props.ticket.status)) {
      Meteor.call('closeTicketByAdmin', this.props.ticket._id);
    } else {
      Meteor.call('reopenTicketByAdmin', this.props.ticket._id);
    }
  };

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
              <div className="card social-card share  full-width m-b-10 no-border" data-social="item">
                <div className="card-header ">
                  <h3 className="text-primary pull-left">Case Details</h3>
                  {/* <div className="pull-right small hint-text">
                      Details <i className="fa fa-comment-o" />
                    </div> */}
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
                        &nbsp; #{ticket.caseId}
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
                        {this.state.createdBy ? <Link to={`/app/admin/users/${this.state.createdBy._id}`}>{this.state.createdBy.emails[0].address}</Link> : null}
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
                          <span className="case-label">{helpers.firstLetterCapital(ticket.supportObject.serviceType)}:</span>
                          &nbsp;
                          {ticket.supportObject.serviceType === 'network'
                            ? `${this.state.network && this.state.network.name} - ${this.state.network && this.state.network.instanceId}`
                            : null}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
              <div className="card social-card share  full-width m-b-10 no-border" data-social="item">
                <div className="card-header ">
                  <h3 className="text-primary pull-left">Correspondance</h3>
                  <div className="pull-right">
                    <button className="btn btn-danger" onClick={this.closeTicket}>
                      {[4, 5, 6].includes(ticket.status) ? 'Reopen ticket' : 'Close Ticket'}
                    </button>
                  </div>
                  <div className="clearfix" />
                </div>
                <div className="card-description">
                  {![4, 5, 6].includes(ticket.status) && (
                    <div className="row">
                      <div className="form-group col-md-9">
                        <textarea type="text" className="form-control" ref={input => (this.description = input)} required style={{ minHeight: '150px' }} description="Add Reply" />
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
                          <i className="fa fa-plus-circle" aria-hidden="true" />
                          &nbsp;&nbsp;Add Reply
                        </LaddaButton>
                      </div>
                    </div>
                  )}
                  {ticket.history &&
                    ticket.history
                      .sort((h1, h2) => new Date(h2.createdAt).getTime() - new Date(h1.createdAt).getTime())
                      .map((history, index) => {
                        return (
                          <Conversation
                            key={`history_${index}`}
                            isCustomerMessage={!history.isFromBlockcluster}
                            message={history.description}
                            extra={{ time: history.createdAt }}
                          />
                        );
                      })}
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
    ticket: SupportTickets.find({ _id: props.match.params.id }).fetch()[0],
  };
})(withRouter(Support));
