import React, { Component } from "react";
import { withTracker } from "meteor/react-meteor-data";
import { Networks } from "../../../collections/networks/networks.js";
import helpers from "../../../modules/helpers";
import { withRouter } from "react-router-dom";

import "./Dashboard.scss";

class PaymentDashboard extends Component {
  constructor(props) {
    super(props);

    this.state = {
      locations: []
    };
  }

  componentWillUnmount() {
    this.props.subscriptions.forEach(s => {
      s.stop();
    });
  }

  componentDidMount() {
    Meteor.call("getClusterLocations", (err, res) => {
      this.setState({
        locations: res
      });
    });
  }

  getLocationName = locationCode => {
    const locationConfig = this.state.locations.find(
      a => a.locationCode === locationCode
    );
    if (!locationConfig) {
      return undefined;
    }
    return locationConfig.locationName;
  };

  render() {
    return (
      <div className="content networksList">
        <div className="m-t-20 container-fluid container-fixed-lg bg-white">
          <div className="row">
            <div className="col-lg-12">
              <div className="card card-transparent">
                <div className="card-header ">
                  <div className="card-title">Payments</div>
                </div>
                <div className="card-block">
                  <div className="table-responsive">
                    <table className="table table-hover" id="basicTable">
                      <thead>
                        <tr>
                          <th style={{ width: "30%" }}>Payment Ref.</th>
                          <th style={{ width: "20%" }}>Payment made on</th>
                          <th style={{ width: "25%" }}>Amount</th>
                          <th style={{ width: "25%" }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>

                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withTracker(() => {
  return {
    subscriptions: [Meteor.subscribe("approvedPayments")]
  };
})(withRouter(PaymentDashboard));
