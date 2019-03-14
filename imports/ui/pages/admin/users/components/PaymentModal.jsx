import React, { Component } from 'react';
import helpers from '../../../../../modules/helpers';
import moment from 'moment';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';
import ConfirmationButton from '../../../../components/Buttons/ConfirmationButton';

export default class PaymentModal extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.isModalShowing = false;
  }

  open = () => {
    $('#modalSlideLeft_paymentInfo').modal('show');
    this.isModalShowing = true;
  };
  close = () => {
    $('#modalSlideLeft_paymentInfo').modal('hide');
    this.isModalShowing = true;
  };

  componentDidMount = () => {
    this.props.modalEventFns && this.props.modalEventFns(this.open, this.close);
  };

  refundAmount = () => {
    this.setState({
      loading: true,
    });
    Meteor.call(
      'refundPayment',
      {
        paymentRequestId: this.props.payment._id,
      },
      (err, res) => {
        $('#modalSlideLeft_paymentInfo').modal('hide');
        this.isModalShowing = false;
        setTimeout(() => {
          this.setState({
            loading: false,
          });
        }, 1000);
      }
    );
    if (this.props.refundListener) {
      this.props.refundListener();
    }
  };

  render() {
    const payment = this.props.payment;
    if (!payment) {
      return null;
    }
    return (
      <div className="modal fade slide-right" id="modalSlideLeft_paymentInfo" tabIndex="-1" role="dialog" aria-hidden="true">
        <div className="modal-dialog modal-md">
          <div className="modal-content-wrapper">
            <div className="modal-content">
              <button type="button" className="close" data-dismiss="modal" aria-hidden="true">
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
                      <b>Payment Link:</b> {this.props.paymentLink && this.props.paymentLink.short_url}
                    </p>
                    <p>
                      <b>Amount:</b>
                      &nbsp; ₹{payment.amount / 100}
                    </p>
                    {payment.pgResponse &&
                      payment.pgResponse.map((pg, index) => {
                        return (
                          <div className="p-t-15" key={index + 1} style={{ boxShadow: '1px 1px 5px rgba(0,0,0,0.1)' }}>
                            <div className="d-flex">
                              <span className="icon-thumbnail bg-master-light pull-left text-master" style={{ width: '100px' }}>
                                ₹{pg.amount / 100}
                              </span>
                              <div className="flex-1 full-width overflow-ellipsis">
                                <p className="hint-text all-caps font-montserrat  small no-margin overflow-ellipsis ">{helpers.firstLetterCapital(payment.paymentGateway)}</p>
                                <p className="no-margin overflow-ellipsis ">{helpers.firstLetterCapital(pg.status || pg.entity)}</p>
                                <p>{pg.id}</p>
                              </div>
                            </div>
                            <div className="m-t-15" style={{ paddingLeft: '10px' }}>
                              <p className="hint-text fade small pull-left">
                                {moment(pg.created_at * 1000).format('DD-MMM-YYYY kk:mm:ss')}
                                {pg.notes.reason || pg.reason ? <br /> : null}
                                {pg.notes.reason || pg.reason}
                              </p>
                              <div className="clearfix" />
                            </div>
                            <div className="progress progress-small m-b-15 m-t-10">
                              <div
                                className={`progress-bar progress-bar-${pg.status ? (pg.status === 'authorized' ? 'complete' : 'success') : 'primary'}`}
                                style={{ width: '100%' }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    {payment.paymentStatus === 2 && (
                      <div className="p-t-15 p-b-15" style={{ boxShadow: '1px 1px 5px rgba(0,0,0,0.1)' }}>
                        <div className="d-flex">
                          <span className="icon-thumbnail bg-master-light pull-left text-master" style={{ width: '100px' }}>
                            ₹{payment.amount / 100}
                          </span>
                          <div className="flex-1 full-width overflow-ellipsis">
                            <ConfirmationButton
                              loading={this.state.loading}
                              onConfirm={this.refundAmount}
                              className="btn btn-success"
                              completedText="Already refunded"
                              actionText="Issue Refund"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      className="btn btn-default m-t-15"
                      data-dismiss="modal"
                      onClick={() => {
                        $('#modalSlideLeft_paymentInfo').modal('hide');
                        this.isModalShowing = false;
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
      </div>
    );
  }
}
