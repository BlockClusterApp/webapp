import React, { Component } from 'react';
import UserCards from '../../../../collections/payments/user-cards';
import Card from './Card.jsx';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';
import moment from 'moment';
import RazorPay from '../../../components/Razorpay/Razorpay';

import { withTracker } from 'meteor/react-meteor-data';
import { withRouter } from 'react-router-dom';

import './CardsAndNewPayment.scss';

const CARDS_IN_ROW = 3;
class CardsAndNewPayment extends Component {
  constructor(props) {
    super(props);

    this.state = {
      paymentMethod: 'credit',
    };
  }

  componentDidMount() {
    this.updateBilling();
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

  updateBilling() {
    Meteor.call(
      'fetchBilling',
      {
        userId: Meteor.userId(),
        month: moment()
          .subtract(1, 'month')
          .get('month'),
        year: moment()
          .subtract(1, 'month')
          .get('year'),
        isFromFrontend: true,
      },
      (err, reply) => {
        this.setState({
          bill: reply,
          loading: false,
        });
      }
    );
  }

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

  render() {
    const { user } = this.props;

    const cards = this.props.userCard ? this.props.userCard.cards : [];

    const cardsView = [];
    let currentRow = [];

    let paymentDisplay = null;
    if (this.state.bill && this.state.bill.invoiceStatus !== 2) {
      paymentDisplay = (
        <div className="alert alert-danger col-md-12">
          <div className="col-md-12 b-r b-dashed b-grey sm-b-b">
            <i className="fa fa-warning" /> Your bill for the month of{' '}
            {moment()
              .subtract(1, 'month')
              .format('MMM YYYY')}{' '}
            is pending. Kindly pay it before 10
            <sup>th</sup> of this month to avoid node deletions.
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

              {card.type === 'credit' && <p>You will recieve invoice on 1st of every month and bill amount will be auto deducted from your card on 5th of every month.</p>}

              {card.type === 'debit' && (
                <p>Bill will be generated on 1st of every month and sent via email. The invoice would have to be cleared before 10th of the month to prevent deletion of nodes.</p>
              )}
              <p className="small">To change the card associated with your account kindly raise a support ticket.</p>
            </div>
          </div>
          <div className="col-md-7">
            <div className="padding-30 sm-padding-5">
              <div key={`card_col_${index}`}>
                <Card last4={card.last4} name={card.name} network={card.network} key={`card_${index}`} />
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
    <div>{cardsView}
      <div className="row">
        {paymentDisplay}
      </div>
    </div>);

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
                {this.state.waitingForCards &&
                  cards.length === 0 && (
                    <div className="alert alert-info" style={{ textAlign: 'center', marginTop: '15px' }}>
                      <i className="fa fa-spin fa-spinner" /> Fetching your card details. Hold on a minute...
                    </div>
                  )}
              </div>
            </div>
            <div className="col-md-7">
              <div className="padding-30 sm-padding-5">
                <h5>Select Card Type</h5>
                <div className="row">
                  <div className="col-lg-7 col-md-6">
                    <p className="no-margin">Select a type of card you would like to add. </p>
                    <p className="small hint-text">We support all major card brands for both credit and debit cards.</p>
                  </div>
                  <div className="col-lg-5 col-md-6">
                    <div className="btn-group" data-toggle="buttons">
                      <label className="btn btn-default active" onClick={e => this.setState({ paymentMethod: 'credit' })}>
                        <input type="radio" name="options" id="option1" selected /> <span className="fs-16">Credit Card</span>
                      </label>
                      <label className="btn btn-default" onClick={e => this.setState({ paymentMethod: 'debit' })}>
                        <input type="radio" name="options" id="option2" /> <span className="fs-16">Debit Card</span>
                      </label>
                    </div>
                  </div>
                  <div className="col-md-12">
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

                    {/*(this.state.paymentMethod === 'credit' || this.state.paymentMethod === undefined) && (
                            <div className="card card-default bg-success">
                                <div className="card-header  separator">
                                  <div className="card-title">Note
                                  </div>
                                </div>
                                <div className="card-block">
                                  <h3>
                                      <span className="semi-bold">Auto</span> Debit </h3>
                                      <p className="hint-text">You will recieve invoice on 1st of every month and bill amount will be auto deducted from your card on 5th of every month.</p>
                                </div>
                              </div>

                        )*/}
                  </div>
                  <div className="col-md-12">
                    <RazorPay
                      buttonText="Add Card"
                      buttonIcon="fa-plus"
                      loading={this.state.loading || (this.state.waitingForCards && cards.length === 0)}
                      preTriggerPaymentListener={this.preTriggerPaymentListener}
                      paymentHandler={this.rzPaymentHandler}
                      modalDismissListener={this.modalDismissListener}
                    />
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
      <div className="row padding-25 saved-cards">
        <div className="card card-transparent">{displayView}</div>
      </div>
    );
  }
}

export default withTracker(() => {
  return {
    userCard: UserCards.find({ userId: Meteor.userId() }).fetch()[0],
    user: Meteor.user(),
    subscriptions: [Meteor.subscribe('userCards')],
  };
})(withRouter(CardsAndNewPayment));
