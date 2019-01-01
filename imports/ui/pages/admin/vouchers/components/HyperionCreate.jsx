import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter } from 'react-router-dom';
import notifications from '../../../../../modules/notifications';
import Vouchers from '../../../../../collections/vouchers/voucher';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';
import { CSVLink, CSVDownload } from 'react-csv';
import Toggle from 'react-toggle';
import 'react-toggle/style.css';

import moment from 'moment';
import Campaign from '../../../../../collections/vouchers/campaign';

import './style.scss';

class VoucherCreate extends Component {
  constructor(props) {
    super(props);

    this.campaignId = undefined;
    this.state = {
      for_all: true,
      recurring: true,
      no_times_per_user: 1,
      noOfVouchers: 1,
      discountedDays: 0, // Not used in hyperion vouchers so setting to 0. It calculates the free hours for a node
      voucher_status: true,
    };
  }
  createVoucher = e => {
    this.setState(
      {
        enable_download: false,
      },
      () => {
        let payload = this.state;
        const _doc_voucher = {
          code: this.state.customCode ? payload.code : null,
          noOfVouchers: payload.noOfVouchers,
          voucher_code_size: payload.voucher_code_size,
          usablity: {
            recurring: payload.recurring,
            no_months: payload.no_months || 0,
            once_per_user: payload.once_per_user,
            no_times_per_user: payload.no_times_per_user || 1,
          },
          availability: {
            card_vfctn_needed: payload.card_vfctn_needed,
            for_all: payload.for_all,
            email_ids: payload.email_ids ? payload.email_ids.split(',').map(a => a.trim()) : [],
          },
          discount: {
            value: payload.discount_amt || 0,
            percent: payload.is_percent,
          },
          active: payload.voucher_status,
          expiryDate:
            payload.expiry_date ||
            moment()
              .add(30, 'days')
              .toDate(), //lets take by default 30days
          discountedDays: payload.discountedDays || 0,
          type: 'hyperion',
        };

        if (this.campaignId && this.campaignId !== 'None') {
          _doc_voucher.campaignId = this.campaignId;
        }
        this.setState({
          createVoucher_formSubmitError: '',
          createVoucher_formloading: true,
        });
        Meteor.call('CreateVoucher', _doc_voucher, async (error, done) => {
          if (!error) {
            this.setState({
              csv_ids: done,
            });
            await this.downloadVouchers();
            this.setState({
              ['createVoucher_formloading']: false,
              ['createVoucher_formSubmitError']: '',
            });
            notifications.success('Vouchers Created!');
          } else {
            this.setState({
              ['createVoucher_formloading']: false,
              ['createVoucher_formSubmitError']: error.reason,
            });
            notifications.error(error.reason);
          }
        });
      }
    );
  };
  formatData = data => {
    return data.map(i => {
      return {
        ID: i._id,
        'Voucher Code': i.code,
        'Discount Type': i.discount.percent ? 'In Percentage' : 'Flat',
        'Discount Amount': i.discount.percent ? i.discount.value + '%' : i.discount.value,
        'Discounted Days': i.discountedDays,
        'Recurring Voucher': i.usability.recurring ? 'YES' : 'NO',
        'Recurring Months': i.usability.recurring ? i.usability.no_months : '-',
        'Once Per User': i.usability.once_per_user ? 'YES' : 'NO',
        'Times Per User': i.usability.once_per_user ? '-' : i.usability.no_times_per_user,
        'Card Verification Mandate': i.availability.card_vfctn_needed ? 'YES' : 'NO',
        'Usable For Everyone': i.availability.for_all ? 'YES' : 'NO',
        'Usable Only For': i.availability.for_all ? '-' : i.availability.email_ids.join(','),
        'Voucher Status': i.expiryDate < new Date() ? 'Expired' : i.voucher_status ? 'Active' : 'Inactive',
        'Expiry Date': moment(i.expiryDate).format('DD-MMM-YYYY kk:ss'),
      };
    });
  };
  downloadVouchers = () => {
    const query = { _id: { $in: this.state.csv_ids }, active: true };
    return new Promise((resolve, reject) => {
      Meteor.subscribe(
        'vouchers.search',
        {
          query: query,
          limit: Number(this.state.noOfVouchers),
        },
        {
          onReady: () => {
            const csv_data = Vouchers.find(query, { limit: Number(this.state.noOfVouchers), skip: 0 }).fetch();
            this.setState(
              {
                ['csv_data']: this.formatData(csv_data),
                ['enable_download']: true,
              },
              () => {
                return resolve(true);
              }
            );
          },
        }
      );
    });
  };
  checkExisting = e => {
    this.setState(
      {
        [e.target.name]: e.target.value,
      },
      () => {
        this.voucherSubscription = Meteor.subscribe(
          'vouchers.search',
          {
            query: { code: this.state.code },
          },
          {
            onReady: () => {
              const voucher = Vouchers.find({ code: this.state.code }).fetch()[0];
              if (voucher) {
                this.setState({
                  exist: true,
                });
              } else {
                this.setState({
                  exist: false,
                });
              }
            },
          }
        );
      }
    );
  };

  handleChanges = e => {
    this.setState({
      [e.target.name]: e.target.value,
    });
  };
  handleChangesToggle = e => {
    this.setState({
      [e.target.name]: e.target.checked,
    });
  };

  campaignChange = e => {
    this.campaignId = e.target.value;
  };

