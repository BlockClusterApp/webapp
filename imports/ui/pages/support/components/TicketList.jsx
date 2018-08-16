import React from 'react';
import SupportTickets from '../../../../collections/support-ticket';
import { withTracker } from "meteor/react-meteor-data";
import moment from 'moment';
import { withRouter } from 'react-router-dom';
import helpers from '../../../../modules/helpers';

const PAGE_LIMIT = 20;
class TicketList extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      page: 0
    };
  }

  openSupport = (id) => {
    this.props.history.push(`/app/support/${id}`);
  }

  render() {
    return (

      <div className="row padding-25 createTicket">
        <div className="card card-transparent">
      <div className="table-responsive">
          <table className="table table-hover" id="basicTable">
              <thead>
                  <tr>
                      <th style={{width: "5%"}}>S.No</th>
                      <th style={{width: "45%"}}>Subject</th>
                      <th style={{width: "15%"}}>Case ID</th>
                      <th style={{width: "15%"}}>Status</th>
                      <th style={{width: "20%"}}>Created At</th>
                  </tr>
              </thead>
              <tbody>
                {
                  this.props.tickets.sort((t1, t2) => new Date(t2.createdAt).getTime() - new Date(t1.createdAt).getTime()).map((ticket, index) => {
                    return (
                      <tr key={index+1} onClick={() => this.openSupport(ticket.caseId)} style={{cursor: 'pointer'}}>
                        <td>{this.state.page * PAGE_LIMIT + index+1}</td>
                        <td>{ticket.subject.substring(0, 50)}{ticket.subject.length > 70 ? '...': ''}</td>
                        <td>{ticket.caseId}</td>
                        <td>{helpers.getSupportTicketStatus(ticket.status)}</td>
                        <td>{moment(ticket.createdAt).format('DD-MMM-YYYY hh:mm:SS A')}</td>
                      </tr>
                    )
                  })
                }
              </tbody>
          </table>
      </div>
      </div>
      </div>
    )
  }
}

export default withTracker(() => {
  return {
    tickets: SupportTickets.find({}).fetch(),
    subscriptions: [
      Meteor.subscribe("support.user")
    ]
  }
})(withRouter(TicketList));
