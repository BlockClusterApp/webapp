import React, { Component } from 'react';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';
import UserCards from '../../../../collections/payments/user-cards';
import RZSubscription from '../../../../collections/razorpay/subscription';
import Invoice from '../../../../collections/payments/invoice';
import Card from './Card.jsx';
import PromotionalCredits from './PromotionalCredits';
import moment from 'moment';
import RazorPay from '../../../components/Razorpay/Razorpay';

import { withTracker } from 'meteor/react-meteor-data';
import { withRouter } from 'react-router-dom';

const html2pdf = require('html2pdf.js');

import './CardsAndNewPayment.scss';
import notifications from '../../../../modules/notifications';

const CARDS_IN_ROW = 3;

const billingLabel = `${moment()
  .subtract(1, 'month')
  .format('MMM-YYYY')}`;
class CardsAndNewPayment extends Component {
  constructor(props) {
    super(props);

    this.state = {
      paymentMethod: 'credit',
    };
  }

  preTriggerPaymentListener = () => {
    this.setState({
      loading: true,
    });
    return new Promise(resolve => {
      Meteor.call('createPaymentRequest', { amount: 500, reason: 'verification', paymentGateway: 'razorpay', mode: this.state.paymentMethod }, (err, res) => {
        if (err) {
          return this.setState({
            loading: false,
          });
        }
        resolve(res);
      });
    });
  };

  rzPaymentHandler = pgResponse => {
    Meteor.call('applyRZCardVerification', pgResponse, (err, res) => {
      this.setState({
        loading: false,
        waitingForCards: true,
      });
    });
  };

  modalDismissListener = () => {
    this.setState({
      loading: false,
    });
  };

  invoicePrePaymentTrigger = () => {
    return new Promise(resolve => {
      Meteor.call('createRequestForInvoice', { invoiceId: this.props.invoice._id }, (err, res) => {
        if (err) {
          return this.setState({
            loading: false,
          });
        }
        resolve(res);
      });
    });
  };

  invoicePaymentHandler = pgResponse => {
    Meteor.call('captureInvoicePayment', pgResponse, (err, res) => {
      this.setState({
        loading: false,
        waitingForCards: true,
      });
    });
  };

  downloadInvoice = () => {
    this.setState({
      downloading: true,
    });
    Meteor.call('generateInvoiceHTML', this.props.invoice._id, (err, res) => {
      this.setState({
        downloading: false,
      });
      if (err) {
        console.log(err);
        RavenLogger.log('Generate Invoice HTML err', {
          invoice: this.props.invoice._id,
          res,
        });
        notifications.err(err.reason);
        return false;
      }
      let a = document.createElement('a');
      a.href = 'data:application/octet-stream;base64,' + res;
      a.download = `BlockclusterBill-${this.props.invoice._id}.pdf`;
      a.click();
    });
  };

  makePayment = () => {
    this.setState({
      loading: true,
    });
    Meteor.call('initiateStripePayment', { invoiceId: this.props.invoice._id }, (err, res) => {
      this.setState({
        loading: false,
      });
      if (err) {
        return notifications.error(err.reason);
      }
      const user = {
        name: `${this.props.user.profile.firstName} ${this.props.user.profile.lastName}`,
        email: this.props.user.emails[0].address,
      };
      localStorage.setItem('user', JSON.stringify(user));
      const paymentRequestId = res.paymentRequestId;
      const w = window.open(`${window.location.origin}/payments/collect/${paymentRequestId}`);
      if (!w || w.closed || typeof w.closed == 'undefined') {
        alert('Your browser has blocked the popup. Kindly enable the popup to continue to payment');
      }
    });
  };

  verifyCard = () => {
    const user = {
      name: `${this.props.user.profile.firstName} ${this.props.user.profile.lastName}`,
      email: this.props.user.emails[0].address,
    };

    localStorage.setItem('user', JSON.stringify(user));

    const w = window.open(`${window.location.origin}/payments/card-verification`);
    if (!w || w.closed || typeof w.closed == 'undefined') {
      alert('Your browser has blocked the popup. Kindly enable the popup to continue to payment');
    }
  };

