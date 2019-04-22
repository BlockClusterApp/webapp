import React from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter } from 'react-router-dom';
import moment from 'moment';

import { Paymeter } from '../../../../../collections/paymeter/paymeter';

class PaymeterDetails extends React.Component {
  render() {
    const { paymeter } = this.props;

    return (
      <div className="row">
        <div className="col-md-6 col-sm-12">
          <div className=" card no-border card-condensed no-margin widget-loader-circle align-self-stretch d-flex flex-column">
            <div className="padding-25">
              <div className="pull-left">
                <h2 className="text-success no-margin">Paymeter</h2>
                <p className="no-margin">Paymeter Statistics</p>
              </div>
            </div>
            {paymeter && (
              <div>
                <div className="row card-block">
                  <div className="col-sm-12 col-lg-12" onClick={() => this.props.history.push(`/app/admin/paymeter/${paymeter._id}`)} style={{ cursor: 'pointer' }}>
                    <div className="widget-9 card no-border bg-complete no-margin widget-loader-bar">
                      <div className="full-height d-flex flex-column">
                        <div className="card-header ">
                          <div className="card-title text-black">
                            <span className="font-montserrat fs-11 all-caps text-white">
                              This Month Invoice <i className="fa fa-chevron-right" />
                            </span>
                          </div>
                        </div>
                        <div className="p-l-20">
                          <h3 className="no-margin p-b-30 text-white ">
                            {paymeter && <span>$ {Number(Math.max(paymeter.bill || 0, paymeter.minimumFeeThisMonth)).toFixed(2)}</span>}

                            {!paymeter && <span>$0</span>}
                          </h3>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-12">
                    <table className="table table-condensed table-hover">
                      <tbody>
                        <tr>
                          <td className="font-montserrat fs-12 w-60">Minimum fee this month</td>
                          <td className="text-right b-r b-dashed b-grey w-45">$ {Number(paymeter.minimumFeeThisMonth).toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td className="font-montserrat fs-12 w-60">Vouchers</td>
                          <td className="text-right b-r b-dashed b-grey w-45">
                            {paymeter.vouchers && paymeter.vouchers.map(v => `${v.code} : ${moment(v.appliedOn).format('DD-MMM-YYYY kk:mm:ss')}`).join(', ')}
                          </td>
                        </tr>
                        <tr>
                          <td className="font-montserrat fs-12 w-60">Subscribed</td>
                          <td className="text-right b-r b-dashed b-grey w-45">{paymeter.subscribed ? 'Yes' : 'No'}</td>
                        </tr>
                        <tr>
                          <td className="font-montserrat fs-12 w-60">Unsubscribe next month</td>
                          <td className="text-right b-r b-dashed b-grey w-45">{paymeter.unsubscribeNextMonth ? 'Yes' : 'No'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            {!paymeter && (
              <div className="row">
                <div className="col-md-12 font-montserrat p-l-30 p-b-10">Not subscribed yet</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default withTracker(props => {
  return {
    paymeter: Paymeter.findOne({ userId: props.match.params.id }),
    subscriptions: [Meteor.subscribe('user.details.paymeterStats', { userId: props.match.params.id })],
  };
})(withRouter(PaymeterDetails));
