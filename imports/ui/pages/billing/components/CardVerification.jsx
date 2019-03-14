import React from 'react';
import RazorPay from '../../../components/Razorpay/Razorpay';
import { Link } from 'react-router-dom';

import './CardVerification.scss';

export default class CardVerification extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      showModal: false,
      loading: false,
      cardVerificationStatus: undefined,
    };
  }

  checkCardStatus = () => {
    Meteor.call('shouldShowCreditCardVerification', (err, reply) => {
      if (err) {
        return console.log(err);
      }
      if (this.props.cardVerificationListener) {
        this.props.cardVerificationListener(!!reply);
      }
      this.setState({
        cardVerificationStatus: !!reply,
        loading: false,
      });
    });
  };

  componentDidMount() {
    this.checkCardStatus();
  }

  render() {
    const Message = (
      <div className="card-verification">
        <div className="alert alert-danger">
          <div className="row clearfix">
            <div className="col-md-12">
              You need to <Link to="/app/payments">verify your credit card</Link> before you can create nodes.
            </div>
          </div>
        </div>
      </div>
    );

    return this.state.cardVerificationStatus === false ? Message : <p />;
  }
}
