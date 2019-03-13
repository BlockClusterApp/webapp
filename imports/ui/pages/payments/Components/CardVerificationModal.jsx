import React from 'react';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';
import { CardNumberElement, CardCVCElement, CardExpiryElement, injectStripe, PostalCodeElement } from 'react-stripe-elements';
import notifications from '../../../../modules/notifications';

import './Styles.scss';

class CardForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  handleSubmit = e => {
    const user = Meteor.user();
    e.preventDefault();
    this.setState({
      loading: true,
    });
    this.props.stripe.createToken({ name: this.props.user.profile.firstName, email: this.props.user.emails[0].address }).then(token => {
      if (!(token && token.token)) {
        this.setState({
          loading: false,
        });
        return notifications.error('Verification Failed');
      }
      Meteor.call('captureStripeCustomer', { token: token.token }, (err, data) => {
        this.setState({
          loading: false,
        });
        if (err) {
          return notifications.error(err.reason);
        }
        notifications.success('Verified');
        this.props.completeListener && this.props.completeListener();
      });
    });
  };

  render() {
    return (
      <form onSubmit={this.handleSubmit} className="stripe">
        <div className="row">
          <div className="col-md-12">
            <h3 className="text-primary">Card Verification</h3>
          </div>
          <div className="col-md-12 card-icons">
            <i className="fa fa-cc-visa" />
            &nbsp;
            <i className="fa fa-cc-mastercard" />
            &nbsp;
            <i className="fa fa-cc-amex" />
            &nbsp;
            <i className="fa fa-cc-diners-club" />
            &nbsp;
            <i className="fa fa-cc-jcb" />
            &nbsp;
            <i className="fa fa-cc-discover" />
            &nbsp;
          </div>
          <div className="col-md-12 p-l-0 p-r-0">
            <div className="field-container">
              <label for="cardnumber">Card Number</label>
              <CardNumberElement className="checkout-element" />
            </div>
          </div>
          <div className="col-md-6 p-l-0">
            <div className="field-container">
              <label for="cardnumber">Expiry (mm/yy)</label>
              <CardExpiryElement className="checkout-element" />
            </div>
          </div>
          <div className="col-md-6 p-r-0">
            <div className="field-container">
              <label for="cardnumber">Security Code</label>
              <CardCVCElement className="checkout-element" />
            </div>
          </div>
          <div className="col-md-12 p-r-0 p-l-0">
            <div className="field-container">
              <label for="cardnumber">Postal Code</label>
              <PostalCodeElement className="checkout-element" />
            </div>
          </div>
        </div>
        <div className="row m-t-10">
          <div className="col-md-12">
            <LaddaButton
              loading={this.state.loading}
              data-size={S}
              data-style={SLIDE_UP}
              data-spinner-size={30}
              data-spinner-lines={12}
              className="btn btn-info  btn-cons m-t-10 full-width"
              style={{ fontSize: '16px', padding: '8px' }}
              type="submit"
            >
              {/* <i className="fa fa-cc-stripe" />&nbsp;&nbsp;*/} Verify
            </LaddaButton>
          </div>
        </div>
      </form>
    );
  }
}

export default injectStripe(CardForm);
