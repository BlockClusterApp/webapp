import React from 'react';
import { CardElement, injectStripe, PaymentRequestButtonElement } from 'react-stripe-elements';
import PaymentRequests from '../../../../collections/payments/payment-requests';
import notifications from '../../../../modules/notifications';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';

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
    console.log('Can use payment request', result);
    if (result) {
      return this.setState({
        paymentRequestEnabled: true,
      });
    }
    // Use payment intents

    this.paymentRequest.on('token', token => {
      console.log('Payment request token', token);
    });
  };

  loadSubscription = () => {
    this.subscription = Meteor.subscribe(
      'paymentRequest.stripe',
      { id: this.props.match.params.id },
      {
        onReady: () => {
          const paymentRequest = PaymentRequests.findOne({ _id: this.props.match.params.id });

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
          source_data: { owner: { name: this.props.user.name, email: this.props.user.email }, token: token.token.id },
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
            setTimeout(() => window.close(), 1000);
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
      <form onSubmit={this.handleSubmit}>
        <div className="row">
          {this.state.paymentRequestEnabled && !this.state.disabled && (
            <div className="col-md-12">
              <div className="row">
                <div className="col-md-12">
                  <span style={{ fontSize: '24px' }}>Quick Pay: </span>
                </div>
                <div className="col-md-4">{this.state.paymentRequestEnabled && !this.state.disabled && <PaymentRequestButtonElement paymentRequest={this.paymentRequest} />}</div>
                <div className="col-md-4" />
              </div>
            </div>
          )}
        </div>
        {!this.state.disabled && (
          <div className="row m-t-25">
            <div className="col-md-12">
              <span style={{ fontSize: '24px' }}>Pay via Card:</span>
            </div>
          </div>
        )}
        {!this.state.disabled && (
          <div className="row m-t-20">
            <div className="col-md-12">
              <CardElement
                ref={e => (this.cardElement = e)}
                iconStyle="solid"
                style={{
                  invalid: {
                    iconColor: '#eb1c26',
                    color: '#eb1c26',
                  },
                  base: {
                    iconColor: 'rgb(0, 66, 134)',
                    color: '#222',
                    fontWeight: 500,
                    fontFamily: 'Roboto, Open Sans, Segoe UI, sans-serif',
                    fontSize: '24px',
                    fontSmoothing: 'antialiased',

                    ':-webkit-autofill': {
                      color: '#fce883',
                    },
                    '::placeholder': {
                      color: '#87BBFD',
                    },
                  },
                }}
              />
            </div>
          </div>
        )}
        <div className="row m-t-20">
          <div className="col-md-4" />
          <div className="col-md-4">
            <LaddaButton
              loading={this.state.loading}
              data-size={S}
              disabled={this.state.disabled}
              data-style={SLIDE_UP}
              data-spinner-size={30}
              data-spinner-lines={12}
              className="btn btn-info  btn-cons m-t-10 full-width"
              style={{ fontSize: '20px', padding: '15px' }}
              type="submit"
            >
              {this.state.disabled ? 'Paid. You may close this page' : 'Pay'}
            </LaddaButton>
          </div>
          <div className="col-md-4" />
        </div>
      </form>
    );
  }
}

export default injectStripe(CollectForm);
