import React from 'react';
import { CardNumberElement, CardCVCElement, CardExpiryElement, injectStripe, PostalCodeElement, PaymentRequestButtonElement } from 'react-stripe-elements';
import PaymentRequests from '../../../../collections/payments/payment-requests';
import notifications from '../../../../modules/notifications';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';

import './Styles.scss';

class CollectForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      paymentRequestEnabled: false,
    };
  }

  loadPaymentRequest = async () => {
    const paymentRequest = this.request;
    if (!paymentRequest) {
      return notifications.error('Bad request');
    }
    this.paymentRequest = this.props.stripe.paymentRequest({
      country: 'US',
      currency: 'usd',
      total: {
        amount: paymentRequest.amount * 100,
        label: paymentRequest.reason,
      },
      displayItems: [
        {
          amount: paymentRequest.amount * 100,
          label: paymentRequest.reason,
        },
      ],
      requestPayerName: true,
      requestPayerEmail: true,
      requestPayerPhone: true,
    });

    const result = await this.paymentRequest.canMakePayment();
    if (result) {
      return this.setState({
        paymentRequestEnabled: true,
      });
    }
    // Use payment intents

    this.paymentRequest.on('token', token => {
      // TODO: handle this
      console.log('Payment request token', token);
    });
  };

  loadSubscription = () => {
    this.subscription = Meteor.subscribe(
      'paymentRequest.stripe',
      { id: this.props.paymentRequestId },
      {
        onReady: () => {
          const paymentRequest = PaymentRequests.findOne({ _id: this.props.paymentRequestId });

          const user = Meteor.users.findOne({ _id: paymentRequest.userId });
          this.request = paymentRequest;

          this.props.paymentRequestLoadListener && this.props.paymentRequestLoadListener({ paymentRequest, user });
          if (![PaymentRequests.StatusMapping.Pending, PaymentRequests.StatusMapping.Failed].includes(paymentRequest.paymentStatus)) {
            return this.setState({
              disabled: true,
            });
          }
          this.loadPaymentRequest();
        },
      }
    );
  };

  componentDidMount = () => {
    this.loadSubscription();
  };

  componentWillUnmount = () => {
    this.subscription.stop();
  };

  handleSubmit = e => {
    e.preventDefault();
    this.setState({
      loading: true,
    });
    this.props.stripe.createToken({ name: this.props.user.name, email: this.props.user.email }).then(token => {
      if (!(token && token.token)) {
        this.setState({
          loading: false,
        });
        return notifications.error('Verification Failed');
      }
      Meteor.call('initiateStripePaymentIntent', { paymentRequestId: this.request._id }, async (err, res) => {
        if (err) {
          this.setState({
            loading: false,
          });
          return notifications.error(err.reason);
        }
        const { paymentIntent, error } = await this.props.stripe.handleCardPayment(res.client_secret, {
          source_data: { owner: { name: this.props.user.profile.firstName, email: this.props.user.emails[0].address }, token: token.token.id },
        });

        if (error) {
          return notifications.error(error);
        }

        if (paymentIntent.status === 'succeeded') {
          // Mark paid
          Meteor.call('recordStripePayment', { intent: paymentIntent }, (_err, _data) => {
            this.setState({
              loading: false,
            });
            if (_err) {
              return notifications.error(_err.reason);
            }
            this.loadSubscription();
            notifications.success('Payment Successful');
            this.props.completeListener && this.props.completeListener();
          });
        } else {
          this.loadSubscription();
          notifications.error('Some error');
        }
      });
    });
  };

  render() {
    return (
      <form onSubmit={this.handleSubmit} className="stripe">
        {/* <div className="row">
          {this.state.paymentRequestEnabled && !this.state.disabled && (
            <div className="col-md-12">
              <div className="row">
                <div className="col-md-12">
                  <span style={{ fontSize: '20px' }}>Quick Pay: </span>
                </div>
                <div className="col-md-12 p-l-0 p-r-0">
                  {this.state.paymentRequestEnabled && !this.state.disabled && <PaymentRequestButtonElement paymentRequest={this.paymentRequest} className="full-width" />}
                </div>
              </div>
            </div>
          )}
        </div> */}
        <div className="row m-t-25">
          <div className="col-md-12">
            <span style={{ fontSize: '20px' }}>Pay via Card:</span>
          </div>
        </div>
        <div className="col-md-12 card-icons p-l-0 -p-r-0">
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
        {!this.state.disabled && (
          <div className="row">
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
        )}
        <div className="row m-t-20">
          <div className="col-md-12">
            <LaddaButton
              loading={this.state.loading}
              data-size={S}
              disabled={this.state.disabled}
              data-style={SLIDE_UP}
              data-spinner-size={30}
              data-spinner-lines={12}
              className="btn btn-info  btn-cons m-t-10 full-width"
              style={{ fontSize: '16px', padding: '8px' }}
              type="submit"
            >
              {this.state.disabled ? 'Paid' : 'Pay'}
            </LaddaButton>
          </div>
        </div>
      </form>
    );
  }
}

export default injectStripe(CollectForm);
