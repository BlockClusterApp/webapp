import React, { Component } from "react";
import { withTracker } from "meteor/react-meteor-data";
import { withRouter } from "react-router-dom";
import notifications from "../../../../modules/notifications";
import LaddaButton, { S, SLIDE_UP } from "react-ladda";
import Toggle from "react-toggle";
import "react-toggle/style.css";

import moment from "moment";

class VoucherCreate extends Component {
  constructor(props) {
    super(props);

    this.state = {
      noOfVouchers: 1,
      cpu: "",
      disk: "",
      ram: "",
      voucher_code_size:6,
      for_all: true,
      recurring: false,
      no_months: "",
      email_ids: "",
      discount_amt: 0,
      is_percent: false,
      expiry_date: "",
      discountedDays: 0,
      isDiskChangeable: false,
      voucher_status: false,
      once_per_user:true,
      no_times_per_user:5,
      card_vfctn_needed:true
    };
  }

  createVoucher = e => {
    payload = this.state;
    const _doc_voucher = {
      noOfVouchers: payload.noOfVouchers,
      voucher_code_size:payload.voucher_code_size,
      usablity: {
        recurring: payload.recurring ,
        no_months: payload.no_months || 0,
        once_per_user:payload.once_per_user ,
        no_times_per_user:payload.no_times_per_user || 1
      },
      availability: {
        card_vfctn_needed:payload.card_vfctn_needed ,
        for_all: payload.for_all ,
        email_ids: payload.email_ids ? payload.email_ids.split(",") : []
      },
      discount: {
        value: payload.discount_amt || 0,
        percent: payload.is_percent 
      },
      networkConfig: { cpu: payload.cpu, disk: payload.disk, ram: payload.ram },
      expiryDate:
        payload.expiry_date ||
        moment()
          .add(30, "days")
          .toDate(), //lets take by default 30days
      isDiskChangeable: payload.isDiskChangeable ,
      discountedDays: payload.discountedDays || 0
    };
    this.setState({
      createVoucher_formSubmitError: "",
      createVoucher_formloading: true
    });
    Meteor.call("CreateVoucher", _doc_voucher, (error, done) => {
      console.log(error, done);
      if (!error) {
        this.setState({
          ["createVoucher_formloading"]: false,
          ["createVoucher_formSubmitError"]: ""
        });

        notifications.success("Vouchers Created!");
      } else {
        this.setState({
          ["createVoucher_formloading"]: false,
          ["createVoucher_formSubmitError"]: error.reason
        });
        notifications.error(error.reason);
      }
    });
  };

  handleChanges = e => {
    this.setState({
      [e.target.name]: e.target.value
    });
  };
  handleChangesToggle = e => {
    this.setState({
      [e.target.name]: e.target.checked
    });
  };

