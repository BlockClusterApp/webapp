import React, { Component } from "react";
import { Link } from "react-router-dom";
import queryString from "stringquery";
import validations from "../../../modules/validations";

import "./AcceptInvitation.scss";

const LinkStatus = {
  Invalid: 1,
  Valid: 2,
  Undefined: 3,
  UserMismatch: 4,
  Redirecting: 5
};

export default class AcceptInvitation extends Component {
  constructor(props) {
    super();
    this.state = {
      linkStatus: LinkStatus.Undefined,
      invitingUser: { profile: {}, emails: [{}] },
      invitedUser: { profile: {}, emails: [{}] },
      invitation: {},
      network: {}
    };
  }

  handleLoggedInCase = (reply, userId) => {
    const { invitation } = reply;
    if (invitation.inviteTo === userId) {
      this.setState({
        linkStatus: LinkStatus.Redirecting
      });
      // Show join network page

      return window.open("/app/invites", "_self");
    } else {
      this.setState({
        linkStatus: LinkStatus.UserMismatch
      });
      // logout and handle loggedout case
      Meteor.logout();
      this.handleLoggedOutCase(reply);
    }
  };

  handleLoggedOutCase = reply => {
    const { invitedUser, invitingUser, network, invitation } = reply;
    this.setState({
      invitedUser,
      invitingUser,
      network,
      invitation
    });
    if (
      reply.invitedUser.profile.firstName &&
      reply.invitedUser.profile.firstName !== null &&
      reply.invitedUser.profile.firstName !== "null"
    ) {
      return this.setState(
        {
          linkStatus: LinkStatus.Redirecting
        },
        () => {
          return window.open("/login?action=join-network", "_self");
        }
      );
    }
    this.setState({
      linkStatus: LinkStatus.Valid
    });
    // Let the user continue on this page
  };

  componentDidMount() {
    sessionStorage.setItem("action", "join-network");
    if (!sessionStorage.getItem("key")) {
      const queries = queryString(this.props.location.search);
      if (queries.invitation) {
        sessionStorage.setItem("key", queries.invitation);
      }
      if (history.pushState) {
        const newurl =
          window.location.protocol +
          "//" +
          window.location.host +
          window.location.pathname +
          `?action=join-network&id=${btoa(
            `${new Date().getTime()}-${queries.key}`
          )}&inviteKey=${btoa(`${new Date()}`)}`;
        window.history.pushState({ path: newurl }, "", newurl);
      }
    } else {
      if (history.pushState) {
        const newurl =
          window.location.protocol +
          "//" +
          window.location.host +
          window.location.pathname +
          `?action=join-network&id=${btoa(
            `${new Date().getTime()}-${sessionStorage.getItem("key")}`
          )}&inviteKey=${btoa(`${new Date()}`)}`;
        window.history.pushState({ path: newurl }, "", newurl);
      }
    }

    Meteor.call(
      "verifyInvitationLink",
      sessionStorage.getItem("key"),
      (err, reply) => {
        if (!reply) {
          return this.setState({
            linkStatus: LinkStatus.Invalid
          });
        }
        if (Meteor.userId()) {
          this.handleLoggedInCase(reply, Meteor.userId());
          // Handle logged in case
        } else {
          // Handle logged out case
          this.handleLoggedOutCase(reply);
        }
      }
    );
  }

  componentWillUnmount() {
    sessionStorage.setItem("key", undefined);
    sessionStorage.setItem("action", undefined);
  }

  updateProfileInformation = () => {
    Meteor.call(
      "updatePasswordAndInfo",
      this.state.invitedUser._id,
      this.pass.value,
      {
        firstName: this.fname.value,
        lastName: this.lname.value
      },
      () => {
        Meteor.loginWithPassword(
          this.email.value,
          this.pass.value,
          (error, reply) => {
            console.log("Error, reply", error, reply);
            window.open("/app/invites", "_self");
          }
        );
      }
    );
  };

