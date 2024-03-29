import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';

export default class EmailVerification extends Component {
  constructor(props) {
    super(props);

    this.state = {
      disabled: false,
      showMessage: false,
      message: '',
    };
  }

  requestPasswordReset() {
    const email = this.email.value;
    this.setState(
      {
        reset_formloading: true,
      },
      () => {
        if (!email.includes('@') || email.lastIndexOf('.') < email.indexOf('@')) {
          return this.setState({
            showMessage: true,
            message: 'Invalid email address',
            reset_formloading: false,
          });
        }
        Meteor.call('requestPasswordReset', email, () => {
          this.setState({
            reset_formloading: false,
            disabled: true,
            showMessage: true,
            message: (
              <p>
                <br />
                We have sent a link to reset your password on your registered email address. Kindly check your email for further details.
              </p>
            ),
          });
        });
      }
    );
  }

  render() {
    return (
      <div className="login-wrapper">
        <div className="bg-pic">
          <img src="assets/img/pages/login2.jpg" alt="" className="lazy" />
          <div className="bg-caption pull-bottom sm-pull-bottom text-white p-l-20 m-b-20">
            <h2 className="semi-bold text-white">Blockchain Management System for Consortiums</h2>
            <p className="small">the next generation secure and scalable platform for building blockchains.</p>
          </div>
        </div>
        <div className="login-container bg-white">
          <div className="p-l-50 m-l-20 p-r-50 m-r-20 p-t-50 m-t-30 sm-p-l-15 sm-p-r-15 sm-p-t-40">
            <img src="assets/img/logo/blockcluster.png" alt="logo" height="55" />
            <p className="p-t-35">Reset your password</p>
            <div className="form-group form-group-default">
              <label>Login</label>
              <div className="controls">
                <input
                  type="email"
                  name="email"
                  placeholder="E-Mail"
                  className="form-control"
                  required
                  ref={input => {
                    this.email = input;
                  }}
                />
              </div>
            </div>
            <div className="row">
              <div className="col-md-12 d-flex align-items-center justify-content-en form-links">
                <Link to="/login">Login Here</Link> &nbsp;<small>|</small>&nbsp; New here?&nbsp;<Link to="/register">Register</Link>
              </div>
            </div>
            <LaddaButton
              loading={this.state.reset_formloading ? this.state.reset_formloading : false}
              data-size={S}
              data-style={SLIDE_UP}
              data-spinner-size={30}
              data-spinner-lines={12}
              className="btn btn-complete btn-cons m-t-10"
              onClick={this.requestPasswordReset.bind(this)}
              disabled={this.state.disabled}
            >
              <i className="fa fa-sign-in" aria-hidden="true" />
              &nbsp;&nbsp;Reset Password
            </LaddaButton>
            <p>{this.state.showMessage ? this.state.message : ''}</p>
            <div className="pull-bottom sm-pull-bottom">
              <div className="m-b-30 p-r-80 sm-m-t-20 sm-p-r-15 sm-p-b-20 clearfix">
                <div className="col-sm-3 col-md-2 no-padding">
                  <img
                    alt=""
                    className="m-t-5"
                    data-src="assets/img/demo/blockcluster.png"
                    data-src-retina="assets/img/demo/pages_icon_2x.png"
                    height="60"
                    src="assets/img/demo/pages_icon.png"
                    width="60"
                  />
                </div>
                <div className="col-sm-9 no-padding m-t-10">
                  <p>
                    <small>All work copyright of respective owner, otherwise © 2017-2019 BlockCluster.</small>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
