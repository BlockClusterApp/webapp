import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter } from 'react-router-dom';

class PaymeterPricing extends Component {
  render() {
    return <h1>Paymeter Pricing</h1>;
  }
}

export default withTracker(() => {
  return {};
})(withRouter(PaymeterPricing));
