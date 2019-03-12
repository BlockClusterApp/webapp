import React from 'react';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';
import { CardElement, injectStripe } from 'react-stripe-elements';

class CardForm extends React.Component {
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
              data-size={S}
              data-style={SLIDE_UP}
              data-spinner-size={30}
              data-spinner-lines={12}
              className="btn btn-info  btn-cons m-t-10 full-width"
              style={{ fontSize: '20px', padding: '15px' }}
              type="submit"
            >
              <i className="fa fa-upload" aria-hidden="true" />
              &nbsp;&nbsp;Verify
            </LaddaButton>
          </div>
          <div className="col-md-4" />
        </div>
      </form>
    );
  }
}

export default injectStripe(CardForm);
