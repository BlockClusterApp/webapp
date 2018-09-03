import React, { Component } from "react";
import { withTracker } from "meteor/react-meteor-data";
import { withRouter } from "react-router-dom";

import RZPayments from '../../../../collections/razorpay/payments';
import PaymentRequests from '../../../../collections/payments/payment-requests';
import moment from 'moment';
import Helpers from '../../../../modules/helpers';
import CardVerification from '../components/CardVerification.jsx';

import "../Dashboard.scss";

class PaymentDashboard extends Component {
  constructor(props) {
    super(props);

    this.state = {
      locations: []
    };
  }

  componentWillUnmount() {
    this.props.subscriptions.forEach(s => {
      s.stop();
    });
  }

  componentDidMount() {
  }

  getLocationName = locationCode => {
    const locationConfig = this.state.locations.find(
      a => a.locationCode === locationCode
    );
    if (!locationConfig) {
      return undefined;
    }
    return locationConfig.locationName;
  };


  convertStatusToTag = (statusCode) => {
    if(statusCode === 2) {
      return <span className="label label-success">Success</span>
    } else if(statusCode === 3){
      return <span className="label label-info">Refunded</span>;
    }
    return null;
  }

  convertRZStatusToTag = (status) => {
    if(status === 'captured') {
      return <span className="label label-success">Success</span>
    } else if(status === 'refuneded'){
      return <span className="label label-info">Refunded</span>;
    } else if(status === 'failed') {
      return <span className="label label-info">Failed</span>;
    }
    return <span className="label label-info">Pending</span>;
  }

  cardVerificationListener = (isVerified) => {
    this.setState({
      cardVerified: isVerified,
      loading: false
    })
  }



  render() {
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
                          <th style={{ width: "20%" }}>Payment Ref.</th>
                          <th style={{width: "20%"}}> For</th>
                          <th style={{ width: "20%" }}>Payment made on</th>
                          <th style={{ width: "20%" }}>Amount</th>
                          <th style={{ width: "20%" }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {this.props.payments.filter(payment => payment.paymentStatus > 1).map(payment => {
                          payment.pgResponse && pgPayments.push(...payment.pgResponse.map(g => g.id));
                          const pgResponse = payment.pgResponse && payment.pgResponse.find(g => g.status === 'captured');
                          return (
                            <tr key={payment._id} title={payment.paymentStatus === 3 ? `Refund initiated at ${moment(payment.refundedAt).format('DD-MMM-YY HH:mm:SS')}` : null}>
                              <td>{payment._id}</td>
                              <td>{Helpers.firstLetterCapital(payment.reason)}</td>
                              <td>{moment(payment.createdAt).format('DD-MMM-YY HH:mm:SS')}</td>
                              <td>{pgResponse && pgResponse.notes && pgResponse.notes.display_amount ? `${Helpers.getCurrencySymbol(pgResponse.notes.display_currency)} ${Number(pgResponse.notes.display_amount).toFixed(2)}`  : `INR ${Number(payment.amount / 100).toFixed(2)}`}</td>
                              <td>{this.convertStatusToTag(payment.paymentStatus)}</td>
                            </tr>
                          )
                        })}
                        {this.props.rzPayments.filter(payment => !pgPayments.includes(payment.id)).map(payment => {
                          return (
                            <tr key={payment.id} title={payment.status === 'refunded' ? `Refund initiated at ${moment(payment.created_at * 1000).format('DD-MMM-YY hh:mm:SS A')}` : null}>
                              <td>{payment.id}</td>
                              <td>Monthly usage charges</td>
                              <td>{moment(payment.created_at * 1000).format('DD-MMM-YY HH:mm:SS')}</td>
                              <td>INR {Number(payment.amount / 100).toFixed(2)}</td>
                              <td>{this.convertRZStatusToTag(payment.status)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="5"><p style={{fontSize: '0.8em'}}>Refunds will be completed within <b>5</b> working days</p></td>
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
    subscriptions: [Meteor.subscribe("userPayments")]
  };
})(withRouter(PaymentDashboard));
