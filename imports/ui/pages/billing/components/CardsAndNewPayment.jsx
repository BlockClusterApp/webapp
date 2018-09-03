import React, { Component } from 'react';
import UserCards from '../../../../collections/payments/user-cards';
import Card from './Card.jsx';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';
import RazorPay from '../../../components/Razorpay/Razorpay';

import { withTracker } from 'meteor/react-meteor-data';
import { withRouter } from 'react-router-dom';

import './CardsAndNewPayment.scss';

const CARDS_IN_ROW = 3;
class CardsAndNewPayment extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  preTriggerPaymentListener = () => {
    this.setState({
      loading: true
    });
    return new Promise((resolve) => {
      Meteor.call('createPaymentRequest', {amount: 500, reason: 'verification', paymentGateway: 'razorpay', mode: this.state.paymentMethod}, (err, res) => {
        if(err) {
          return this.setState({
            loading: false
          });
        }
        resolve(res);
      });
    });
  }


  rzPaymentHandler = (pgResponse) => {
    Meteor.call("applyRZCardVerification", pgResponse, (err, res) => {
      console.log("Applied Card Verification", res);
      this.setState({
        loading: false
      });
    });
  };


  render() {
    const { user } = this.props;

    const cards = this.props.userCard ? this.props.userCard.cards : [];

    const cardsView = [];
    let currentRow = [];
    cards.forEach((card, index) => {
      if (index % CARDS_IN_ROW === 0) {
        currentRow = [];
      }
      currentRow.push(
        <div className="col-md-4" key={`card_col_${index}`}>
          <Card last4={card.last4} name={card.name} network={card.network} key={`card_${index}`} />
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
        <h4>Hey {user.profile.firstName}</h4>
        You have verified the following cards for payment
        {cardsView}
      </div>
    );

    const paymentVerificationView = (
      <div>
        <h4>Hey {user.profile.firstName}, Just one more thing... </h4>
        <p>We would need you to verify your payment method</p>
        <div className="row">
          <div className="col-md-6">
            <div className={`card-custom ${this.state.paymentMethod === 'credit' ? 'selected' : ''}`} onClick={e => this.setState({ paymentMethod: 'credit' })}>
              <h4>Credit Card</h4>
              <p>The hassle free way. Your bill amount will be auto deducted from your card on 5th of every month.</p>
              {this.state.paymentMethod === 'credit' && (
                <p><small>Your card will be charged an initial amount of INR 5 which would be refunded with 5 working days</small></p>
              )}
            </div>
          </div>
          <div className="col-md-6">
            <div className={`card-custom ${this.state.paymentMethod === 'debit' ? 'selected' : ''}`} onClick={e => this.setState({ paymentMethod: 'debit' })}>
              <h4>Debit Card</h4>
              <p>Bill will be generated on 1st of every month which would have to be cleared by you before 10th of the month</p>
              {this.state.paymentMethod === 'debit' && (
                <p><small>Your card will be charged an initial amount of $1 which would be refunded with 5 working days</small></p>
              )}
            </div>
          </div>
        </div>
        <div className="row" style={{marginTop: '10px'}}>
          <div className="col-md-12">
            {this.state.paymentMethod && (
              <RazorPay
                buttonText="Verify"
                loading={this.state.loading}
                preTriggerPaymentListener={this.preTriggerPaymentListener}
                paymentHandler={this.rzPaymentHandler}
              />
            )}
          </div>
        </div>
      </div>
    );

    let displayView = paymentVerificationView;
    if(cards.length > 0) {
      displayView = savedCardsView;
    }

    return (
      <div className="row padding-25 saved-cards">
        <div className="card card-transparent">
          {displayView}
        </div>
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
