import React, { Component } from "react";
import { withTracker } from "meteor/react-meteor-data";
import { Networks } from "../../../collections/networks/networks.js";
import helpers from "../../../modules/helpers";
import { withRouter } from "react-router-dom";

import RazorPay from '../../components/Razorpay/Razorpay.jsx';

import "./Dashboard.scss";

class BillingDashboard extends Component {
  constructor(props) {
    super(props);

    this.state = {
      locations: [],
      bill: {},
      loading: true
    };
  }

  componentWillUnmount() {
    this.props.subscriptions.forEach(s => {
      s.stop();
    });
  }

  openNetwork = networkId => {
    this.props.history.push("/app/networks/" + networkId);
  };

  componentDidMount() {
    // Meteor.call("getClusterLocations", (err, res) => {
    //   this.setState({
    //     locations: res
    //   });
    // });
    this.updateBilling();
  }

  updateBilling() {
    const date = new Date();
    Meteor.call('fetchBilling', {userId: Meteor.userId(), month: date.getMonth(), year: date.getFullYear()}, (err, reply) => {
      this.setState({
        bill: reply,
        loading: false
      })
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

  convertCostToTag = (label) => {
    if(!label){
      return null;
    }
    return <span className="label label-info">{label}</span>;
  }

  render() {

    let billView = undefined;

    if(this.state.bill.networks) {
      billView = this.state.bill.networks.map((network, index) => {
        return (
          <tr title={network.timeperiod} key={index+1}>
            <td>{network.name}</td>
            <td>{network.instanceId}</td>
            <td>{network.rate}</td>
            <td>{network.runtime} hrs</td>
            <td>$ {network.cost} {this.convertCostToTag(network.label)} </td>
          </tr>
        )
      });
    }

    return (
      <div className="content networksList">
        <div className="m-t-20 container-fluid container-fixed-lg bg-white">
          <div className="row">
            <div className="col-lg-12">
              <div className="card card-transparent">
                <div className="card-header ">
                  <div className="card-title">Bill for the month</div>
                </div>
                <div className="card-block">
                  <div className="table-responsive">
                    <p>Free micro node usage: {this.state.bill.totalFreeMicroHours ? `${this.state.bill.totalFreeMicroHours.hours}:${this.state.bill.totalFreeMicroHours.minutes%60} `: '0'} / {1490 * 2} hrs</p>
                    <table className="table table-hover" id="basicTable">
                      <thead>
                        <tr>
                          <th style={{ width: "18%" }}>Network Name</th>
                          <th style={{ width: "15%" }}>Instance ID</th>
                          <th style={{ width: "15%" }}>Rate</th>
                          <th style={{ width: "18%" }}>Runtime</th>
                          <th style={{ width: "19%" }}>Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {billView}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="4" style={{textAlign: 'right'}}>Total Amount</td>
                          <td>{this.state.bill.totalAmount ? `$ ${this.state.bill.totalAmount.toFixed(2)}` : '0'}</td>
                        </tr>
                        <tr>
                        <td colSpan="4" style={{textAlign: 'right'}}>&nbsp;</td>
                          <td >{/* <RazorPay amountDisplay={`$ ${}`} /> */}</td>
                        </tr>
                      </tfoot>
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
    subscriptions: [Meteor.subscribe("networks")]
  };
})(withRouter(BillingDashboard));
