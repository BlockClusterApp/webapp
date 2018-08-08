import React, { Component } from "react";
import helpers from "../../../../../modules/helpers";
import moment from 'moment';

export default class PaymentModal extends Component {

  constructor(props){
    super(props);
    this.state = {
      isClosed: false
    }
  }

  componentWillUpdate(nextProps, nextState) {
    if (nextProps.showModal == true ) {
      $("#modalSlideLeft_paymentInfo").modal("show");
    }
  }

  render() {
    const payment = this.props.payment;
    if(!payment){
      return null;
    }
    return (payment && <div
      className="modal fade slide-right"
      id="modalSlideLeft_paymentInfo"
      tabIndex="-1"
      role="dialog"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-md">
        <div className="modal-content-wrapper">
          <div className="modal-content">
            <button
              type="button"
              className="close"
              data-dismiss="modal"
              aria-hidden="true"
            >
              <i className="pg-close fs-14" />
            </button>
            <div className="container-md-height full-height">
              <div className="row-md-height">
                <div className="modal-body col-md-height col-middle">
                  <h5 className="text-primary ">Payment Information</h5>
                  <br />
                  <p>
                    <b>For:</b> {payment.reason}
                  </p>
                  <p>
                    <b>Payment Request:</b> {payment._id}
                  </p>
                  <p>
                    <b>Amount:</b>&nbsp;
                    ₹{payment.amount / 100}
                  </p>
                  {
                    payment.pgResponse && payment.pgResponse.map((pg, index) => {
                      return (
                        <div className="p-t-15" key={index+1} style={{boxShadow: '1px 1px 5px rgba(0,0,0,0.1)'}}>
                          <div className="d-flex">
                            <span className="icon-thumbnail bg-master-light pull-left text-master">₹{pg.amount/100}</span>
                            <div className="flex-1 full-width overflow-ellipsis">
                              <p className="hint-text all-caps font-montserrat  small no-margin overflow-ellipsis ">{helpers.firstLetterCapital(payment.paymentGateway)}
                              </p>
                              <p className="no-margin overflow-ellipsis ">{helpers.firstLetterCapital(pg.status || pg.entity)}</p>
                              <p>{pg.id}</p>
                            </div>
                          </div>
                          <div className="m-t-15" style={{paddingLeft: '10px'}}>
                            <p className="hint-text fade small pull-left">{moment(pg.created_at * 1000).format('DD-MMM-YYYY HH:mm:SS')}{pg.notes.reason || pg.reason ? <br /> : null}{pg.notes.reason || pg.reason}</p>
                            <div className="clearfix"></div>
                          </div>
                          <div className="progress progress-small m-b-15 m-t-10">
                            <div className={`progress-bar progress-bar-${pg.status ? pg.status === 'authorized' ? "complete" : "success" : "primary"}`} style={{width:'100%'}}></div>
                          </div>
                        </div>
                      )
                    })
                  }
                  <button
                    type="button"
                    className="btn btn-default"
                    data-dismiss="modal"
                    onClick={() => {
                      this.setState({
                        isClosed: true
                      });
                      $("#modalSlideLeft_paymentInfo").modal("hide");
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>);
  }
}
