import React, { Component } from "react";
import queryString from "stringquery";

export default class EmailVerification extends Component {
  constructor(props) {
    super(props);

    this.grayscaleImageStyle = {
      "-webkit-filter": "grayscale(100%)",
      filter: "grayscale(100%)"
    };

    this.state = {
      disabled: false,
      showMessage: false,
      isInvalidCode: false,
      message: ""
    };
  }

  componentDidMount() {
    const queries = queryString(this.props.location.search);
    sessionStorage.setItem("key", queries.key);
    if (history.pushState) {
      var newurl =
        window.location.protocol +
        "//" +
        window.location.host +
        window.location.pathname +
        `?action=reset-password&id=${btoa(
          `${new Date().getTime()}-${queries.key}`
        )}`;
      window.history.pushState({ path: newurl }, "", newurl);
    }
    this.checkVerificationCode();
  }

  checkVerificationCode() {
    Meteor.call(
      "verifyResetPasswordLink",
      sessionStorage.getItem("key") ||
        queryString(this.props.location.search).key,
      (err, res) => {
        if (!res) {
          this.setState({
            disabled: true,
            showMessage: true,
            isInvalidCode: true,
            message:
              <p style={{color: "#37b0e9"}}>Oops... Looks like the link has expired or is invalid. Kindly request for a <a href="/forgot-password" style={{textDecoration: "underline"}}> new link here </a></p>
          });
        }
      }
    );
  }

  submitToReset() {
    this.setState({
      disabled: true,
      showMessage: false
    });
    Meteor.call(
      "changeUserPassword",
      sessionStorage.getItem("key"),
      this.password.value,
      (err, res) => {
        this.setState({
          disabled: true,
          showMessage: true,
          message: (
            <p>
              Congrats...!!! Your password has been changed successfully. You
              would be automatically redirected to login page in 5 seconds. Else{" "}
              <a href="/app/login"> Click here </a>
            </p>
          )
        });
        setTimeout(() => {
          window.open("/login", "_self");
        }, 5 * 1000);
      }
    );
  }

  render() {
    return (
      <div className="full-height">
        <div
          className="register-container full-height sm-p-t-30"
          style={{ marginTop: "50px" }}
        >
          <img
            src="/assets/img/logo/blockcluster.png"
            alt="logo"
            width="250"
            style={this.state.isInvalidCode ? { padding: "10px 0px", ...this.grayscaleImageStyle } : {padding: "10px 0px"}}
          />{" "}
          <br />
          <p style={this.state.isInvalidCode ? {color: "#aaa"} : {}}>
            We told you, we got your back. Just enter your new password and you
            are good to go.
          </p>
          <p>Just don't refresh the page</p>
          <div className="form-group form-group-default">
            <label>Password</label>
            <div className="controls">
              <input
                type="password"
                className="form-control"
                name="password"
                placeholder="Credentials"
                disabled={this.state.isInvalidCode}
                required
                ref={input => {
                  this.password = input;
                }}
              />
            </div>
          </div>
          <div className="form-group form-group-default">
            <label>Confirm Password</label>
            <div className="controls">
              <input
                type="password"
                className="form-control"
                name="password"
                placeholder="Credentials"
                required
                disabled={this.state.isInvalidCode}
                ref={input => {
                  this.confirmPassword = input;
                }}
              />
            </div>
          </div>
          <button
            className="btn btn-complete btn-cons m-t-10"
            onClick={this.submitToReset.bind(this)}
            disabled={this.state.disabled}
            style={this.state.isInvalidCode ? {backgroundColor: "#aaa", borderColor: "#aaa"}: {}}
          >
            <i className="fa fa-sign-in" aria-hidden="true" />&nbsp;&nbsp;Change Password
          </button>
          <br />
          <br />
          {this.state.showMessage ? this.state.message : ""}
          <hr style={{ borderTop: "1px solid #ccc" }} />
          <p
            className="small no-margin pull-left sm-pull-reset"
            style={{
              textAlign: "center",
              fontSize: "0.9em",
              color: "#888",
              width: "100%"
            }}
          >
            <span className="hint-text">Copyright &copy; 2017 </span>
            <span className="font-montserrat">BlockCluster</span>.
            <span className="hint-text">&nbsp;All rights reserved. </span>
            <br />
            <span className="sm-block">
              <a
                href="https://www.blockcluster.io/terms"
                className="m-l-10 m-r-10"
                style={{ color: "#222", textDecoration: "none" }}
              >
                Terms of use
              </a>
              <span className="muted">|</span>
              <a
                href="https://www.blockcluster.io/privacy"
                className="m-l-10"
                style={{ color: "#222", textDecoration: "none" }}
              >
                Privacy Policy
              </a>
            </span>
          </p>
          <p
            className="small no-margin pull-right sm-pull-reset"
            style={{ textAlign: "center", width: "100%" }}
          >
            Hand-crafted
            <span className="hint-text"> &amp; made with Love</span>
          </p>
        </div>
      </div>
    );
  }
}
