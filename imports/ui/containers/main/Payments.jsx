import React, { Component } from 'react';
import { Meteor } from 'meteor/meteor';
import { BrowserRouter, Route, Switch, Redirect } from 'react-router-dom';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter } from 'react-router-dom';

import StripeCheckout from '../../pages/payments/StripeCheckout';

export default withRouter(
  class Payments extends Component {
    constructor(props) {
      super(props);
      this.state = {};
    }

    render() {
      return (
        <div style={{ background: 'linear-gradient(-135deg, rgb(0, 166, 255), rgb(0, 66, 134))' }} className="full-height">
          <div className="page-container">
            <Route path="/payments" component={StripeCheckout} />
          </div>
        </div>
      );
    }
  }
);
