import React, { Component } from 'react';
import UserCards from '../../../../collections/payments/user-cards';
import Card from './Card.jsx';

import { withTracker } from "meteor/react-meteor-data";
import { withRouter } from "react-router-dom";

import './CardsAndNewPayment.scss';

const CARDS_IN_ROW = 3;
class CardsAndNewPayment extends Component {
  render() {
    const cards = this.props.userCard ? this.props.userCard.cards : [];

    const cardsView = [];
    let currentRow = [];
    cards.forEach((card, index) => {
      if(index % CARDS_IN_ROW === 0) {
        currentRow = [];
      }
      currentRow.push(<div className="col-md-4" key={`card_col_${index}`}><Card last4={card.last4} name={card.name} network={card.network} key={`card_${index}`} /></div>);
      if(index % CARDS_IN_ROW === CARDS_IN_ROW - 1) {
        cardsView.push(
          <div className="row card-row" key={`card_row_${index}`}>
            {currentRow}
          </div>
        )
        currentRow = [];
      }
    });

    if(currentRow.length > 0) {
      cardsView.push(
        <div className="row card-row" key={`card_row_end`}>
          {currentRow}
        </div>
      )
      currentRow = [];
    }

    return (
      <div className="row padding-25 saved-cards">
        <div className="card card-transparent">
          <h3>Saved Cards &amp; Payments</h3>
          {cardsView}
        </div>
      </div>
    );
  }
}

export default withTracker(() => {
  return {
    userCard: UserCards.find({userId: Meteor.userId()}).fetch()[0],
    subscriptions: [Meteor.subscribe('userCards')],
  };
})(withRouter(CardsAndNewPayment));
