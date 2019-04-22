import React from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter } from 'react-router-dom';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';

import PaymentModal from './PaymentModal';
import PaymentRequests from '../../../../../collections/payments/payment-requests';
import notifications from '../../../../../modules/notifications';
import { RZPaymentLink } from '../../../../../collections/razorpay';

class Payments extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedPayment: {},
    };
  }

  refundListener = () => {
    this.setState({
      showPaymentModal: false,
    });
  };

  createPaymentLink = () => {
    this.setState({
      paymentLinkLoading: true,
    });

    const params = {
      reason: this.paymentLinkReason.value,
      amountInUSD: Number(this.paymentLinkAmount.value),
      userId: this.props.match.params.id,
    };

    Meteor.call('createPaymentLink', params, (err, res) => {
      this.setState({
        paymentLinkLoading: false,
      });
      if (err) {
        notifications.error(err.reason);
        return false;
      }
      this.setState({
        generatedLink: res,
      });
      notifications.success('Payment Link created');
    });
  };

  cancelPaymentLink = paymentLinkId => {
    this.setState({
      paymentLinkLoading: true,
    });
    Meteor.call('cancelPaymentLink', { paymentLinkId, userId: Meteor.userId(), reason: `Deleted by ${Meteor.user().emails[0].address}` }, (err, res) => {
      this.setState({
        paymentLinkLoading: false,
      });
      if (err) {
        return notifications.error(err.reason);
      }
      this.setState({
        generatedLink: null,
      });
      notifications.success('Link deleted successfully');
      return true;
    });
  };

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

  convertStatusToTag = statusCode => {
    if (statusCode === 2) {
      return <span className="label label-success">Success</span>;
    } else if (statusCode === 3) {
      return <span className="label label-info">Refunded</span>;
    }
    return null;
  };

  convertPaymentLinkStatusToTag = status => {
    if (status === 'issued') {
      return <span className="label label-info">Issued</span>;
    } else if (status === 'paid') {
      return <span className="label label-success">Paid</span>;
    } else if (status === 'cancelled') {
      return <span className="label label-danger">Cancelled</span>;
    } else {
      return <span className="label label-info">{status}</span>;
    }
  };

  modalEventFns = (open, close) => {
    this.openPaymentModal = open;
    this.closePaymentModal = close;
  };

  render() {
    const { payments, paymentLinks } = this.props;
    return (
      <div className="row">
        <PaymentModal
          payment={this.state.selectedPayment}
          paymentLink={paymentLinks && this.state.selectedPayment && paymentLinks.find(link => link.paymentRequestId === this.state.selectedPayment._id)}
          refundListener={this.refundListener}
          modalEventFns={this.modalEventFns}
        />
        <div className="col-md-6 col-sm-12">
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
                <h2 className="text-success no-margin">Payments</h2>
                <p className="no-margin">Previous Payments</p>
              </div>
              <h3 className="pull-right semi-bold">{payments && payments.length}</h3>
              <div className="clearfix" />
            </div>
            <div className="auto-overflow -table" style={{ maxHeight: '275px' }}>
              <table className="table table-condensed table-hover">
                <tbody>
                  {payments &&
                    payments
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((payment, index) => {
                        return (
                          <tr
                            key={index + 1}
                            onClick={() => {
                              this.setState({
                                selectedPayment: payment,
                              });
                              this.openPaymentModal();
                            }}
                          >
                            <td className="font-montserrat all-caps fs-12 w-40">{payment.reason}</td>
                            <td className="text-right b-r b-dashed b-grey w-25">₹{payment.amount / 100}</td>
                            <td className="w-25">
                              <span className="font-montserrat fs-18">{this.convertStatusToTag(payment.paymentStatus)}</span>
                            </td>
                          </tr>
                        );
                      })}
                  {!payments && (
                    <tr>
                      <td className="font-montserrat fs-12 w-100">No Payment details yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-sm-12">
          <div className=" card no-border card-condensed no-margin widget-loader-circle align-self-stretch d-flex flex-column">
            <div className="padding-25">
              <div className="pull-left">
                <h2 className="text-success no-margin">Payment Links</h2>
                <p className="no-margin">All Payment Links</p>
              </div>
              <h3 className="pull-right semi-bold">{paymentLinks && paymentLinks.length}</h3>
              <div className="clearfix" />
            </div>
            <div className="auto-overflow -table" style={{ maxHeight: '275px' }}>
              <table className="table table-condensed table-hover">
                <tbody>
                  {paymentLinks &&
                    paymentLinks.map((paymentLink, index) => {
                      return (
                        <tr key={index + 1}>
                          <td className="font-montserrat fs-12 w-40" title={paymentLink.link}>
                            <a href={paymentLink.short_url} target="_blank">
                              {paymentLink.short_url}
                            </a>
                          </td>
                          <td className="text-right b-r b-dashed b-grey w-30" title={paymentLink.reason}>
                            {paymentLink.description}
                          </td>
                          <td className="w-15">{this.convertPaymentLinkStatusToTag(paymentLink.status)}</td>
                          <td className="w-10">
                            <div className="btn-group">
                              <button className="btn btn-default" onClick={this.copyText.bind(this, paymentLink.short_url)} title="copy">
                                <i className="fa fa-copy" />
                              </button>
                              <button className="btn btn-default" onClick={this.cancelPaymentLink.bind(this, paymentLink._id)} title="delete">
                                <i className="fa fa-trash" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  {!paymentLinks && (
                    <tr>
                      <td className="font-montserrat fs-12 w-100">No Payment Links yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-lg-12 m-b-10 d-flex b-transparent-background b-t-15">
          <div className=" card no-border card-condensed no-margin widget-loader-circle align-self-stretch d-flex flex-column">
            <div className="padding-25">
              <div className="pull-left">
                <h2 className="text-success no-margin">Actions</h2>
              </div>
            </div>
            <div className="row p-b-25">
              <div className="p-l-25 p-r-25 col-md-12">
                <h5 className="no-margin p-b-10">Create Payment Link</h5>
                <div className="row">
                  <div className="col-md-7">
                    <div className="form-group form-group-default required">
                      <label>Reason</label>
                      <input
                        type="text"
                        className="form-control"
                        name="paymentReason"
                        required
                        ref={input => {
                          this.paymentLinkReason = input;
                        }}
                      />
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="form-group form-group-default required">
                      <label>Amount (IN USD)</label>
                      <input
                        type="number"
                        className="form-control"
                        name="paymentAmount"
                        placeholder="$"
                        required
                        ref={input => {
                          this.paymentLinkAmount = input;
                        }}
                      />
                    </div>
                  </div>
                  <div className="col-md-2">
                    <LaddaButton
                      disabled={this.state.paymentLinkCreationDisabled}
                      loading={this.state.paymentLinkLoading}
                      data-size={S}
                      data-style={SLIDE_UP}
                      data-spinner-size={30}
                      data-spinner-lines={12}
                      onClick={this.createPaymentLink}
                      className="btn btn-success"
                    >
                      <i className="fa fa-plus-circle" aria-hidden="true" />
                      &nbsp;&nbsp;Create
                    </LaddaButton>
                  </div>
                </div>
                {this.state.generatedLink && (
                  <div className="row">
                    <div className="col-md-7">
                      <div className="form-group form-group-default required">
                        <label>Link</label>
                        <input type="text" className="form-control" name="paymentReason" disabled value={this.state.generatedLink.short_url} />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <LaddaButton
                        disabled={this.state.paymentLinkDeletionDisabled}
                        loading={this.state.paymentLinkLoading}
                        data-size={S}
                        data-style={SLIDE_UP}
                        data-spinner-size={30}
                        data-spinner-lines={12}
                        onClick={this.cancelPaymentLink.bind(this, this.state.generatedLink._id)}
                        className="btn btn-danger"
                      >
                        <i className="fa fa-minus-circle" aria-hidden="true" />
                        &nbsp;&nbsp;Delete
                      </LaddaButton>
                    </div>
                  </div>
                )}
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
    credits: PaymentRequests.find({ userId: props.match.params.id }).fetch(),
    paymentLinks: RZPaymentLink.find({ userId: props.match.params.id }).fetch(),
    subscriptions: [Meteor.subscribe('user.details.payments', { userId: props.match.params.id }), Meteor.subscribe('user.details.paymentLinks', { userId: props.match.params.id })],
  };
})(withRouter(Payments));
