import React, { Component } from 'react';
import { withRouter, Link, Route, Redirect } from 'react-router-dom';

import CardsAndNewPayment from './components/CardsAndNewPayment.jsx';
import PaymentList from './components/PaymentList.jsx';
import RedemptionHistory from './components/RedemptionHistory.jsx';

class PaymentsContainer extends Component {
  constructor() {
    super();

    this.state = {};
  }

  render() {
    return (
      <div className="content ">
        <div className="m-t-20 container-fluid container-fixed-lg">
          <div className="row payments-container">
            <div className="card card-borderless card-transparent">
              <ul className="nav nav-tabs nav-tabs-linetriangle" role="tablist" data-init-reponsive-tabs="dropdownfx">
                <li className="nav-item">
                  <Link to="/app/payments/cards" className={`${this.props.location.pathname === '/app/payments/cards' ? 'active' : ''}`}>
                    Saved Cards
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/app/payments/history" className={`${this.props.location.pathname === '/app/payments/history' ? 'active' : ''}`}>
                    Previous Payments
                  </Link>
                </li>

                <li className="nav-item">
                  <Link to="/app/payments/credits" className={`${this.props.location.pathname === '/app/payments/credits' ? 'active' : ''}`}>
                    Credits Redemption History
                  </Link>
                </li>
              </ul>
              <div className="tab-content">
                <div className="tab-pane active" id="history">
                  <Route exact path="/app/payments/" render={() => <Redirect to="/app/payments/cards" />} />
                  <Route exact path="/app/payments/cards" component={CardsAndNewPayment} />
                  <Route exact path="/app/payments/history" component={PaymentList} />
                  <Route exact path="/app/payments/credits" component={RedemptionHistory} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(props => <PaymentsContainer {...props} />);
