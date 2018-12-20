import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter } from 'react-router-dom';
import 'react-toggle/style.css';

class VoucherCreate extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {
    return (
      <div className="VoucherCreate">
        <div className="m-t-20 container-fluid container-fixed-lg bg-white">
          <div className="row">
            <div className="col-md-12">Create Paymeter Vouchers</div>
          </div>
          <div className="row">
            <div className="card-block" />
          </div>
        </div>
      </div>
    );
  }
}
export default withTracker(() => {
  return {};
})(withRouter(VoucherCreate));
