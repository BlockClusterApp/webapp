import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import helpers from '../../../../modules/helpers';
import { withRouter } from 'react-router-dom';
import { Link } from 'react-router-dom';
import moment from 'moment';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';
import { Paymeter } from '../../../../collections/paymeter/paymeter';
import notifications from '../../../../modules/notifications';
import ConfirmationButton from '../../../components/Buttons/ConfirmationButton';
import EditableText from '../../../components/EditableText/EditableText';

class PaymeterDetails extends Component {
  constructor(props) {
    super(props);

    this.state = {
      locations: [],
      page: 0,
    };

    this.subscriptionTypes = [];
    this.subscriptions = [];
  }

  updateUser = () => {
    this.setState({
      user: Meteor.users.find({ _id: this.props.paymeter.userId }).fetch()[0],
    });
  };

  componentDidMount() {
    window.addEventListener('paymeter-user-loaded', this.updateUser);
  }

  componentWillUnmount() {
    this.props.subscriptions.forEach(s => s.stop());
    window.removeEventListener('paymeter-user-loaded', this.updateUser);
  }

  copyText = text => {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    notifications.success('Link copied');
  };

  adminApplyVoucher = () => {
    if (!this.promotionalCode.value) {
      console.log('Code required');
      return false;
    }
    this.setState({
      adminApplyVoucherLoading: true,
    });
    Meteor.call('adminVoucherApply', { userId: this.props.user._id, code: this.promotionalCode.value, type: 'paymeter' }, (err, res) => {
      this.setState({
        adminApplyVoucherLoading: false,
      });
      if (err) {
        return notifications.error(err.reason);
      }
      this.refresh();
      notifications.success('Code Applied');
    });
  };

  modalEventFns = (open, close) => {
    this.openTxnModal = open;
    this.closeTxnModal = close;
  };

  minimumBillChangeListener = value => {
    if (!value || isNaN(Number(value))) {
      notifications.error('Invalid amount');
      return false;
    }
    Meteor.call('adminChangeMinimumPaymeterBill', { paymeter: this.props.match.params.id, value }, (err, res) => {
      if (err) {
        return notifications.error(err.reason);
      }
      notifications.success('Updated');
    });
  };

  render() {
    const { user } = this.state;
    const { paymeter } = this.props;

    if (!(paymeter && paymeter.userId && user)) {
      const LoadingView = (
        <div className="d-flex justify-content-center flex-column full-height" style={{ marginTop: '250px', paddingBottom: '250px', paddingLeft: '250px' }}>
          <div id="loader" />
          <br />
          <p style={{ textAlign: 'center', fontSize: '1.2em' }}>Just a minute</p>
        </div>
      );
      return LoadingView;
    }

    return (
      <div className="page-content-wrapper ">
        <div className="content sm-gutter">
          <div data-pages="parallax">
            <div className="container-fluid p-l-25 p-r-25 sm-p-l-0 sm-p-r-0">
              <div className="inner">
                <ol className="breadcrumb sm-p-b-5">
                  <li className="breadcrumb-item">
                    <Link to="/app/admin">Admin</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link to="/app/admin/paymeter">Paymeter</Link>
                  </li>
                  <li className="breadcrumb-item active">{this.props.match.params.id}</li>
                </ol>
              </div>
            </div>
          </div>
          <div className="container-fluid p-l-25 p-r-25 p-t-0 p-b-25 sm-padding-10">
            <div className="row">
              <div className="col-lg-3 col-sm-6  d-flex flex-column">
                <div className="card social-card share  full-width m-b-10 no-border" data-social="item">
                  <div className="card-header ">
                    <h5 className="text-primary pull-left fs-12">
                      User <i className="fa fa-circle text-complete fs-11" />
                    </h5>
                    <div className="clearfix" />
                  </div>
                  <div className="card-description">
                    <p>
                      <Link to={`/app/admin/users/${user._id}`}>
                        {user.profile.firstName} {user.profile.lastName}
                      </Link>
                      <br />

                      <Link to={`/app/admin/users/${user._id}`}>{user.emails[0].address}</Link>
                    </p>
                  </div>
                </div>
              </div>

              <div className="col-sm-3">
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
              <div className="col-lg-6 m-b-10 d-flex">
                <div>
                  <div className="row">
                    <div className="col-md-12">
                      <table className="table table-condensed table-hover">
                        <tbody>
                          <tr>
                            <td className="font-montserrat fs-12 w-60">Minimum fee this month</td>
                            <td className="text-right b-r b-dashed b-grey w-45">
                              <EditableText value={Number(paymeter.minimumFeeThisMonth).toFixed(2)} valueChanged={this.minimumBillChangeListener} />
                            </td>
                          </tr>
                          <tr>
                            <td className="font-montserrat fs-12 w-60">Actual Bill</td>
                            <td className="text-right b-r b-dashed b-grey w-45">$ {Number(paymeter.bill).toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td className="font-montserrat fs-12 w-60">Vouchers</td>
                            <td className="text-right b-r b-dashed b-grey w-45">
                              {paymeter.vouchers &&
                                paymeter.vouchers.map(v => (
                                  <Link to={`/app/admin/voucher/details/${v._id}`} key={v._id}>{`${v.code} : ${moment(v.appliedOn).format('DD-MMM-YYYY kk:mm:ss')}`}</Link>
                                ))}
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
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withTracker(props => {
  return {
    paymeter: Paymeter.find({ _id: props.match.params.id }).fetch()[0],
    subscriptions: [
      Meteor.subscribe(
        'paymeter.search',
        { query: { _id: props.match.params.id } },
        {
          onReady: () => {
            window.dispatchEvent(new Event('paymeter-user-loaded'));
          },
        }
      ),
    ],
  };
})(withRouter(PaymeterDetails));
