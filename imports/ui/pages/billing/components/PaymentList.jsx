import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter } from 'react-router-dom';

import RZPayments from '../../../../collections/razorpay/payments';
import StripePayments from '../../../../collections/stripe/payments';
import PaymentRequests from '../../../../collections/payments/payment-requests';
import moment from 'moment';
import Helpers from '../../../../modules/helpers';
import CardVerification from '../components/CardVerification.jsx';

import '../Dashboard.scss';

class PaymentDashboard extends Component {
  constructor(props) {
    super(props);

    this.state = {
      locations: [],
    };
  }

  componentWillUnmount() {
    this.props.subscriptions.forEach(s => {
      s.stop();
    });
  }

  componentDidMount() {}

  getLocationName = locationCode => {
    const locationConfig = this.state.locations.find(a => a.locationCode === locationCode);
    if (!locationConfig) {
      return undefined;
    }
    return locationConfig.locationName;
  };

  convertStatusToTag = statusCode => {
    if (statusCode === 2 || statusCode === 'captured' || statusCode === 'succeeded') {
      return <span className="label label-success">Success</span>;
    } else if (statusCode === 3 || statusCode === 'refunded') {
      return <span className="label label-info">Refunded</span>;
    } else if (statusCode === 'failed') {
      return <span className="label label-info">Failed</span>;
    }
    return null;
  };

  convertRZStatusToTag = status => {
    if (status === 'captured') {
      return <span className="label label-success">Success</span>;
    } else if (status === 'refuneded') {
      return <span className="label label-info">Refunded</span>;
    } else if (status === 'failed') {
      return <span className="label label-info">Failed</span>;
    }
    return <span className="label label-info">Pending</span>;
  };

  cardVerificationListener = isVerified => {
    this.setState({
      cardVerified: isVerified,
      loading: false,
    });
  };

  render() {
    const payments = [];
    this.props.payments
      .filter(payment => payment.paymentStatus > 1)
      .forEach(payment => {
        const pgResponse = payment.pgResponse && payment.pgResponse[0];
        payments.push({
          id: payment._id,
          paymentId: pgResponse && pgResponse.id,
          reason: payment.reason,
          createdAt: payment.createdAt,
          currency: pgResponse ? (pgResponse.notes && pgResponse.notes.display_currency) || 'inr' : 'usd',
          amount: pgResponse
            ? pgResponse.notes && pgResponse.notes.display_amount
              ? pgResponse.notes.display_amount
              : Math.round(Number(payment.amount) / Number(payment.conversionFactor), 2)
            : payment.conversionFactor
            ? Math.round(Number(payment.amount) / Number(payment.conversionFactor), 2)
            : payment.amount,
          status: payment.paymentStatus,
        });
      });
    let ids = payments.map(p => p.paymentId);
    this.props.rzPayments.forEach(payment => {
      if (!ids.includes(payment.id)) {
        payments.push({
          id: payment.id,
          reason: 'Monthly usage charges',
          createdAt: payment.createdAt * 1000,
          currency: 'inr',
          amount: Number(payment.amount / 100).toFixed(2),
          status: payment.status,
          refundedAt: payment.refundedAt,
        });
      }
    });
    this.props.stripePayments.forEach(payment => {
      if (!ids.includes(payment.id)) {
        payments.push({
          id: payment.id,
          reason: payment.description,
          createdAt: payment.created * 1000,
          currency: payment.currency,
          amount: payment.amount / 100,
          status: payment.status,
        });
      }
    });
    const pgPayments = [];
    return (
      <div className="networksList">
        <div className="m-t-20 container-fluid container-fixed-lg bg-white">
          <div className="row">
            <div className="col-lg-12">
              <div className="card card-transparent">
                <div className="card-header ">
                  <div className="card-title">Payments</div>
                  {/* <CardVerification cardVerificationListener={this.cardVerificationListener}/> */}
                </div>
                <div className="card-block">
                  <div className="table-responsive">
                    <table className="table table-hover" id="basicTable">
                      <thead>
                        <tr>
                          <th style={{ width: '22%' }}>Payment Ref.</th>
                          <th style={{ width: '30%' }}> For</th>
                          <th style={{ width: '20%' }}>Payment made on</th>
                          <th style={{ width: '18%' }}>Amount</th>
                          <th style={{ width: '10%' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments
                          .sort((a, b) => (moment(a.createdAt).isBefore(moment(b.createdAt)) ? 1 : -1))
                          .map(payment => {
                            return (
                              <tr
                                key={payment._id}
                                title={[3, 'refunded'].includes(payment.status) === 3 ? `Refund initiated at ${moment(payment.refundedAt).format('DD-MMM-YY kk:mm:ss')}` : null}
                              >
                                <td>{payment.paymentId || payment.id}</td>
                                <td>{Helpers.firstLetterCapital(payment.reason)}</td>
                                <td>{moment(payment.createdAt).format('DD-MMM-YY kk:mm:ss')}</td>
                                <td>{`${Helpers.getCurrencySymbol(payment.currency)} ${Number(payment.amount).toFixed(2)}`}</td>
                                <td>{this.convertStatusToTag(payment.status)}</td>
                              </tr>
                            );
                          })}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="5">
                            <p style={{ fontSize: '0.8em' }}>
                              Refunds will be completed within <b>5</b> working days
                            </p>
                          </td>
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
    payments: PaymentRequests.find({}).fetch(),
    rzPayments: RZPayments.find({}).fetch(),
    stripePayments: StripePayments.find({}).fetch(),
    subscriptions: [Meteor.subscribe('userPayments')],
  };
})(withRouter(PaymentDashboard));