  render() {
    const { campaigns } = this.props;

    const options = [
      <option value={undefined} key={'opt_1'} selected>
        None
      </option>,
    ];
    if (campaigns && campaigns.length > 0) {
      campaigns.forEach(c => {
        options.push(
          <option value={c._id} key={c._id}>
            {c.description}
          </option>
        );
      });
    }

    return (
      <div className="VoucherCreate">
        <div className="m-t-20 container-fluid container-fixed-lg bg-white">
          <div className="row">
            <div className="card-block">
              <div className="row">
                <div className="col-md-12">
                  <div className="card-title">
                    <h3>Create Hyperion Voucher</h3>
                  </div>
                </div>
              </div>
              <div className="form-group">
                <div className="row">
                  <div className="col-md-12  form-input-group">
                    <label>Select Campaign</label>
                    <select className="full-width select2-hidden-accessible" data-init-plugin="select2" tabIndex="-1" aria-hidden="true" onChange={this.campaignChange}>
                      {options}
                    </select>
                  </div>
                </div>
                <div className="row m-t-20">
                  <div className="col-md-12 form-input-group">
                    <label>Customized Voucher Code</label>
                    <span className="help"> e.g WORLDSUMMITB </span>
                    <Toggle name="customCode" className="form-control" icons={false} defaultChecked={false} onChange={this.handleChangesToggle.bind(this)} />
                  </div>
                </div>
                <br />
                {!this.state.customCode && (
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
                      <label>Voucher code length</label>
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
                )}
                {this.state.customCode && (
                  <div className="row">
                    <div className="col-md-6 form-input-group">
                      <label>Voucher Code</label>
                      <span className="help"> e.g. "HYPERWORLD" &nbsp;&nbsp;</span>
                      {this.state.code && this.state.code.length > 0 ? (
                        this.state.exist ? (
                          <span className="text-center text-danger no-margin"> Not Available</span>
                        ) : (
                          <span className="text-center text-success no-margin"> Available</span>
                        )
                      ) : (
                        ''
                      )}
                      <input
                        name="code"
                        type="text"
                        placeholder="e.g ABCD785"
                        className="form-control"
                        onChange={this.checkExisting.bind(this)}
                        value={this.state.code}
                        required
                        // value={this.state.networkConfig.cpu}
                      />
                    </div>
                  </div>
                )}
                <br />
                <label className="fs-14 text-primary">Usability</label>
                <div className="row">
                  <div className="col-md-3 form-input-group">
                    <label>Is Recurring</label>
                    <Toggle name="recurring" className="form-control" icons={false} checked={this.state.recurring} onChange={this.handleChangesToggle.bind(this)} />
                  </div>
                  {this.state.recurring && (
                    <div className="col-md-9 form-input-group">
                      <label>Number Of Months</label>
                      <input
                        name="no_months"
                        type="number"
                        placeholder="e.g 3"
                        className="form-control"
                        defaultValue="1"
                        onChange={this.handleChanges.bind(this)}
                        value={this.state.no_months}
                        required
                      />
                    </div>
                  )}
                </div>
                <br />
                <label className="fs-14 text-primary">Availability</label>
                <div className="row">
                  <div className="col-md-3 form-input-group">
                    <label>For Everyone</label>
                    <Toggle name="for_all" className="form-control" icons={false} checked={this.state.for_all} onChange={this.handleChangesToggle.bind(this)} />
                  </div>
                  {this.state.for_all == false && (
                    <div className="col-md-9 form-input-group">
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
                  <div className="col-md-6 form-input-group">
                    <label>Card Verification Needed</label>
                    <Toggle name="card_vfctn_needed" className="form-control" icons={false} checked={this.state.card_vfctn_needed} onChange={this.handleChangesToggle.bind(this)} />
                  </div>
                </div>
                <br />
                <label className="fs-14 text-primary">Discounts</label>
                <div className="row">
                  <div className="col-md-3 form-input-group">
                    <label>Discount in Percentage</label>
                    <Toggle name="is_percent" className="form-control" icons={false} checked={this.state.is_percent} onChange={this.handleChangesToggle.bind(this)} />
                  </div>
                  <div className="col-md-6 form-input-group">
                    <label>Discount Amount ({this.state.is_percent ? 'percentage' : 'Flat Amount'})</label>
                    <input
                      name="discount_amt"
                      type="number"
                      placeholder={this.state.is_percent ? '50 %' : '50 USD'}
                      className="form-control"
                      onChange={this.handleChanges.bind(this)}
                      required
                    />
                  </div>
                </div>
                <br />
                <label className="fs-14 text-primary">Others</label>
                <div className="row">
                  <div className="col-md-4 form-input-group">
                    <label>Expiry Date</label>
                    <input name="expiry_date" type="date" className="form-control" onChange={this.handleChanges.bind(this)} required />
                  </div>
                  <div className="col-md-4 form-input-group">
                    <label>Voucher Activated</label>
                    <Toggle name="voucher_status" className="form-control" icons={false} checked={this.state.voucher_status} onChange={this.handleChangesToggle.bind(this)} />
                  </div>
                </div>
              </div>
              <LaddaButton
                disabled={!(this.state.noOfVouchers > 0 && (this.state.code && this.state.code.length > 0 ? !this.state.exist : true))}
                loading={this.state.createVoucher_formloading ? this.state.createVoucher_formloading : false}
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
              &nbsp;&nbsp;
              {this.state.enable_download && (
                <div>
                  <LaddaButton className="btn btn-danger m-t-10" data-size={S} data-style={SLIDE_UP} data-spinner-size={30} data-spinner-lines={12}>
                    <CSVLink style={{ textDecoration: 'none !important', color: 'inherit' }} filename={'Vouchers_' + Date.now() + '.csv'} data={this.state.csv_data}>
                      Download CSV
                    </CSVLink>
                  </LaddaButton>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
export default withTracker(() => {
  return {
    campaigns: Campaign.find({}).fetch(),
    subscriptions: [Meteor.subscribe('campaign.all')],
  };
})(withRouter(VoucherCreate));
