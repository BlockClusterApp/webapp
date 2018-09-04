import React, { Component } from "react";
import { withTracker } from "meteor/react-meteor-data";
import CreateTicket from './components/CreateTicket';
import TicketList from './components/TicketList';

class SupportContainer extends Component {
  constructor() {
    super();

    this.state = {};
  }

  render() {
    return (
      <div className="content ">
        <div className="m-t-20 container-fluid ontainer-fixed-lg">
          <div className="row supportTickets">
            <div className="card card-borderless card-transparent">
              <ul
                className="nav nav-tabs nav-tabs-linetriangle"
                role="tablist"
                data-init-reponsive-tabs="dropdownfx"
              >
                <li className="nav-item">
                  <a
                    className="active"
                    data-toggle="tab"
                    role="tab"
                    data-target="#history"
                    href="#"
                  >
                  Ticket History
                  </a>
                </li>
                <li className="nav-item">
                  <a
                    href="#"
                    data-toggle="tab"
                    role="tab"
                    data-target="#create"
                  >
                  Create Ticket
                  </a>
                </li>
              </ul>
              <div className="tab-content">
                <div className="tab-pane active" id="history">
                  <TicketList />
                </div>
                <div className="tab-pane " id="create">
                  <CreateTicket />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default SupportContainer;
