import React from 'react';
import { StripeProvider, Elements } from 'react-stripe-elements';
import CardVerificationModal from './Components/CardVerificationModal';

const API_KEY = (() => {
  if (window.location.origin.includes('app.blockcluster.io')) {
    return 'pk_live_hF3K5iZix2h0QBG5Suyj7eHY';
  }
  return 'pk_test_M9GRhEchj7TJtLXAgFXRL9kO';
})();

class StripeCheckoutModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      displayed: false,
      user: Meteor.user(),
    };
  }

  open = () => {
    $('#stripe_modal').modal('show');
  };

  close = () => {
    $('#stripe_modal').modal('hide');
  };

  componentDidMount() {
    this.props.toggleFunctions && this.props.toggleFunctions(this.open, this.close);
  }

  completeListener = () => {
    this.close();
  };

  render() {
    return (
      <div className="modal fade slide-right" id="stripe_modal" tabIndex="-1" role="dialog" aria-hidden="true">
        <div className="modal-dialog modal-md">
          <div className="modal-content-wrapper">
            <div className="modal-content">
              <button type="button" className="close" data-dismiss="modal" aria-hidden="true">
                <i className="pg-close fs-14" />
              </button>
              <div className="container-xs-height full-height">
                <div className="row-xs-height">
                  <div className="modal-body col-xs-height col-middle ">
                    <StripeProvider apiKey={API_KEY} betas={['payment_intent_beta_3']}>
                      <Elements>
                        <CardVerificationModal user={this.state.user} completeListener={this.completeListener} />
                      </Elements>
                    </StripeProvider>
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

export default StripeCheckoutModal;
