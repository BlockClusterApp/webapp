import React, { Component } from "react";
import CardsAndNewPayment from './components/CardsAndNewPayment.jsx';
import PaymentList from './components/PaymentList.jsx';

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
                  Saved Cards
                  </a>
                </li>
                <li className="nav-item">
                  <a
                    href="#"
                    data-toggle="tab"
                    role="tab"
                    data-target="#create"
                  >
                  Previous Payments
                  </a>
                </li>
              </ul>
              <div className="tab-content">
                <div className="tab-pane active" id="history">
                  <CardsAndNewPayment />
                </div>
                <div className="tab-pane " id="create">
                  <PaymentList />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default PaymentsContainer;
