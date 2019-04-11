import React, { Component } from 'react';
import { withRouter, Link, Redirect, Route } from 'react-router-dom';

import Create from './components/Create';
import Join from './components/Join';
import Invite from './components/Invites';
import List from './components/List';

class PrivateHiveDashboard extends Component {
  constructor() {
    super();

    this.state = {};
  }

  render() {
    return (
      <div className="content ">
        <div className="m-t-20 container-fluid container-fixed-lg">
          <div className="row payments-container">
            {/* <div className="card card-borderless m-b-0 card-transparent">
              <h3 style={{ textTransform: 'uppercase' }}>Private Hive </h3>
            </div> */}
            <div className="card card-borderless card-transparent">
              <ul className="nav nav-tabs nav-tabs-linetriangle" role="tablist" data-init-reponsive-tabs="dropdownfx">
                <li className="nav-item">
                  <Link to="/app/privatehive/list" className={`${this.props.location.pathname === '/app/privatehive/list' ? 'active' : ''}`}>
                    List
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/app/privatehive/create" className={`${this.props.location.pathname === '/app/privatehive/create' ? 'active' : ''}`}>
                    Create
                  </Link>
                </li>
                {/* <li className="nav-item">
                  <Link to="/app/privatehive/join" className={`${this.props.location.pathname === '/app/privatehive/join' ? 'active' : ''}`}>
                    Join
                  </Link>
                </li> */}
                <li className="nav-item">
                  <Link to="/app/privatehive/invite" className={`${this.props.location.pathname === '/app/privatehive/invite' ? 'active' : ''}`}>
                    Invitations
                  </Link>
                </li>
              </ul>
              <div className="tab-content">
                <div className="tab-pane active" id="history">
                  <Route exact path="/app/privatehive/" render={() => <Redirect to="/app/privatehive/list" />} />
                  <Route exact path="/app/privatehive/create" component={Create} />
                  <Route exact path="/app/privatehive/join" component={Join} />
                  <Route exact path="/app/privatehive/invite" component={Invite} />
                  <Route exact path="/app/privatehive/list" component={List} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(props => <PrivateHiveDashboard {...props} />);
