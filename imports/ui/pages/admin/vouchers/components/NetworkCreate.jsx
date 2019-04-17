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
import NetworkConfiguration from '../../../../../collections/network-configuration/network-configuration';
import Campaign from '../../../../../collections/vouchers/campaign';

import './style.scss';

class VoucherCreate extends Component {
  constructor(props) {
    super(props);

    this.locationMapping = {};

    this.campaignId = undefined;

    this.state = {
      exist: null,
      code: '',
      customCode: false,
      noOfVouchers: 1,
      cpu: '',
      disk: '',
      ram: '',
      voucher_code_size: 6,
      for_all: true,
      recurring: false,
      no_months: '',
      email_ids: '',
      discount_amt: 0,
      is_percent: false,
      expiry_date: '',
      discountedDays: 0,
      isDiskChangeable: false,
      voucher_status: true,
      once_per_user: true,
      no_times_per_user: 5,
      card_vfctn_needed: true,
      csv_data: [],
      csv_ids: [],
      enable_download: false,
    };
  }

  resetForm = () => {
    this.setState(
      {
        code: '',
        customCode: false,
        noOfVouchers: 1,
        cpu: '',
        disk: '',
        ram: '',
        voucher_code_size: 6,
        for_all: true,
        recurring: false,
        no_months: '',
        email_ids: '',
        discount_amt: 0,
        is_percent: false,
        expiry_date: '',
        discountedDays: 0,
        isDiskChangeable: false,
        voucher_status: false,
        once_per_user: true,
        no_times_per_user: 5,
        card_vfctn_needed: true,
        csv_data: [],
        csv_ids: [],
        enable_download: false,
      },
      () => {
        notifications.success('Resetting All Fields');
      }
    );
  };
  createVoucher = e => {
    this.setState(
      {
        enable_download: false,
      },
      () => {
        let payload = this.state;
        const _doc_voucher = {
          locationMapping: this.locationMapping,
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
            email_ids: payload.email_ids ? payload.email_ids.split(',') : [],
          },
          discount: {
            value: payload.discount_amt || 0,
            percent: payload.is_percent,
          },
          active: payload.voucher_status,
          networkConfig: JSON.parse(this.config.value),
          expiryDate:
            payload.expiry_date ||
            moment()
              .add(30, 'days')
              .toDate(), //lets take by default 30days
          discountedDays: payload.discountedDays || 0,
          type: 'network',
        };

        if (this.campaignId && this.campaignId !== 'None') {
          _doc_voucher.campaignId = this.campaignId;
        }
        this.setState({
          createVoucher_formSubmitError: '',
          createVoucher_formloading: true,
        });
        Meteor.call('CreateVoucher', _doc_voucher, async (error, done) => {
          console.log(error, done);
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
        'Network Config\n(CPU,RAM,DISK)': `${i.networkConfig.cpu}C,${i.networkConfig.ram}G,${i.networkConfig.disk}G`,
        'Disk Changebale': i.isDiskChangeable ? 'YES' : 'NO',
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
        'Expiry Date': new Date(i.expiryDate).toLocaleDateString() + ' ' + new Date(i.expiryDate).toLocaleTimeString(),
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
    const configs = this.props.configs;
    const locations = this.props.locations;

    let locationEditView = [];
    locations.forEach(loc => {
      this.locationMapping[loc.locationCode] = this.locationMapping[loc.locationCode] === false ? false : true;
      locationEditView.push(
        <div className="col-md-3 col-lg-2 col-sm-3">
          <label htmlFor={`label_${loc.locationCode}`} style={{ cursor: 'pointer' }}>
            {loc.locationCode}
          </label>
          &nbsp;
          <input
            type="checkbox"
            id={`label_${loc.locationCode}`}
            defaultChecked={true}
            onClick={e => {
              this.locationMapping[loc.locationCode] = e.target.checked;
            }}
          />
        </div>
      );
    });

    let networks = null;
    if (configs && configs.length > 0) {
      const configList = configs.map(config => (
        <option value={JSON.stringify(config)} key={config._id}>
          {config.name} - {config.cpu} vCPU | {config.ram} GB RAM | {config.disk} GB Disk | $ {config.cost.monthly} / month | Availability:{' '}
          {config.locations ? config.locations.join(', ') : ''}
        </option>
      ));
      networks = (
        <div className="form-group form-group-default ">
          <label>Node Type</label>
          <select className="form-control form-group-default" name="location" ref={input => (this.config = input)} selected={Object.values(configs)[0]}>
            {configList}
          </select>
        </div>
      );
    }

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
        <div className="m-t-20 container-fluid container-fixed-lg">
          <div className="row  bg-white p-l-25 p-r-25">
            <div className="card-block">
              <div className="row">
                <div className="col-md-12">
                  <div className="card-title">
                    <h3>Dynamo Network Voucher</h3>
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
                  <div className="col-md-4 form-input-group">
                    <label>Customized Voucher Code</label>
                    <span className="help"> e.g WORLDSUMMITB </span>
                    <Toggle name="customCode" className="form-control" icons={false} checked={this.state.customCode} onChange={this.handleChangesToggle.bind(this)} />
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
                )}
                {this.state.customCode && (
                  <div className="row">
                    <div className="col-md-6 form-input-group">
                      <label>Voucher Code</label>
                      <span className="help"> e.g. "WORLDSUMMIT" &nbsp;&nbsp;</span>
                      {this.state.code.length > 0 ? (
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
                <label>Network Configuration </label>
                <div className="row">
                  <div className="col-md-12">{networks}</div>
                </div>
                <div className="row">
                  <div className="col-md-2">Availability:</div>
                  {locationEditView}
                </div>
                <br />
                <label>Usability</label>
                <div className="row">
                  <div className="col-md-2 form-input-group">
                    <label>Is Recurring</label>
                    <Toggle name="recurring" className="form-control" icons={false} checked={this.state.recurring} onChange={this.handleChangesToggle.bind(this)} />
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
                    <span className="help"> e.g {this.state.once_per_user ? 'once' : 'multiple times'} per user</span>
                    <Toggle name="once_per_user" className="form-control" icons={false} checked={this.state.once_per_user} onChange={this.handleChangesToggle.bind(this)} />
                  </div>
                  {this.state.once_per_user == false && (
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
                    <Toggle name="for_all" className="form-control" icons={false} checked={this.state.for_all} onChange={this.handleChangesToggle.bind(this)} />
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
                    <span className="help"> card verification needed to use this voucher(s).</span>
                    <Toggle name="card_vfctn_needed" className="form-control" icons={false} checked={this.state.card_vfctn_needed} onChange={this.handleChangesToggle.bind(this)} />
                  </div>
                </div>
                <br />
                <label>Discounts</label>
                <div className="row">
                  <div className="col-md-4 form-input-group">
                    <label>Discount in Percentage</label>
                    <Toggle name="is_percent" className="form-control" icons={false} checked={this.state.is_percent} onChange={this.handleChangesToggle.bind(this)} />
                  </div>
                  <div className="col-md-3 form-input-group">
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
                  <div className="col-md-4 form-input-group" align="right">
                    <label>Discounted Days</label>
                    <input name="discountedDays" type="number" className="form-control" onChange={this.handleChanges.bind(this)} value={this.state.discountedDays} />
                  </div>
                </div>
                <br />
                <label>Others</label>
                <div className="row">
                  <div className="col-md-4 form-input-group">
                    <label>Expiry Date</label>
                    <input name="expiry_date" type="date" className="form-control" onChange={this.handleChanges.bind(this)} required />
                  </div>
                  <div className="col-md-4 form-input-group">
                    <label>Changeable Disk</label>
                    <Toggle name="isDiskChangeable" className="form-control" icons={false} checked={this.state.isDiskChangeable} onChange={this.handleChangesToggle.bind(this)} />
                  </div>
                  <div className="col-md-4 form-input-group">
                    <label>Voucher Status</label>
                    <Toggle name="voucher_status" className="form-control" icons={false} checked={this.state.voucher_status} onChange={this.handleChangesToggle.bind(this)} />
                  </div>
                </div>
              </div>
              <LaddaButton
                disabled={!(this.state.noOfVouchers > 0 && (this.state.code.length > 0 ? !this.state.exist : true))}
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
                  <LaddaButton
                    // loading={this.state[this.props.network[0].instanceId + "_createStream_formloading"]}
                    data-size={S}
                    data-style={SLIDE_UP}
                    data-spinner-size={30}
                    data-spinner-lines={12}
                    className="btn btn-info m-t-10"
                    onClick={this.resetForm.bind(this)}
                  >
                    <i className="fa fa-minus-circle" aria-hidden="true" />
                    &nbsp;&nbsp;Reset Form
                  </LaddaButton>{' '}
                  &nbsp;&nbsp;
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
    configs: NetworkConfiguration.find({ active: true, for: 'dynamo' }).fetch(),
    campaigns: Campaign.find({}).fetch(),
    subscriptions: [Meteor.subscribe('vouchers.all', { page: 0 }), Meteor.subscribe('networkConfig.all'), Meteor.subscribe('campaign.all')],
  };
})(withRouter(VoucherCreate));
