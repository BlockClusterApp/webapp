import React from "react";
import RazorPay from "../../../components/Razorpay/Razorpay";

import "./CardVerification.scss";

export default class CardVerification extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      showModal: false,
      cardVerificationStatus: undefined
    }
  }

  checkCardStatus = () => {
    Meteor.call("shouldShowCreditCardVerification", (err, reply) => {
      if(err){
        return console.log(err);
      }
      if(this.props.cardVerificationListener){
        this.props.cardVerificationListener(!!reply);
      }
      this.setState({
        cardVerificationStatus: !!reply
      });
    });
  }

  preTriggerPaymentListener = () => {
    return new Promise((resolve) => {
      Meteor.call('createPaymentRequest', {amount: 100, reason: 'Credit card verification', paymentGateway: 'razorpay'}, (err, res) => {
        resolve({
          paymentRequestId: res
        });
      });
    });
  }

  componentDidMount(){
    this.checkCardStatus();
  }

  closeModal = () => {
    this.setState({
      showModal: false
    })
  };

  rzPaymentHandler = (pgResponse) => {
    Meteor.call("applyRZCardVerification", pgResponse.razorpay_payment_id, (err, res) => {
      this.checkCardStatus();
    });
  };

  openCreditCardDialog = () => {
    this.setState({
      showModal: true
    })
  }

  render() {
    const Modal = this.state.showModal && (
      <div className="card-verification">
        <div id="myModal" className="modal fade" role="dialog">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <button
                  type="button"
                  className="close"
                  data-dismiss="modal"
                  onClick={this.closeModal}
                >
                  &times;
                </button>
                <h5 className="modal-title">Credit Card Verification</h5>
              </div>
              <div className="modal-body">
                <div className="row clearfix">
                  <div className="col-md-12">
                    <p style={{textAlign: 'justify'}}>
                      An amount of INR 1.00 will be deducted from your account which would be
                      refunded to your account within 5 working bank days.
                    </p>
                    <center><RazorPay buttonText={`Verify credit card`} amount={100} paymentHandler={this.rzPaymentHandler} preTriggerPaymentListener={this.preTriggerPaymentListener} /></center>
                    <p><br />Only credit card is accepted. If you choose any other payment method, the verification won't be successful.</p>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-default"
                  data-dismiss="modal"
                  onClick={() => this.setState({ showModal: false })}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

    const Message = (
      <div className="card-verification">
        <div className="alert alert-danger">
          <div className="row clearfix">
            <div className="col-md-5">
              <button className="btn btn-primary" onClick={this.openCreditCardDialog}>
                Verify Credit Card
              </button>
            </div>
            <div className="col-md-7">
              You need to verify your credit card before you can create nodes.
            </div>
          </div>
        </div>
        {Modal}
      </div>
    );

    return this.state.cardVerificationStatus === false ? Message : <p></p>;
  }
}