  render() {
    const { user } = this.props;

    let cards = this.props.userCard ? this.props.userCard.cards : [];

    cards = cards.filter(card => card.active !== false);

    const cardsView = [];
    let currentRow = [];

    let paymentDisplay = null;
    if (
      this.props.invoice &&
      ![2, undefined].includes(this.props.invoice.paymentStatus) &&
      !(this.props.rzSubscription && this.props.rzSubscription.bc_status === 'active') &&
      (this.props.user && !this.props.user.demoUser && !this.props.user.offlineUser)
    ) {
      paymentDisplay = Number(this.props.invoice.totalAmount) !== 0 && (
        <div className="alert alert-warning col-md-12 m-t-20">
          <div className="col-md-12 b-r b-dashed b-grey sm-b-b">
            <i className="fa fa-warning" /> Your bill for the month of&nbsp;
            {this.props.invoice.billingPeriodLabel}
            &nbsp; is pending. Kindly pay it before 10
            <sup>th</sup> of this month to avoid node deletions.
            <br />
            <div className="row" style={{ padding: '15px', paddingBottom: '5px' }}>
              <LaddaButton
                loading={this.state.downloading}
                data-size={S}
                data-style={SLIDE_UP}
                data-spinner-size={30}
                data-spinner-lines={12}
                className="btn btn-primary"
                onClick={this.downloadInvoice}
              >
                &nbsp;&nbsp;Download Invoice
              </LaddaButton>
              &nbsp;&nbsp;
              <LaddaButton
                loading={this.state.loading || (this.state.waitingForCards && cards.length === 0)}
                data-size={S}
                data-style={SLIDE_UP}
                data-spinner-size={30}
                data-spinner-lines={12}
                className="btn btn-success"
                onClick={this.makePayment}
              >
                &nbsp;&nbsp;Pay ${this.props.invoice.totalAmount}
              </LaddaButton>
            </div>
          </div>
        </div>
      );
    }

    if (user && user.paymentPending && this.props.invoice) {
      paymentDisplay = (
        <div className="alert alert-danger col-md-12">
          <div className="col-md-12 b-r b-dashed b-grey sm-b-b">
            <i className="fa fa-danger" /> <h3>Account suspended</h3>
            <br />
            <br />
            <p>
              Your account has been suspended due to non payment of invoice. All the functionalities have been disabled temporarily. If the payment is not made by 30th of this
              month, all your data will be deleted which would be an irreversible process.
            </p>
            <br />
            <div className="row" style={{ padding: '15px' }}>
              <button className="btn btn-primary" onClick={this.downloadInvoice}>
                Download Invoice
              </button>
              &nbsp;&nbsp;
              <RazorPay
                buttonText={`Pay $${this.props.invoice.totalAmount}`}
                buttonIcon="fa-open"
                loading={this.state.loading || (this.state.waitingForCards && cards.length === 0)}
                preTriggerPaymentListener={this.invoicePrePaymentTrigger}
                paymentHandler={this.invoicePaymentHandler}
                modalDismissListener={this.modalDismissListener}
              />
            </div>
            <div className="bottom" style={{ fontSize: '8px' }}>
              If you think this is an error, kindly raise a support ticket.
            </div>
          </div>
        </div>
      );
    } else if (user && user.paymentPending) {
      paymentDisplay = (
        <div className="alert alert-danger col-md-12">
          <div className="col-md-12 b-r b-dashed b-grey sm-b-b">
            <i className="fa fa-danger" /> <h3>Account suspended</h3>
            <p>
              Your account has been suspended by admin. Kindly raise a support ticket for details. Your data is safe but will be deleted on 30th of this month if no disputes arise.
            </p>
          </div>
        </div>
      );
    }

    cards.forEach((card, index) => {
      if (index % CARDS_IN_ROW === 0) {
        currentRow = [];
      }
      currentRow.push(
        /**/
        <div className="row row-same-height" key={`card_col_${index}`}>
          <div className="col-md-5 b-r b-dashed b-grey ">
            <div className="padding-30 sm-padding-5 sm-m-t-15">
              <i className="fa fa-credit-card fa-2x hint-text" />
              <h2>Your card is verified</h2>

              {!(this.props.rzSubscription && this.props.rzSubscription.bc_status === 'active') && (
                <p>You will receive invoice on 1st of every month and bill amount will be auto deducted from your card on 5th of every month.</p>
              )}

              {!!(this.props.rzSubscription && this.props.rzSubscription.bc_status === 'active') && (
                <p>Bill will be generated on 1st of every month and sent via email. The invoice would have to be cleared before 10th of the month to prevent deletion of nodes.</p>
              )}
            </div>
          </div>
          <div className="col-md-7">
            <div className="row">
              <div className="col-md-12">
                <div className="padding-30 sm-padding-5">
                  <div key={`card_col_${index}`}>
                    <Card last4={card.last4} name={card.name} network={card.network} key={`card_${index}`} />
                  </div>
                </div>
              </div>
              <div className="col-md-12 text-center">
                <LaddaButton
                  loading={this.state.loading}
                  data-size={S}
                  data-style={SLIDE_UP}
                  data-spinner-size={30}
                  data-spinner-lines={12}
                  className="btn btn-success btn-cons m-t-5 p-t-5 p-b-5"
                  onClick={this.verifyCard}
                >
                  &nbsp;&nbsp;Change Payment method
                </LaddaButton>
              </div>
            </div>
          </div>
        </div>
      );
      if (index % CARDS_IN_ROW === CARDS_IN_ROW - 1) {
        cardsView.push(
          <div className="row card-row" key={`card_row_${index}`}>
            {currentRow}
          </div>
        );
        currentRow = [];
      }
    });

    if (currentRow.length > 0) {
      cardsView.push(
        <div className="row card-row" key={`card_row_end`}>
          {currentRow}
        </div>
      );
      currentRow = [];
    }

    if (!user) {
      return (
        <div className="row padding-25 saved-cards">
          <div className="card card-transparent" />
        </div>
      );
    }

    const savedCardsView = (
      <div>
        {cardsView}
        <div className="row">{paymentDisplay}</div>
      </div>
    );

    const paymentVerificationView = (
      <div>
        <div className="tab-pane padding-20 sm-no-padding active slide-left" id="tab1">
          <div className="row row-same-height">
            <div className="col-md-5 b-r b-dashed b-grey sm-b-b">
              <div className="padding-30 sm-padding-5 sm-m-t-15">
                <i className="fa fa-cc-mastercard fa-2x hint-text" />
                &nbsp;
                <i className="fa fa-cc-visa fa-2x hint-text" />
                &nbsp;
                <i className="fa fa-cc-amex fa-2x hint-text" />
                <h2>Hey {user.profile.firstName}, Just one more thing...</h2>
                <p>We would need you to verify your payment method. Your card will be charged an initial amount of ~$1 which would be refunded with 5 working days</p>
                <p className="small hint-text">If you are facing issues while adding your card then please raise a support ticket.</p>
                {this.state.waitingForCards && cards.length === 0 && (
                  <div className="alert alert-info" style={{ textAlign: 'center', marginTop: '15px' }}>
                    <i className="fa fa-spin fa-spinner" /> Fetching your card details. Hold on a minute...
                  </div>
                )}
              </div>
            </div>
            <div className="col-md-7">
              <div className="padding-30 sm-padding-5">
                <h5>Payment Method</h5>
                <div className="row">
                  <div className="col-lg-12 col-md-12">
                    <p className="no-margin">
                      We will try to auto debit the bill from your payment method on 5th of every month. Incase the payment fails or if your card does not support auto debit, you
                      would have to clear the invoice before 10<sup>th</sup> of that month to avoid account suspension and data deletion.
                    </p>
                  </div>
                  {/* <div className="col-lg-5 col-md-6">
                    <div className="btn-group" data-toggle="buttons">
                      <label className="btn btn-default active" onClick={e => this.setState({ paymentMethod: 'credit' })}>
                        <input type="radio" name="options" id="option1" selected /> <span className="fs-16">Credit Card</span>
                      </label>
                      <label className="btn btn-default" onClick={e => this.setState({ paymentMethod: 'debit' })}>
                        <input type="radio" name="options" id="option2" /> <span className="fs-16">Debit Card</span>
                      </label>
                    </div>
                </div> */}
                  {/* <div className="col-md-12">
                    {this.state.paymentMethod === 'debit' && (
                      <div className="card card-default bg-warning">
                        <div className="card-header  separator">
                          <div className="card-title">Note</div>
                        </div>
                        <div className="card-block">
                          <h3>
                            Invoice <span className="semi-bold">Clearance</span>{' '}
                          </h3>
                          <p className="hint-text">
                            Bill will be generated on 1st of every month which would have to be cleared before 10th of the month. The invoice will be sent to you via email.
                          </p>
                        </div>
                      </div>
                    )}
                  </div> */}
                  <div className="col-md-12">
                    <LaddaButton
                      loading={this.state.loading || (this.state.waitingForCards && cards.length === 0)}
                      data-size={S}
                      data-style={SLIDE_UP}
                      data-spinner-size={30}
                      data-spinner-lines={12}
                      className="btn btn-success  btn-cons m-t-10 p-t-5 p-b-5"
                      onClick={this.verifyCard}
                    >
                      &nbsp;&nbsp;Add Payment Method
                    </LaddaButton>
                    {/* <RazorPay
                      buttonText="Add Card"
                      buttonIcon="fa-plus"
                      loading={this.state.loading || (this.state.waitingForCards && cards.length === 0)}
                      preTriggerPaymentListener={this.preTriggerPaymentListener}
                      paymentHandler={this.rzPaymentHandler}
                      modalDismissListener={this.modalDismissListener}
                    /> */}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {paymentDisplay}
        </div>
      </div>
    );

    let displayView = paymentVerificationView;
    if (cards.length > 0) {
      displayView = savedCardsView;
    }

    return (
      <div>
        <div className="row padding-25 saved-cards">
          <div className="card card-transparent">{displayView}</div>
        </div>
      </div>
    );
  }
}

export default withTracker(() => {
  return {
    userCard: UserCards.find({ userId: Meteor.userId() }).fetch()[0],
    user: Meteor.user(),
    invoice: Invoice.find({ userId: Meteor.userId(), paymentStatus: 1 }).fetch()[0],
    rzSubscription: RZSubscription.find({ userId: Meteor.userId() }).fetch()[0],
    subscriptions: [Meteor.subscribe('userCards'), Meteor.subscribe('pending-invoice', billingLabel), Meteor.subscribe('rzp-subscription')],
  };
})(withRouter(CardsAndNewPayment));
