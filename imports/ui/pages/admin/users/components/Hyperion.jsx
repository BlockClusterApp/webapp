import React from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter } from 'react-router-dom';
import moment from 'moment';

import helpers from '../../../../../modules/helpers';
import HyperionPricing from '../../../../../collections/pricing/hyperion';
import { Hyperion } from '../../../../../collections/hyperion/hyperion';

class HyperionDetails extends React.Component {
  render() {
    const { hyperion, hyperionPricing } = this.props;
    return (
      <div className="row">
        <div className="col-lg-6 m-b-10 d-flex">
          <div className=" card no-border card-condensed no-margin widget-loader-circle align-self-stretch d-flex flex-column">
            <div className="padding-25">
              <div className="pull-left">
                <h2 className="text-success no-margin">Hyperion</h2>
                <p className="no-margin">Hyperion Statistics</p>
              </div>
            </div>
            {hyperion && (
              <div>
                <div className="row card-block">
                  <div className="col-sm-6 col-md-6 col-lg-4">
                    <div className="widget-9 card no-border bg-success no-margin widget-loader-bar">
                      <div className="full-height d-flex flex-column">
                        <div className="card-header ">
                          <div className="card-title text-black">
                            <span className="font-montserrat fs-11 all-caps text-white">
                              Disk Space Consumed <i className="fa fa-chevron-right" />
                            </span>
                          </div>
                        </div>
                        <div className="p-l-20">
                          <h3 className="no-margin p-b-30 text-white ">{hyperion && <span>{helpers.bytesToSize(hyperion.size || 0)}</span>}</h3>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-sm-6 col-md-6 col-lg-4">
                    <div className="widget-9 card no-border bg-warning no-margin widget-loader-bar">
                      <div className="full-height d-flex flex-column">
                        <div className="card-header ">
                          <div className="card-title text-black">
                            <span className="font-montserrat fs-11 all-caps text-white">
                              Monthly Cost <i className="fa fa-chevron-right" />
                            </span>
                          </div>
                        </div>
                        <div className="p-l-20">
                          <h3 className="no-margin p-b-30 text-white ">
                            {hyperion && <span>${Number((hyperion.size / (1024 * 1024 * 1024)) * (hyperionPricing && hyperionPricing.perGBCost)).toFixed(2)}</span>}

                            {!hyperion && <span>$0</span>}
                          </h3>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-sm-12 col-lg-4">
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
                            {hyperion && (
                              <span>
                                $
                                {Math.max(
                                  (hyperion.size / (1024 * 1024 * 1024)) * (hyperionPricing && hyperionPricing.perGBCost) - hyperion.discount,
                                  hyperion.minimumFeeThisMonth
                                ).toFixed(2)}
                              </span>
                            )}

                            {!hyperion && <span>$0</span>}
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
                          <td className="text-right b-r b-dashed b-grey w-45">$ {Number(hyperion.minimumFeeThisMonth).toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td className="font-montserrat fs-12 w-60">Discount</td>
                          <td className="text-right b-r b-dashed b-grey w-45">$ {Number(hyperion.discount).toFixed(5)}</td>
                        </tr>
                        <tr>
                          <td className="font-montserrat fs-12 w-60">Vouchers</td>
                          <td className="text-right b-r b-dashed b-grey w-45">
                            {hyperion.vouchers && hyperion.vouchers.map(v => `${v.code} : ${moment(v.appliedOn).format('DD-MMM-YYYY kk:mm:ss')}`).join(', ')}
                          </td>
                        </tr>
                        <tr>
                          <td className="font-montserrat fs-12 w-60">Subscribed</td>
                          <td className="text-right b-r b-dashed b-grey w-45">{hyperion.subscribed ? 'Yes' : 'No'}</td>
                        </tr>
                        <tr>
                          <td className="font-montserrat fs-12 w-60">Unsubscribe next month</td>
                          <td className="text-right b-r b-dashed b-grey w-45">{hyperion.unsubscribeNextMonth ? 'Yes' : 'No'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            {!hyperion && <div className="col-md-12 p-l-30 p-b-10">Not subscribed yet</div>}
          </div>
        </div>
      </div>
    );
  }
}

export default withTracker(props => {
  return {
    hyperion: Hyperion.findOne({ userId: props.match.params.id }),
    hyperionPricing: HyperionPricing.findOne({ active: true }),
    subscriptions: [Meteor.subscribe('user.details.hyperionStats', { userId: props.match.params.id })],
  };
})(withRouter(HyperionDetails));
