import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter } from 'react-router-dom';

class HyperionPricing extends Component {
  render() {
    return <h1>Hyperion Pricing</h1>;
  }
}

export default withTracker(() => {
  return {};
})(withRouter(HyperionPricing));
