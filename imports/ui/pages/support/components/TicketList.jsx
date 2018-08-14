import React from 'react';
import SupportTickets from '../../../../collections/support-ticket';
import { withTracker } from "meteor/react-meteor-data";

class TicketList extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {
    return <p>Hello Ticket list</p>
  }
}

export default withTracker(() => {
  return {
    tickets: SupportTickets.find({}).fetch(),
    subscriptions: [
      Meteor.subscribe("support.user")
    ]
  }
})(TicketList);
