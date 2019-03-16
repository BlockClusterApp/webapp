import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter } from 'react-router-dom';

import RZPayments from '../../../../collections/razorpay/payments';
import StripePayments from '../../../../collections/stripe/payments';
import PaymentRequests from '../../../../collections/payments/payment-requests';
import moment from 'moment';
import Helpers from '../../../../modules/helpers';

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
    } else if (statusCode === 'failed' || statusCode === 4) {
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

  openPayment = payment => {
    this.setState(
      {
        payment,
      },
      () => {
        $('#modalSlideLeft_payload').modal('show');
      }
    );
  };

  render() {
    const payments = [];
    this.props.payments
      .filter(p => p.paymentStatus > 1 || p.failedReason)
      .forEach(payment => {
        const pgResponse = payment.pgResponse && payment.pgResponse[0];
        payments.push({
          id: payment._id,
          paymentId: pgResponse && pgResponse.id,
          reason: payment.reason,
          createdAt: payment.createdAt,
          currency: (() => {
            if (pgResponse && pgResponse.notes && pgResponse.notes.display_currency) {
              return pgResponse.notes.display_currency;
            }
            if (payment.paymentGateway === 'stripe') {
              return 'usd';
            }
            return 'inr';
          })(),
          amount: (() => {
            if (pgResponse && pgResponse.notes && pgResponse.notes.display_amount) {
              return pgResponse.notes.display_amount;
            }
            if (payment.paymentGateway === 'stripe') {
              return payment.amount;
            }
            if (payment.conversionFactor) {
              return Math.round(Number(payment.amount) / Number(payment.conversionFactor), 2);
            }
            return payment.amount;
          })(),
          status: payment.paymentStatus,
          failedReason: payment.failedReason,
          payment,
          type: 'request',
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
          payment,
          type: 'razorpay',
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
          payment,
          type: 'stripe',
        });
      }
    });

    const card = (() => {
      const pgResponse = this.state.payment && this.state.payment.payment.pgResponse;
      if (!pgResponse) {
        return null;
      }
      const a = pgResponse && pgResponse.find(r => !!r.card);
      if (a) {
        return a;
      }
      if (pgResponse && pgResponse[0] && typeof pgResponse[0].source === 'object') {
        if (pgResponse[0].source.card) {
          return pgResponse[0].source;
        }
      }
      if (pgResponse && pgResponse[0] && pgResponse[0].charge && typeof pgResponse[0].charge.source === 'object') {
        if (pgResponse[0].charge.source.card) {
          return pgResponse[0].charge.source;
        }
      }
      return null;
    })();
    const stripePayment =
      this.state.payment && this.state.payment.payment.paymentGateway === 'stripe' && this.state.payment.payment.pgResponse && this.state.payment.payment.pgResponse[0];

    const Modal = this.state.payment && (
      <div className="modal fade slide-right" id="modalSlideLeft_payload" tabIndex="-1" role="dialog" aria-hidden="true">
        <div className="modal-dialog modal-md">
          <div className="modal-content-wrapper">
            <div className="modal-content">
              <button type="button" className="close" data-dismiss="modal" aria-hidden="true">
                <i className="pg-close fs-14" />
              </button>
              <div className="container-xs-height full-height">
                <div className="row-xs-height">
                  <div className="modal-body col-xs-height col-middle ">
                    <h6 className="text-primary ">Payment: {this.state.payment._id || this.state.payment.id}</h6>
                    <div className="table-responsive">
                      <table className="table table-hover" id="basicTable">
                        <thead>
                          <tr>
                            <th style={{ width: '25%' }}>Details</th>
                            <th style={{ width: '75%' }}>&nbsp;</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Date</td>
                            <td>{moment(this.state.payment.createdAt).format('DD-MMM-YYYY kk:mm:ss')}</td>
                          </tr>
                          <tr>
                            <td>Reason</td>
                            <td>{Helpers.firstLetterCapital(this.state.payment.reason)}</td>
                          </tr>
                          {this.state.payment.metadata && this.state.payment.metadata.invoiceId && (
                            <tr>
                              <td>Invoice</td>
                              <td>{this.state.payment.metadata.invoiceId}</td>
                            </tr>
                          )}
                          <tr>
                            <td>Amount</td>
                            <td>
                              {Helpers.getCurrencySymbol(this.state.payment.currency.toLowerCase())}&nbsp;{this.state.payment.amount}
                            </td>
                          </tr>
                          {(card || stripePayment) && (
                            <tr>
                              <td>Card</td>
                              <td>
                                {card && card.card && (card.card.network || card.card.brand)}&nbsp;{card && card.card && card.card.last4}
                                {stripePayment && stripePayment.source.brand && `${stripePayment.source.brand} ${stripePayment.source.last4} - ${stripePayment.source.country}`}
                              </td>
                            </tr>
                          )}
                          <tr>
                            <td>Status</td>
                            <td>{this.convertStatusToTag(this.state.payment.status)}</td>
                          </tr>
                          {this.state.payment.failedReason && (
                            <tr>
                              <td>Failed Reason</td>
                              <td>{this.state.payment.failedReason}</td>
                            </tr>
                          )}
                          {this.state.payment.type === 'request' && this.state.payment.payment.pgResponse && (
                            <tr>
                              <td>History</td>
                              <td>
                                {this.state.payment.payment.pgResponse.map(res => {
                                  return (
                                    <li className="m-b-10">
                                      <div style={{ display: 'inline-table' }}>
                                        <b>Ref:</b>&nbsp;{res.id}
                                        <br />
                                        <b>Status:</b>&nbsp;{Helpers.firstLetterCapital(res.status) || 'Refund'}
                                        <br />
                                        <b>Time:</b>&nbsp;{moment(res.createdAt).format('DD-MMM-YYYY kk:mm:ss')}
                                      </div>
                                    </li>
                                  );
                                })}
                              </td>
                            </tr>
                          )}
                          {stripePayment && (
                            <tr>
                              <td>Receipt</td>
                              <td>
                                <a href={stripePayment.receipt_url || (stripePayment.charge && stripePayment.charge.receipt_url)} target="_blank">
                                  {stripePayment.receipt_url || (stripePayment.charge && stripePayment.charge.receipt_url)}
                                </a>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* <pre style={{ background: '#eee', padding: '5px' }}>{JSON.stringify(this.state.payment, null, 2)}</pre>
                    <br />
                    <br />

                    <br /> */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

    return (
      <div className="networksList">
        {Modal}
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
                                onClick={this.openPayment.bind(this, payment)}
                                title={[3, 'refunded'].includes(payment.status) === 3 ? `Refund initiated at ${moment(payment.refundedAt).format('DD-MMM-YY kk:mm:ss')}` : null}
                              >
                                <td>{payment.id || payment.paymentId}</td>
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