  render() {
    return (
      <div className="content VoucherCreate">
        <div className="m-t-20 container-fluid container-fixed-lg bg-white">
          <div className="row">
            <div className="card-block">
              <div className="form-group">
                <div className="row">
                  <div className="col-md-4 form-input-group">
                  <label>No of Vouchers</label>
                    <input
                      name="noOfVouchers"
                      type="number"
                      placeholder="e.g 10"
                      className="form-control"
                      onChange={this.handleChanges.bind(this)}
                      required
                      // value={this.state.networkConfig.cpu}
                    />
                  </div>
                  <div className="col-md-4 form-input-group">
                    <label>Size Of Voucher Code</label>
                    <span className="help"> e.g. "HI12JG" Size 6 </span>
                    <input
                      name="voucher_code_size"
                      type="number"
                      placeholder="e.g 6"
                      className="form-control"
                      onChange={this.handleChanges.bind(this)}
                      value={this.state.voucher_code_size}
                      required
                      // value={this.state.networkConfig.cpu}
                    />
                  </div>
                </div>
                <br />
                <label>Network Configuration </label>
                <div className="row">
                  <div className="col-md-4 form-input-group">
                    <label>CPU</label>
                    <input
                      name="cpu"
                      type="number"
                      placeholder="e.g 0.5 vCPU"
                      className="form-control"
                      onChange={this.handleChanges.bind(this)}
                      required
                      // value={this.state.networkConfig.cpu}
                    />
                  </div>
                  <div className="col-md-4 form-input-group">
                    <label>RAM</label>
                    <input
                      name="ram"
                      type="number"
                      placeholder="e.g 1 GB"
                      className="form-control"
                      onChange={this.handleChanges.bind(this)}
                      required
                      // value={this.state.networkConfig.ram}
                    />
                  </div>
                  <div className="col-md-4 form-input-group">
                    <label>DISK</label>
                    <input
                      name="disk"
                      type="number"
                      placeholder="e.g 5 GB"
                      className="form-control"
                      onChange={this.handleChanges.bind(this)}
                      required
                      // value={this.state.networkConfig.disk}
                    />
                  </div>
                </div>
                <br />
                <label>Usability</label>
                <div className="row">
                  <div className="col-md-2 form-input-group">
                    <label>Is Recurring</label>
                    <Toggle
                      name="recurring"
                      className="form-control"
                      icons={false}
                      checked={this.state.recurring}
                      onChange={this.handleChangesToggle.bind(this)}
                    />
                  </div>
                  {this.state.recurring == true && (
                    <div className="col-md-3 form-input-group">
                      <label>Number Of Months</label>
                      <input
                        name="no_months"
                        type="number"
                        placeholder="e.g 3"
                        className="form-control"
                        onChange={this.handleChanges.bind(this)}
                        value={this.state.no_months}
                        required
                      />
                    </div>
                  )}
                  <div className="col-md-4 form-input-group">
                    <label>Once Per User</label>
                    <span className="help"> e.g {this.state.once_per_user ? "once" : "multiple times"} per user</span>
                    <Toggle
                      name="once_per_user"
                      className="form-control"
                      icons={false}
                      checked={this.state.once_per_user}
                      onChange={this.handleChangesToggle.bind(this)}
                    />
                  </div>
                  { this.state.once_per_user == false &&(
                    <div className="col-md-3 form-input-group">
                    <label>Number Of Times</label>
                    <span className="help"> e.g voucher will be applicable for user {this.state.no_times_per_user} times.</span>
                    <input
                      name="no_times_per_user"
                      type="number"
                      placeholder="e.g 3"
                      className="form-control"
                      onChange={this.handleChanges.bind(this)}
                      value={this.state.no_times_per_user}
                      required
                    />
                  </div>
                  )}
                </div>
                <br />
                <label>Availability</label>
                <div className="row">
                  <div className="col-md-3 form-input-group">
                    <label>For Everyone</label>
                    <Toggle
                      name="for_all"
                      className="form-control"
                      icons={false}
                      checked={this.state.for_all}
                      onChange={this.handleChangesToggle.bind(this)}
                    />
                  </div>
                  {this.state.for_all == false && (
                    <div className="col-md-3 form-input-group">
                      <label>Email Ids</label>
                      <input
                        name="email_ids"
                        type="text"
                        placeholder="Comma ( , ) seperated"
                        className="form-control"
                        onChange={this.handleChanges.bind(this)}
                        value={this.state.email_ids}
                        required
                      />
                    </div>
                  )}
                   <div className="col-md-3 form-input-group">
                    <label>Card Verification Needed</label>
                    <span className="help">  card verification needed to use this voucher(s).</span>
                    <Toggle
                      name="card_vfctn_needed"
                      className="form-control"
                      icons={false}
                      checked={this.state.card_vfctn_needed}
                      onChange={this.handleChangesToggle.bind(this)}
                    />
                  </div>
                </div>
                <br />
                <label>Discounts</label>
                <div className="row">
                  <div className="col-md-4 form-input-group">
                    <label>Discount in Percentage</label>
                    <Toggle
                      name="is_percent"
                      className="form-control"
                      icons={false}
                      checked={this.state.is_percent}
                      onChange={this.handleChangesToggle.bind(this)}
                    />
                  </div>
                  <div className="col-md-3 form-input-group">
                    <label>Discount Amount ({this.state.is_percent ? "percentage" :"Flat Amount" })</label>
                    <input
                      name="discount_amt"
                      type="number"
                      placeholder={this.state.is_percent ? "50 %" : "50 USD"}
                      className="form-control"
                      onChange={this.handleChanges.bind(this)}
                      required
                    />
                  </div>
                  <div className="col-md-4 form-input-group" align="right">
                    <label>Discounted Days</label>
                    <input
                      name="discountedDays"
                      type="number"
                      className="form-control"
                      onChange={this.handleChanges.bind(this)}
                      value={this.state.discountedDays}
                    />
                  </div>
                </div>
                <br />
                <label>Others</label>
                <div className="row">
                  <div className="col-md-4 form-input-group">
                    <label>Expiry Date</label>
                    <input
                      name="expiry_date"
                      type="date"
                      className="form-control"
                      onChange={this.handleChanges.bind(this)}
                      required
                    />
                  </div>
                  <div className="col-md-4 form-input-group">
                    <label>Changeable Disk</label>
                    <Toggle
                      name="isDiskChangeable"
                      className="form-control"
                      icons={false}
                      checked={this.state.isDiskChangeable}
                      onChange={this.handleChangesToggle.bind(this)}
                    />
                  </div>
                  <div className="col-md-4 form-input-group">
                    <label>Voucher Status</label>
                    <Toggle
                      name="voucher_status"
                      className="form-control"
                      icons={false}
                      checked={this.state.voucher_status}
                      onChange={this.handleChangesToggle.bind(this)}
                    />
                  </div>
                </div>
              </div>
              <LaddaButton
                // loading={this.state[this.props.network[0].instanceId + "_createStream_formloading"]}
                data-size={S}
                data-style={SLIDE_UP}
                data-spinner-size={30}
                data-spinner-lines={12}
                className="btn btn-success m-t-10"
                onClick={this.createVoucher.bind(this)}
              >
                <i className="fa fa-plus-circle" aria-hidden="true" />
                &nbsp;&nbsp;Create
              </LaddaButton>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
export default withTracker(() => {
  return {
    subscriptions: [Meteor.subscribe("vouchers.all", { page: 0 })]
  };
})(withRouter(VoucherCreate));
