import React from 'react';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';
import { CardElement, injectStripe } from 'react-stripe-elements';
import notifications from '../../../../modules/notifications';

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
    this.props.stripe.createToken({ name: this.props.user.name, email: this.props.user.email }).then(token => {
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
        console.log(err, data);
        if (err) {
          return notifications.error(err.reason);
        }
        notifications.success('Verified');
        setTimeout(() => window.close(), 1000);
      });
    });
  };

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <div className="row">
          <div className="col-md-12">
            <CardElement
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
              Verify
            </LaddaButton>
          </div>
          <div className="col-md-4" />
        </div>
      </form>
    );
  }
}

export default injectStripe(CardForm);
