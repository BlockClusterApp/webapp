import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter, Link } from 'react-router-dom';
import Vouchers from '../../../../collections/vouchers/voucher';
import moment from 'moment';
import Campaign from '../../../../collections/vouchers/campaign';

class VoucherDetails extends Component {
  constructor(props) {
    super(props);

    this.state = {
      formattedData: [],
    };
    this.query = {};
  }

  componentWillUnmount() {
    if (this.voucherSubscription) {
      this.voucherSubscription.stop();
    }
    if (this.campaignSubscription) {
      this.campaignSubscription.stop();
    }
  }

  componentWillMount() {
    this.setState({
      voucherId: this.props.match.params.id,
    });
    this.query = { _id: this.props.match.params.id };
    this.getVoucher();
  }
  getVoucher() {
    this.voucherSubscription = Meteor.subscribe(
      'vouchers.search',
      {
        query: this.query,
        limit: 1,
      },
      {
        onReady: () => {
          const i = Vouchers.find(this.query, { limit: 1, skip: 0 }).fetch()[0];
          const formattedData = {
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
          if (i.campaignId && i.campaignId !== 'None') {
            this.campaignSubscription = Meteor.subscribe('campaign.all', {
              onReady: () => {
                const campaign = Campaign.findOne({ _id: i.campaignId });
                this.setState({
                  campaign,
                });
              },
            });
          }
          const updatedData = Object.keys(formattedData).map(i => {
            return { [i]: formattedData[i] };
          });
          this.setState(
            {
              formattedData: updatedData,
            },
            () => {
              debugger;
            }
          );
          debugger;
        },
      }
    );
  }

  render() {
    return (
      <div className="page-content-wrapper">
        <div className="content sm-gutter" style={{ paddingBottom: '0' }}>
          <div data-pages="parallax">
            {/* <div className="container-fluid p-l-25 p-r-25 sm-p-l-0 sm-p-r-0"> */}
            <div className="inner">
              <ol className="breadcrumb sm-p-b-5">
                <li className="breadcrumb-item">
                  <Link to="/app/admin">Admin</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link to="/app/admin/vouchers">Vouchers</Link>
                </li>
                <li className="breadcrumb-item active">{this.state.voucherId}</li>
              </ol>
              {/* </div> */}
            </div>
          </div>
        </div>
        <div className="content voucherDetails" style={{ paddingTop: '0' }}>
          <div className="m-t-20 container-fluid container-fixed-lg bg-white">
            <div className="card-block">
              <div className="table-responsive">
                <table className="table table-hover table-condensed" id="condensedTable">
                  <thead>
                    <tr>
                      <th style={{ width: '30%' }}>Options</th>
                      <th style={{ width: '70%' }}>Desctiption</th>
                    </tr>
                  </thead>
                  <tbody>
                    {this.state.formattedData.map((element, index) => {
                      let Key = Object.keys(element)[0];
                      let Value = element[Key];
                      return (
                        <tr key={index + 1}>
                          <td className="v-align-middle semi-bold">{Key}</td>
                          <td className="v-align-middle">{Value}</td>
                        </tr>
                      );
                    })}
                    {this.state.campaign && (
                      <tr>
                        <td className="v-align-middle semi-bold">Campaign</td>
                        <td className="v-align-middle">{this.state.campaign.description}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withTracker(() => {
  return {};
})(withRouter(VoucherDetails));
