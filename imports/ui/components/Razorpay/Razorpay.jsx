import React from "react";
import PropTypes from 'prop-types';
import Config from '../../../modules/config/client';

class RazorPay extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: false
    };
  }

  triggerPayment = () => {
    this.setState({
      loading: true
    });
    const notes = Object.assign({}, this.props.paymentNotes);
    const user = Meteor.user();
    const defaultRazorpayOptions = {
      key: Config.razorpayId,
      name: 'Blockcluster',
      image: "https://app.blockcluster.io/assets/img/logo/blockcluster.png",
      prefill: {
        name: `${user.profile.firstName} ${user.profile.lastName}`,
        email: `${user.emails[0].address}`
      },
      theme: {
        color: '#004286'
      },
      notes: {
        ...notes
      },
      handler: response => {
        Meteor.call("capturePaymentRazorPay", response);
        if(this.props.paymentHandler) {
          this.props.paymentHandler(response);
        }
      },
      modal: {
        backdropclose: () => {
          if(this.props.modalBackDropCloseListener) {
            this.props.modalBackDropCloseListener();
          }
        },
        ondismiss: () => {
          if(this.props.modalDismissListener) {
            this.props.modalDismissListener();
          }
        }
      }
    };

    if(window.rzp1) {
      window.rzp1.open(defaultRazorpayOptions);
    }
  }

  render() {
    if (this.props.buttonLayout) {
      return this.props.buttonLayout;
    }

    return (
    <div className="razorpay-holder">
      <button className="btn btn-primary" 
        onClick={this.triggerPayment}
        disabled={this.state.loading}>
        { this.state.loading && <i className="fa fa-spin fa-spinner">></i> }Pay Now
      </button>
    </div>
    );
  }
}

RazorPay.propTypes = {
  modalDismissListener: PropTypes.func,
  modalBackDropCloseListener: PropTypes.func,
  paymentHandler: PropTypes.paymentHandler.isRequired,
  paymentNotes: PropTypes.object.isRequired,
  buttonLayout: PropTypes.node
}

export default RazorPay;