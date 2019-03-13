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

  componentDidMount = () => {
    Meteor.subscribe(
      'paymentRequest.stripe',
      { id: this.props.match.params.id },
      {
        onReady: () => {
          const paymentRequest = PaymentRequests.findOne({ _id: this.props.match.params.id });
          this.request = paymentRequest;

          this.loadPaymentRequest();
          this.props.paymentRequestLoadListener && this.props.paymentRequestLoadListener(paymentRequest);
        },
      }
    );
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
        console.log(err, res);

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
            notifications.success('Payment Successful');
          });
        }

        console.log('Payment intent', paymentIntent, error);
      });
    });
  };

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <div className="row">
          {this.state.paymentRequestEnabled && (
            <div className="col-md-12">
              <div className="row">
                <div className="col-md-12">
                  <span style={{ fontSize: '24px' }}>Quick Pay: </span>
                </div>
                <div className="col-md-4">{this.state.paymentRequestEnabled && <PaymentRequestButtonElement paymentRequest={this.paymentRequest} />}</div>
                <div className="col-md-4" />
              </div>
            </div>
          )}
        </div>
        <div className="row m-t-25">
          <div className="col-md-12">
            <span style={{ fontSize: '24px' }}>Pay via Card:</span>
          </div>
        </div>
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
        <div className="row m-t-20">
          <div className="col-md-4" />
          <div className="col-md-4">
            <LaddaButton
              loading={this.state.loading}
              data-size={S}
              data-style={SLIDE_UP}
              data-spinner-size={30}
              data-spinner-lines={12}
              className="btn btn-info  btn-cons m-t-10 full-width"
              style={{ fontSize: '20px', padding: '15px' }}
              type="submit"
            >
              Pay
            </LaddaButton>
          </div>
          <div className="col-md-4" />
        </div>
      </form>
    );
  }
}

export default injectStripe(CollectForm);
