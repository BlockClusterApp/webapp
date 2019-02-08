import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';
import { withRouter } from 'react-router-dom';
import notifications from '../../../modules/notifications';
import moment from 'moment';

const html2pdf = require('html2pdf.js');

import './Dashboard.scss';

class BillingDashboard extends Component {
  constructor(props) {
    super(props);

    this.state = {
      locations: [],
      bill: {
        totalAmount: 0,
        totals: {
          dynamo: 0,
          privatehive: 0,
          hyperion: 0,
          paymeter: 0,
          credits: 0,
        },
        creditClaims: [],
        dynamos: [],
        privateHives: [],
        hyperions: [],
        paymeters: [],
      },
      expand: {
        dynamo: false,
        privatehive: false,
        hyperion: false,
        paymeter: false,
        credits: false,
      },
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

  onYearChange = e => {
    this.selectedYear = e.target.value;
  };

  onMonthChange = e => {
    this.selectedMonth = e.target.value;
  };

  toggleSection = sectionName => {
    const { expand } = this.state;
    expand[sectionName] = !expand[sectionName];
    this.setState({ expand });
  };

  showBill = () => {
    this.setState({
      loading: true,
    });
    Meteor.call('fetchBilling', { userId: Meteor.userId(), month: this.selectedMonth, year: this.selectedYear, isFromFrontend: true }, (err, reply) => {
      this.setState({
        loading: false,
      });
      if (!reply.totals) {
        reply.totals = {};
      }
      if (!reply) {
        return notifications.error('Internal Error');
      }
      this.setState({
        bill: reply,
      });
    });
  };

  downloadInvoice = () => {
    this.setState({
      downloading: true,
    });
    Meteor.call('generateInvoiceHTML', this.state.bill.invoiceId, (err, res) => {
      if (err) {
        RavenLogger.log('Generate Invoice HTML err', {
          invoice: this.props.invoice._id,
          res,
        });
        alert('Error downloading', err.reason);
        this.setState({
          downloading: false,
        });
        return false;
      }

      // debugger;
      // html2pdf().from(res).set({jsPDF:{ unit: 'in', format: 'a4', orientation: 'portrait' }, margin: [0, 0]}).save();
      this.setState({
        downloading: false,
      });
      //       let pdfWindow = window.open("")
      // pdfWindow.document.write("<iframe width='100%' height='100%' src='data:application/pdf;base64, " + encodeURI(res)+"'></iframe>")
      // window.open("data:application/octet-stream;charset=utf-16le;base64,"+encodeURI(res));
      let a = document.createElement('a');
      a.href = 'data:application/octet-stream;base64,' + res;
      a.download = `BlockclusterBill-${this.state.bill.invoiceId}.pdf`;
      a.click();
    });
  };

  getInvoicePaidStatus = paymentStatus => {
    switch (Number(paymentStatus)) {
      case 2:
        return <span className="label label-success">Paid</span>;
      case 3:
        return <span className="label label-info">Demo User</span>;
      case 1:
      case 4:
        return <span className="label label-danger">Unpaid</span>;
      case 6:
        return <span className="label label-info">Refunded</span>;
      default:
        return null;
    }
  };

  render() {
    let { bill } = this.state;

    const { dynamos, privateHives, hyperions, paymeters, creditClaims, networks } = bill;

    const dynamoView = dynamos.map((network, index) => {
      return (
        <tr title={network.timeperiod} key={index + 1}>
          <td>{network.name}</td>
          <td>{network.instanceId}</td>
          <td>{network.rate}</td>
          <td>{network.runtime}</td>
          <td>
            $ {network.cost} {network.deletedAt ? '' : this.convertCostToTag('Running')} {this.convertCostToTag(network.label)}{' '}
          </td>
        </tr>
      );
    });

    const privateHiveView = privateHives.map((network, index) => {
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

    const hyperionView = hyperions.map((hyperion, index) => {
      return (
        <tr key={index + 1}>
          <td>{hyperion.name}</td>
          <td>{hyperion.rate}</td>
          <td>$ {hyperion.cost}</td>
        </tr>
      );
    });

    const paymeterView = paymeters.map((pm, index) => {
      return (
        <tr key={index + 1}>
          <td>{pm.name}</td>
          <td>{pm.rate}</td>
          <td>$ {pm.cost}</td>
        </tr>
      );
    });

    let creditsView = creditClaims.map((claim, index) => {
      return (
        <tr key={`p${index + 1}`}>
          <td>{claim.instanceId}</td>
          <td>{claim.rate}</td>
          <td>$ -{Number(claim.cost).toFixed(2)}</td>
        </tr>
      );
    });
    let billView = undefined;

    if (networks) {
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

      if (this.state.bill && this.state.bill.creditClaims) {
        creditsView = this.state.bill.creditClaims.map((claim, index) => {
          return (
            <tr key={`p${index + 1}`}>
              <td>Promotional Credit Redemption</td>
              <td>{claim.code}</td>
              <td />
              <td />
              <td>$ -{Number(claim.amount).toFixed(2)}</td>
            </tr>
          );
        });
      }
    }

    const commonView = (
      <div className="row">
        <div className="col-md-3">
          <div className="form-group ">
            <select className="full-width select2-hidden-accessible" data-init-plugin="select2" tabIndex="-1" aria-hidden="true" onChange={this.onMonthChange}>
              <option value="0" selected={moment().month() === 0}>
                January
              </option>
              <option value="1" selected={moment().month() === 1}>
                February
              </option>
              <option value="2" selected={moment().month() === 2}>
                March
              </option>
              <option value="3" selected={moment().month() === 3}>
                April
              </option>
              <option value="4" selected={moment().month() === 4}>
                May
              </option>
              <option value="5" selected={moment().month() === 5}>
                June
              </option>
              <option value="6" selected={moment().month() === 6}>
                July
              </option>
              <option value="7" selected={moment().month() === 7}>
                August
              </option>
              <option value="8" selected={moment().month() === 8}>
                September
              </option>
              <option value="9" selected={moment().month() === 9}>
                October
              </option>
              <option value="10" selected={moment().month() === 10}>
                November
              </option>
              <option value="11" selected={moment().month() === 11}>
                December
              </option>
            </select>
          </div>
        </div>
        <div className="col-md-2">
          <div className="form-group ">
            <select className="full-width select2-hidden-accessible" data-init-plugin="select2" tabIndex="-1" aria-hidden="true" onChange={this.onYearChange}>
              <option value="2018" selected={moment().year() === 2018}>
                2018
              </option>
              <option value="2019" selected={moment().year() === 2019}>
                2019
              </option>
            </select>
          </div>
        </div>
        <div className="col-md-7">
          <LaddaButton
            data-size={S}
            data-style={SLIDE_UP}
            data-spinner-size={30}
            data-spinner-lines={12}
            loading={this.state.loading}
            className="btn btn-success m-t-10"
            onClick={this.showBill}
            style={{ marginTop: 0 }}
          >
            <i className="fa fa-check" /> &nbsp;Select
          </LaddaButton>
          {this.state.bill && this.state.bill.invoiceStatus && (
            <span>
              &nbsp;&nbsp;
              <button className="btn btn-primary" disabled={this.state.downloading} onClick={this.downloadInvoice}>
                {this.state.downloading && <i className="fa fa-spinner fa-spin" />}Download Invoice
              </button>
              &nbsp;
              {this.state.bill && this.state.bill.invoiceStatus === 1 && (
                <button
                  className="btn btn-success"
                  onClick={() => {
                    this.props.history.push('/app/payments');
                  }}
                >
                  Pay Now
                </button>
              )}
            </span>
          )}
        </div>
      </div>
    );

    return (
      <div className="content billingList">
        <div className="m-t-20  container-fluid container-fixed-lg bg-white">
          <div className="row">
            <div className="col-lg-12">
              <div className="card card-transparent">
                <div className="card-header ">
                  <div className="card-title">Bill for the month</div>
                </div>
                <div className="card-block">
                  <div className="table-responsive">
                    {commonView}
                    {networks || this.state.bill.notGenerated ? (
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
                        <tbody>
                          {billView}
                          {creditsView}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan="4" style={{ textAlign: 'right' }}>
                              Total Amount
                            </td>
                            <td>
                              {this.state.bill && this.state.bill.totalAmount ? `$ ${Number(this.state.bill.totalAmount).toFixed(2)}` : '0'}{' '}
                              {this.getInvoicePaidStatus(this.state.bill && this.state.bill.invoiceStatus)}
                            </td>
                          </tr>
                          <tr>
                            <td colSpan="4" style={{ textAlign: 'right' }}>
                              &nbsp;
                            </td>
                            <td>{/* <RazorPay amountDisplay={`$ ${}`} /> */}</td>
                          </tr>
                        </tfoot>
                      </table>
                    ) : (
                      <div>
                        <div className="bill-section">
                          <div className="section-header" onClick={this.toggleSection.bind(this, 'dynamo')}>
                            {this.state.expand.dynamo ? (
                              <span className="title">
                                <i className="fa fa-minus-circle" />
                              </span>
                            ) : (
                              <span className="title">
                                <i className="fa fa-plus-circle" />
                              </span>
                            )}
                            <span className="title">&nbsp;&nbsp;Dynamo</span>
                            <span className="pull-right">$ {Number(this.state.bill.totals.dynamo).toFixed(2)} </span>
                          </div>
                          {this.state.expand.dynamo && (
                            <div className="section-content">
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
                                <tbody>{dynamoView}</tbody>
                              </table>
                            </div>
                          )}
                        </div>
                        <div className="bill-section">
                          <div className="section-header" onClick={this.toggleSection.bind(this, 'privatehive')}>
                            {this.state.expand.privatehive ? (
                              <span className="title">
                                <i className="fa fa-minus-circle" />
                              </span>
                            ) : (
                              <span className="title">
                                <i className="fa fa-plus-circle" />
                              </span>
                            )}
                            <span className="title">&nbsp;&nbsp;Private Hive</span>
                            <span className="pull-right">$ {Number(this.state.bill.totals.privatehive).toFixed(2)} </span>
                          </div>
                          {this.state.expand.privatehive && (
                            <div className="section-content">
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
                                <tbody>{privateHiveView}</tbody>
                              </table>
                            </div>
                          )}
                        </div>
                        <div className="bill-section">
                          <div className="section-header" onClick={this.toggleSection.bind(this, 'hyperion')}>
                            {this.state.expand.hyperion ? (
                              <span className="title">
                                <i className="fa fa-minus-circle" />
                              </span>
                            ) : (
                              <span className="title">
                                <i className="fa fa-plus-circle" />
                              </span>
                            )}
                            <span className="title">&nbsp;&nbsp;Hyperion</span>
                            <span className="pull-right">$ {Number(this.state.bill.totals.hyperion).toFixed(2)} </span>
                          </div>
                          {this.state.expand.hyperion && (
                            <div className="section-content">
                              <table className="table table-hover" id="basicTable">
                                <thead>
                                  <tr>
                                    <th style={{ width: '50%' }}>Charge Name</th>
                                    <th style={{ width: '25%' }}>Rate</th>
                                    <th style={{ width: '25%' }}>Cost</th>
                                  </tr>
                                </thead>
                                <tbody>{hyperionView}</tbody>
                              </table>
                            </div>
                          )}
                        </div>
                        <div className="bill-section">
                          <div className="section-header" onClick={this.toggleSection.bind(this, 'paymeter')}>
                            {this.state.expand.paymeter ? (
                              <span className="title">
                                <i className="fa fa-minus-circle" />
                              </span>
                            ) : (
                              <span className="title">
                                <i className="fa fa-plus-circle" />
                              </span>
                            )}
                            <span className="title">&nbsp;&nbsp;Paymeter</span>
                            <span className="pull-right">$ {Number(this.state.bill.totals.paymeter).toFixed(2)} </span>
                          </div>
                          {this.state.expand.paymeter && (
                            <div className="section-content">
                              <table className="table table-hover" id="basicTable">
                                <thead>
                                  <tr>
                                    <th style={{ width: '50%' }}>Charge Name</th>
                                    <th style={{ width: '25%' }}>Rate</th>
                                    <th style={{ width: '25%' }}>Cost</th>
                                  </tr>
                                </thead>
                                <tbody>{paymeterView}</tbody>
                              </table>
                            </div>
                          )}
                        </div>
                        <div className="bill-section">
                          <div className="section-header" onClick={this.toggleSection.bind(this, 'credits')}>
                            {' '}
                            {this.state.expand.credits ? (
                              <span className="title">
                                <i className="fa fa-minus-circle" />
                              </span>
                            ) : (
                              <span className="title">
                                <i className="fa fa-plus-circle" />
                              </span>
                            )}
                            <span className="title">&nbsp;&nbsp;Credits</span>
                            <span className="pull-right">- $ {Number(this.state.bill.totals.credits).toFixed(2)} </span>
                          </div>
                          {this.state.expand.credits && (
                            <div className="section-content">
                              <table className="table table-hover" id="basicTable">
                                <thead>
                                  <tr>
                                    <th style={{ width: '50%' }}>Credit Code</th>
                                    <th style={{ width: '25%' }}>Face value</th>
                                    <th style={{ width: '25%' }}>Used</th>
                                  </tr>
                                </thead>
                                <tbody>{creditsView}</tbody>
                              </table>
                            </div>
                          )}
                        </div>
                        <div className="bill-section m-b-50">
                          <div className="section-header total">
                            <span className="title">Total</span>
                            <span className="pull-right">
                              $ {Number(this.state.bill.totalAmount).toFixed(2)} {this.getInvoicePaidStatus(this.state.bill && this.state.bill.invoiceStatus)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
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