  render() {
    const RegistrationPage = (
      <div className="full-height">
        <div className="register-container full-height sm-p-t-30">
          <div className="d-flex justify-content-center flex-column full-height ">
            <img
              src="assets/img/logo/blockcluster.png"
              alt="logo"
              width="250"
            />
            <h3>
              This BaaS provides the easiest way to create your blockchain
              consortiums
            </h3>
            <p>
              You have been invited by{" "}
              <b>
                {this.state.invitingUser.profile.firstName}&nbsp;
                {this.state.invitedUser.profile.lastName}
              </b>{" "}
              to join their network &nbsp;<b>{this.state.network.name}</b> on
              Blockcluster. Before you join, you would need to create an account
              here. If you already have an account, click&nbsp;
              <Link to="/login?action=join-network" className="text-info">
                here
              </Link>
              &nbsp;to login
            </p>
            <div className="row">
              <div className="col-md-6">
                <div className="form-group form-group-default">
                  <label>First Name</label>
                  <input
                    type="text"
                    name="fname"
                    placeholder="John"
                    className="form-control"
                    required
                    ref={input => {
                      this.fname = input;
                    }}
                    pattern={validations.firstLastName.html}
                    onInput={() => this.fname.setCustomValidity("")}
                    onInvalid={() =>
                      this.fname.value === ""
                        ? this.fname.setCustomValidity(
                            "You must enter first name"
                          )
                        : this.fname.setCustomValidity(
                            validations.firstLastName.message
                          )
                    }
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group form-group-default">
                  <label>Last Names</label>
                  <input
                    type="text"
                    name="lname"
                    placeholder="Smith"
                    className="form-control"
                    required
                    ref={input => {
                      this.lname = input;
                    }}
                    pattern={validations.firstLastName.html}
                    onInput={() => this.lname.setCustomValidity("")}
                    onInvalid={() =>
                      this.lname.value === ""
                        ? this.lname.setCustomValidity(
                            "You must enter last name"
                          )
                        : this.lname.setCustomValidity(
                            validations.firstLastName.message
                          )
                    }
                  />
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-md-12">
                <div className="form-group form-group-default">
                  <label>Password</label>
                  <input
                    type="password"
                    name="pass"
                    placeholder="Minimum of 4 Charactors"
                    className="form-control"
                    required
                    ref={input => {
                      this.pass = input;
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-md-12">
                <div className="form-group form-group-default">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="We will send loging details to you"
                    className="form-control"
                    value={this.state.invitedUser.emails[0].address}
                    required
                    disabled
                    ref={input => {
                      this.email = input;
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="row m-t-10">
              <div className="col-lg-6">
                <p>
                  <small>
                    I agree to the{" "}
                    <a
                      href="https://www.blockcluster.io/terms"
                      className="text-info"
                    >
                      Pages Terms
                    </a>{" "}
                    and{" "}
                    <a
                      href="https://www.blockcluster.io/privacy"
                      className="text-info"
                    >
                      Privacy
                    </a>.
                  </small>
                </p>
              </div>
              <div className="col-lg-6 text-right">
                <a href="#" className="text-info small">
                  Help? Contact Support
                </a>
              </div>
            </div>

            <button
              className="btn btn-complete btn-cons m-t-10"
              onClick={this.updateProfileInformation}
            >
              <i className="fa fa-user-plus" aria-hidden="true" />&nbsp;Create a
              new account
            </button>
          </div>
        </div>
        <div className="full-width">
          <div className="register-container clearfix">
            <div className="m-b-30 sm-m-t-20 sm-p-r-15 sm-p-b-20 clearfix d-flex-md-up">
              <div className="col-md-2 no-padding d-flex align-items-center">
                <img
                  src="assets/img/logo/blockcluster.png"
                  alt=""
                  className=""
                  width="60"
                />
              </div>
              <div className="col-md-9 no-padding d-flex align-items-center">
                <p className="hinted-text small inline sm-p-t-10">
                  No part of this website or any of its contents may be
                  reproduced, copied, modified or adapted, without the prior
                  written consent of the author, unless otherwise indicated for
                  stand-alone materials.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

    const LoadingView = (
      <div className="d-flex justify-content-center flex-column full-height ">
        <img src="assets/img/logo/blockcluster.png" alt="logo" width="250" />
        <div id="loader" />
        <br />
        <p style={{ textAlign: "center", fontSize: "1.2em" }}>
          Hold on... We are validating the invite...
        </p>
      </div>
    );

    const InvalidInviteView = (
      <div
        className="d-flex justify-content-center flex-column full-height "
        style={{ textAlign: "center" }}
      >
        <img src="assets/img/logo/blockcluster.png" alt="logo" width="250" />

        <i
          className="fa fa-warning"
          style={{ color: "#d40000", fontSize: "7em", marginTop: "15px" }}
        />

        <div
          className="alert alert-danger"
          style={{ textAlign: "center", marginTop: "15px" }}
        >
          Oooppsss... <br />Seems like the invite is invalid or the host has
          cancelled the invitation. <br />
          Kindly contact the sender of invite.
        </div>

        <p>
          <Link to="/login">Click here to login</Link>
        </p>
      </div>
    );

    const RedirectingView = (
      <div
        className="d-flex justify-content-center flex-column full-height "
        style={{ textAlign: "center" }}
      >
        <img src="assets/img/logo/blockcluster.png" alt="logo" width="250" />

        <i
          className="fa fa-check-circle"
          style={{ color: "#34db90", fontSize: "7em", marginTop: "15px" }}
        />

        <div
          className="alert alert-success"
          style={{ textAlign: "center", marginTop: "15px" }}
        >
          Redirecting you to login page...
        </div>

        <p>
          <Link to="/login">Click here to login</Link>
        </p>
      </div>
    );

    let RenderView = LoadingView;

    if (this.state.linkStatus === LinkStatus.Undefined) {
      RenderView = LoadingView;
    } else if (this.state.linkStatus === LinkStatus.Invalid) {
      RenderView = InvalidInviteView;
    } else if (this.state.linkStatus === LinkStatus.Valid) {
      RenderView = RegistrationPage;
    } else {
      RenderView = RedirectingView;
    }

    return (
      <div className="full-height accept-invite">
        <div className="register-container full-height sm-p-t-30">
          {RenderView}
        </div>
      </div>
    );
  }
}
