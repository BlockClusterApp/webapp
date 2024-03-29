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

  componentDidMount() {
    Meteor.call('getRazorPayId', (err, res) => {
      if(err){
        return alert("Internal error. Kindly reload page");
      }
      this.razorpayId = res;
    });
  }

  triggerRazorPay = (customOptions) => {
    this.setState({
      loading: true
    });

    const testOptions = {
      paymentRequestId: 'test123'
    }

    const notes = Object.assign(testOptions, customOptions, {}, this.props.paymentNotes);
    const user = Meteor.user();

    const amount =  this.props.amount || customOptions.amount || 0;
    if(String(amount).includes(".")) {
      return console.log("Amount is not in paisa");
    }
    if(!notes.paymentRequestId) {
      return console.log("Payment request id is required for razorpay");
    }

    if(!this.razorpayId){
      return alert("Internal error. Kindly reload page");
    }

    const razorpayOptions = {
      key: this.razorpayId,
      amount,
      name: 'Blockcluster',
      image: "/assets/img/logo/favicon-96x96.png",
      prefill: {
        name: `${user.profile.firstName} ${user.profile.lastName}`,
        email: `${user.emails[0].address}`,
        method: 'card'
      },
      readonly: {
        email: true
      },
      theme: {
        color: '#004286'
      },
      notes: {
        ...notes
      },
      handler: response => {
        /* response: {razorpay_payment_id: "pay_AbpQVNsNRTkyKo"} */
        Meteor.call("capturePaymentRazorPay", response, () => {
          this.setState({
            loading: false
          });
          if(this.props.paymentHandler) {
            this.props.paymentHandler(response);
          }
        });
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

    if(notes.rzSubscriptionId) {
      razorpayOptions.subscription_id = notes.rzSubscriptionId;
      delete razorpayOptions.amount;
    }

    if(notes.display_amount && notes.display_currency) {
      razorpayOptions.display_amount = notes.display_amount;
      razorpayOptions.display_currency = notes.display_currency;
    }

    try {
      window.rzp1 = new window.Razorpay(razorpayOptions);
      window.rzp1.open();
    }catch(err) {
      this.setState({
        loading: false
      });
      // console.log("Razorpay error", err);
    }finally{
      // alert("Payment gateway error. Please try again");
    }
  }

  triggerPayment = () => {
    let customOptions = {};
    if(this.props.preTriggerPaymentListener) {
      customOptions = this.props.preTriggerPaymentListener();
      if(customOptions.then){
        customOptions.then((co) => {
          return this.triggerRazorPay(co)
        });
      } else {
        this.triggerRazorPay(customOptions);
      }

    } else {
      this.triggerRazorPay(customOptions);
    }
  }

  render() {
    if(this.props.buttonLayout) {
      return (
        <div className="razorpay-holder" onClick={this.triggerPayment}>
          {this.props.buttonLayout}
        </div>
      )
    }

    return (<div className="razorpay-holder">
      <button className="btn btn-primary razorpay-payment-button "
        onClick={this.triggerPayment}
        disabled={this.props.loading || this.state.loading}>
        {(this.props.loading || this.state.loading) === true ? <i className="fa fa-spinner fa-spin">&nbsp;</i>: <i className={`fa ${this.props.buttonIcon || fa-plus}`}></i>}
        &nbsp;&nbsp;{this.props.buttonText || `Pay Now`}
      </button>
    </div>
    );

  }
}

RazorPay.propTypes = {
  modalDismissListener: PropTypes.func,
  modalBackDropCloseListener: PropTypes.func,
  paymentHandler: PropTypes.func.isRequired,
  paymentNotes: PropTypes.object,
  preTriggerPaymentListener: PropTypes.func,
  amount: PropTypes.number,
  buttonText: PropTypes.string,
  buttonLayout: PropTypes.object,
  buttonIcon: PropTypes.string
}

export default RazorPay;
