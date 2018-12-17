import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter, Link, Route } from 'react-router-dom';

import HyperionionPricing from './components/HyperionPricing';
import PaymeterPricing from './components/PaymeterPricing';

class PricingDashboard extends Component {
  constructor(props) {
    super(props);

    this.state = {
      page: 0,
      invoices: [],
    };
  }

  changeChargeables(type) {}

  render() {
    return (
      <div className="content">
        <style>{'\
                .footer{\
                  display:none;\
                }\
              '}</style>
        <div className="full-height">
          <nav className="secondary-sidebar light" style={{ backgroundColor: 'rgb(251,251,251)' }}>
            <p className="menu-title">Pricing Dashboard</p>
            <ul className="main-menu">
              <li className="active">
                <Link to={'/app/admin/pricing/hyperion'}>
                  <span className="title">
                    <i className="fa fa-file" />
                    Hyperion
                  </span>
                </Link>
              </li>
              <li>
                <Link to={'/app/admin/pricing/paymeter'}>
                  <span className="title">
                    <i className="fa fa-cube" />
                    Paymeter
                  </span>
                </Link>
              </li>
            </ul>
          </nav>
          <div className="inner-content full-height">
            <Route exact path="/app/admin/pricing/paymeter" component={PaymeterPricing} />
            <Route exact path="/app/admin/pricing/hyperion" component={HyperionionPricing} />
          </div>
        </div>
      </div>
    );
  }
}

export default withTracker(() => {
  return {};
})(withRouter(PricingDashboard));
