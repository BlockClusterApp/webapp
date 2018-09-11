import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';
import { withRouter } from 'react-router-dom';
import moment from 'moment';

import './Dashboard.scss';

class BillingDashboard extends Component {
  constructor(props) {
    super(props);

    this.state = {
      locations: [],
      bill: {},
      loading: true,
    };
  }

  componentWillUnmount() {
    this.props.subscriptions.forEach(s => {
      s.stop();
    });
  }

  openNetwork = networkId => {
    this.props.history.push('/app/networks/' + networkId);
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
    Meteor.call('fetchBilling', { userId: Meteor.userId(), month: date.getMonth(), year: date.getFullYear(), isFromFrontend: true }, (err, reply) => {
      this.setState({
        bill: reply,
        loading: false,
      });
    });
  }

  getLocationName = locationCode => {
    const locationConfig = this.state.locations.find(a => a.locationCode === locationCode);
    if (!locationConfig) {
      return undefined;
    }
    return locationConfig.locationName;
  };

  convertCostToTag = label => {
    if (!label) {
      return null;
    }
    return <span className="label label-info">{label}</span>;
  };

  onYearChange = (e) => {
    this.selectedYear = e.target.value;
  };

  onMonthChange = (e) => {
    this.selectedMonth = e.target.value;
  };

  showBill = () => {
    Meteor.call('fetchBilling', { userId: Meteor.userId(), month: this.selectedMonth, year: this.selectedYear, isFromFrontend: true }, (err, reply) => {
      this.setState({
        bill: reply,
        loading: false,
      });
    });
  }

  getInvoicePaidStatus = (paymentStatus) => {
    switch (Number(paymentStatus)) {
      case 2:
        return <span className="label label-success">Paid</span>;
      case 3:
        return <span className="label label-info">Demo User</span>;
      case 1:
      case 4:
        return <span className="label label-danger">Pending</span>;
      default:
        return null;
    }
  }

  render() {
    let billView = undefined;

    if (this.state.bill && this.state.bill.networks) {
      billView = this.state.bill.networks.map((network, index) => {
        return (
          <tr title={network.timeperiod} key={index + 1}>
            <td>{network.name}</td>
            <td>{network.instanceId}</td>
            <td>{network.rate}</td>
            <td>{network.runtime}</td>
            <td>
              $ {network.cost} {this.convertCostToTag(network.label)}{' '}
            </td>
          </tr>
        );
      });
    }

    return (
      <div className="content networksList">
        <div className="m-t-20  container-fluid container-fixed-lg bg-white">
          <div className="row">
            <div className="col-lg-12">
              <div className="card card-transparent">
                <div className="card-header ">
                  <div className="card-title">Bill for the month</div>
                </div>
                <div className="card-block">
                  <div className="table-responsive">
                    <div className="row">
                      <div className="col-md-5">
                        <p style={{"lineHeight": "45px"}}>
                          Free micro node usage:&nbsp;
                          {this.state.bill && this.state.bill.totalFreeMicroHours
                            ? `${this.state.bill.totalFreeMicroHours.hours}:${this.state.bill.totalFreeMicroHours.minutes % 60} `
                            : '0'}{' '}
                          / {1490 * 2} hrs
                        </p>
                      </div>
                      <div className="col-md-7">
                        <div className="row">
                          <div className="col-md-2" style={{textAlign: 'right'}}>
                            {this.getInvoicePaidStatus(this.state.bill && this.state.bill.invoiceStatus)}
                          </div>
                          <div className="col-md-4">
                            <div className="form-group ">
                              <select className="full-width select2-hidden-accessible" data-init-plugin="select2" tabIndex="-1" aria-hidden="true" onChange={this.onMonthChange}>
                                <option value="0" selected={moment().month() === 0}>January</option>
                                <option value="1" selected={moment().month() === 1}>February</option>
                                <option value="2" selected={moment().month() === 2}>March</option>
                                <option value="3" selected={moment().month() === 3}>April</option>
                                <option value="4" selected={moment().month() === 4}>May</option>
                                <option value="5" selected={moment().month() === 5}>June</option>
                                <option value="6" selected={moment().month() === 6}>July</option>
                                <option value="7" selected={moment().month() === 7}>August</option>
                                <option value="8" selected={moment().month() === 8}>September</option>
                                <option value="9" selected={moment().month() === 9}>October</option>
                                <option value="10" selected={moment().month() === 10}>November</option>
                                <option value="11" selected={moment().month() === 11}>December</option>
                              </select>
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="form-group ">
                              <select className="full-width select2-hidden-accessible" data-init-plugin="select2" tabIndex="-1" aria-hidden="true" onChange={this.onYearChange}>
                                <option value="2018" selected={moment().year() === 2018}>2018</option>
                              </select>
                            </div>
                          </div>
                          <div className="col-md-3">
                            <LaddaButton data-size={S} data-style={SLIDE_UP} data-spinner-size={30} data-spinner-lines={12} className="btn btn-success m-t-10" onClick={this.showBill} style={{marginTop: 0}}>
                                <i className="fa fa-check"></i> &nbsp;Select
                            </LaddaButton>
                          </div>
                        </div>
                      </div>
                    </div>
                    <table className="table table-hover" id="basicTable">
                      <thead>
                        <tr>
                          <th style={{ width: '18%' }}>Network Name</th>
                          <th style={{ width: '15%' }}>Instance ID</th>
                          <th style={{ width: '15%' }}>Rate</th>
                          <th style={{ width: '18%' }}>Runtime</th>
                          <th style={{ width: '19%' }}>Cost</th>
                        </tr>
                      </thead>
                      <tbody>{billView}</tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'right' }}>
                            Total Amount
                          </td>
                          <td>{this.state.bill && this.state.bill.totalAmount ? `$ ${Number(this.state.bill.totalAmount).toFixed(2)}` : '0'} {this.getInvoicePaidStatus(this.state.bill && this.state.bill.invoiceStatus)}</td>
                        </tr>
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'right' }}>
                            &nbsp;
                          </td>
                          <td>{/* <RazorPay amountDisplay={`$ ${}`} /> */}</td>
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
    subscriptions: [Meteor.subscribe('networks')],
  };
})(withRouter(BillingDashboard));
