import React from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter } from 'react-router-dom';
import moment from 'moment';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';

import Credits from '../../../../../collections/payments/credits';

function calculateBalanceCredits(credits) {
  let totalSum = 0;
  credits.forEach(credit => {
    totalSum += Number(credit.amount);
    if (credit.metadata && credit.invoices) {
      credit.invoices.forEach(invoice => {
        totalSum -= Number(invoice.amount);
      });
    }
  });
  return Number(totalSum).toFixed(2);
}

class CreditDetails extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      adminApplyVoucherLoading: false,
    };
  }
  adminApplyVoucher = () => {
    if (!this.promotionalCode.value) {
      console.log('Code required');
      return false;
    }
    this.setState({
      adminApplyVoucherLoading: true,
    });
    Meteor.call('adminVoucherApply', { userId: this.props.user._id, code: this.promotionalCode.value }, (err, res) => {
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

  render() {
    const { credits } = this.props;

    const txns = [];
    credits &&
      credits.forEach(credit => {
        txns.push({
          amount: `+ $${credit.amount}`,
          description: `Redeemed using code ${credit.code}`,
          date: credit.createdAt,
        });
        if (credit.metadata && credit.invoices) {
          credit.invoices.forEach(invoice => {
            txns.push({
              amount: `- $${invoice.amount}`,
              description: `Used for settling invoice ${invoice.invoiceId}`,
              date: invoice.claimedOn,
            });
          });
        }
      });

    return (
      <div className="row">
        <div className="col-md-12">
          <div className=" card no-border card-condensed no-margin widget-loader-circle align-self-stretch d-flex flex-column">
            <div className="card-header top-right">
              <div className="card-controls">
                <ul>
                  <li>
                    <a data-toggle="refresh" className="portlet-refresh text-black" href="#">
                      <i className="portlet-icon portlet-icon-refresh" />
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="padding-25">
              <div className="pull-left">
                <h2 className="text-success no-margin">Credits</h2>
                <p className="no-margin">Credits Redemptions</p>
              </div>
              <h3 className="pull-right semi-bold">$ {credits && calculateBalanceCredits(credits)}</h3>
              <div className="clearfix" />
            </div>
            <div className="auto-overflow -table" style={{ maxHeight: '375px' }}>
              <table className="table table-condensed table-hover">
                {credits && (
                  <thead>
                    <tr>
                      <th style={{ width: '5%' }}>S.No</th>
                      <th style={{ width: '20%' }}>Amount</th>
                      <th style={{ width: '55%' }}>Description</th>
                      <th style={{ width: '20%' }}>Date</th>
                    </tr>
                  </thead>
                )}
                <tbody>
                  {credits &&
                    txns.map((txn, index) => {
                      return (
                        <tr key={index + 1}>
                          <td>{index + 1}</td>
                          <td>{txn.amount}</td>
                          <td className="fs-12">{txn.description}</td>
                          <td className="fs-12" title={moment(txn.date).format('DD-MMM-YYYY kk:mm')}>
                            {moment(txn.date).format('DD-MMM-YYYY kk:mm')}
                          </td>
                        </tr>
                      );
                    })}
                  {!credits[0] && (
                    <tr>
                      <td className="font-montserrat fs-12 w-100">No credits applied yet</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="4">
                      <div className="row">
                        <div className="col-md-8 form-input-group">
                          <input name="code" type="text" placeholder="Apply Code" className="form-control" ref={input => (this.promotionalCode = input)} required />
                        </div>
                        <div className="col-md-4">
                          <LaddaButton
                            loading={this.state.adminApplyVoucherLoading}
                            data-size={S}
                            data-style={SLIDE_UP}
                            data-spinner-size={30}
                            data-spinner-lines={12}
                            className="btn btn-success m-t-10"
                            onClick={this.adminApplyVoucher}
                            style={{ marginTop: 0 }}
                          >
                            <i className="fa fa-check" /> &nbsp;Apply
                          </LaddaButton>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withTracker(props => {
  return {
    credits: Credits.find({ userId: props.match.params.id }).fetch(),
    subscriptions: [Meteor.subscribe('user.details.credits', { userId: props.match.params.id })],
  };
})(withRouter(CreditDetails));
