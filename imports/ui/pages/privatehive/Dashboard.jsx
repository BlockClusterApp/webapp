import React, { Component } from 'react';
import { withRouter, Link, Redirect, Route } from 'react-router-dom';

import Create from './components/Create';

class PrivateHiveDashboard extends Component {
  constructor() {
    super();

    this.state = {};
  }

  render() {
    return (
      <div className="content ">
        <div className="container-fluid container-fixed-lg">
          <div className="row payments-container">
            {/* <div className="card card-borderless m-b-0 card-transparent">
              <h3 style={{ textTransform: 'uppercase' }}>Private Hive </h3>
            </div> */}
            <div className="card card-borderless card-transparent">
              <ul className="nav nav-tabs nav-tabs-linetriangle" role="tablist" data-init-reponsive-tabs="dropdownfx">
                <li className="nav-item">
                  <Link to="/app/privatehive/create" className={`${this.props.location.pathname === '/app/privatehive/create' ? 'active' : ''}`}>
                    Create
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/app/privatehive/networks" className={`${this.props.location.pathname === '/app/privatehive/networks' ? 'active' : ''}`}>
                    List
                  </Link>
                </li>
              </ul>
              <div className="tab-content">
                <div className="tab-pane active" id="history">
                  <Route exact path="/app/privatehive/" render={() => <Redirect to="/app/privatehive/create" />} />
                  <Route exact path="/app/privatehive/create" component={Create} />
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
