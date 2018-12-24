import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter } from 'react-router-dom';
import moment from 'moment';

import Credits from '../../../../collections/payments/credits';
import PromotionalCredits from './PromotionalCredits';

const PAGE_LIMIT = 20;

class RedemptionHistory extends Component {
  render() {
    const txns = [];
    this.props.credits.forEach(credit => {
      txns.push({
        amount: `+ $${credit.amount}`,
        description: `Redeemed using code ${credit.code}`,
        date: credit.createdAt,
      });
      if (credit.metadata && credit.metadata.invoices) {
        credit.metadata.invoices.forEach(invoice => {
          txns.push({
            amount: `- $${invoice.amount}`,
            description: `Used for settling invoice ${invoice.invoiceId}`,
            date: invoice.claimedOn,
          });
        });
      }
    });

    return (
      <div className="card-block">
        <div className="row">
          <PromotionalCredits />
        </div>
        <div className="row">
          <div className="col-md-12">
            <div className="table-responsive">
              <table className="table table-hover" id="basicTable">
                <thead>
                  <tr>
                    <th style={{ width: '5%' }}>S.No</th>
                    <th style={{ width: '25%' }}>Amount</th>
                    <th style={{ width: '50%' }}>Description</th>
                    <th style={{ width: '20%' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {txns.map((txn, index) => {
                    return (
                      <tr key={index + 1}>
                        <td>{index + 1}</td>
                        <td>{txn.amount}</td>
                        <td>{txn.description}</td>
                        <td>{moment(txn.date).format('DD-MMM-YYYY HH:mm')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withTracker(() => {
  return {
    credits: Credits.find({ userId: Meteor.userId() }).fetch(),
    subscriptions: [Meteor.subscribe('credits.all')],
  };
})(withRouter(RedemptionHistory));
