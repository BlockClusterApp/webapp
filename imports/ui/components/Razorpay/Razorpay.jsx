import React from "react";
import PropTypes from 'prop-types';
import Config from '../../../modules/config/client';

import './Razorpay.scss';

class RazorPay extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: false
    };
  }

  triggerPayment = () => {
    if(this.props.preTriggerPaymentListener) {
      this.props.preTriggerPaymentListener();
    }
    this.setState({
      loading: true
    });
    const notes = Object.assign({}, this.props.paymentNotes);
    const user = Meteor.user();
    const razorpayOptions = {
      key: Config.razorpayId,
      amount: this.props.amount,
      name: 'Blockcluster',
      image: "/assets/img/logo/favicon-96x96.png",
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
        /* response: {razorpay_payment_id: "pay_AbpQVNsNRTkyKo"} */
        // Meteor.call("capturePaymentRazorPay", response);
        this.setState({
          loading: false
        });
        if(this.props.paymentHandler) {
          this.props.paymentHandler(response);
        }
      },
      modal: {
        backdropclose: () => {
          this.setState({
            loading: false
          });
          if(this.props.modalBackDropCloseListener) {
            this.props.modalBackDropCloseListener();
          }
        },
        ondismiss: () => {
          this.setState({
            loading: false
          });
          if(this.props.modalDismissListener) {
            this.props.modalDismissListener();
          }
        }
      }
    };

    if(!window.rzp1) {
      window.rzp1 = new window.Razorpay(razorpayOptions);
    } 
    window.rzp1.open();
  }

  render() { 
    return (<div className="razorpay-holder">
      <button className="btn btn-primary razorpay-payment-button" 
        onClick={this.triggerPayment}
        disabled={this.state.loading}>
        { this.state.loading && <i className="fa fa-spin fa-spinner">&nbsp;</i> }Pay Now
      </button>
    </div>
    );
  
  }
}

RazorPay.propTypes = {
  modalDismissListener: PropTypes.func,
  modalBackDropCloseListener: PropTypes.func,
  paymentHandler: PropTypes.func.isRequired,
  paymentNotes: PropTypes.object.isRequired,
  preTriggerPaymentListener: PropTypes.func,
  amount: PropTypes.number.isRequired
}

export default RazorPay;