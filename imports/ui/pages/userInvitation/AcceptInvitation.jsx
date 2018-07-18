import React, { Component } from "react";
import { Link } from "react-router-dom";
import validations from "../../../modules/validations";

const LinkStatus = {
  Invalid: 1,
  Valid: 2,
  Undefined: 3,
  UserMismatch: 4
}

export default class AcceptInvitation extends Component {

  constructor(props) {
    super();
    this.state = {
      linkStatus: LinkStatus.Undefined,
      invitingUser: {},
      invitedUser: {},
      invitation: {},
      network: {}
    };
  }

  handleLoggedInCase = (reply, userId) => {
    const { invitation } = reply;
    if(invitation.inviteTo === userId) {
      this.setState({
        linkStatus: LinkStatus.Valid
      });
      // Show join network page
      
      // TODO: Need to create this page
      window.open("/app/join-network", "_self");
    } else {
      this.setState({
        linkStatus: LinkStatus.UserMismatch
      });
      // logout and handle loggedout case
      Meteor.logout();
      this.handleLoggedOutCase();
    }
  }

  handleLoggedOutCase = (reply) => {
    if(!reply.invitedUser.toBeCreated) {
      // TODO: Handle this case in login page
      window.open("/app/login?action=join-network", "_self");
    } 
    // Let the user continue on this page
  }

  componentDidMount() {
    sessionStorage.setItem("action", "join-network");
    if(!sessionStorage.getItem("key")){
      const queries = queryString(this.props.location.search);
      sessionStorage.setItem("key", queries.invitation);
      if (history.pushState) {
        const newurl =
          window.location.protocol +
          "//" +
          window.location.host +
          window.location.pathname +
          `?action=join-network&id=${btoa(
            `${new Date().getTime()}-${queries.key}`
          )}`;
        window.history.pushState({ path: newurl }, "", newurl);
      }
    }
   
    Meteor.call(
      "verifyInvitationLink",
      sessionStorage.getItem("key"),
      (err, reply) => {
        if(!reply) {
          this.setState({
            linkStatus: LinkStatus.Invalid
          });
        }
        if(Meteor.userId()) {
          this.handleLoggedInCase(reply, Meteor.userId());
          // Handle logged in case
        } else {
          // Handle logged out case
        }
      }
    )
  }

  updateProfileInformation = () => {
    Meteor.users.update({
      _id: this.state.invitedUser._id
    }, {
      $set: {
        profile: {
          firstName: this.fname.value,
          lastName: this.lname.value
        },
      },
      $unset: {
        toBeCreated: ""
      }
    });
    Accounts.updatePassword(invitedUser._id, this.pass.value);

    Meteor.loginWithPassword(this.email.value, this.pass.value, (error) => {
			if(error) {
				this.setState({
					formSubmitError: error.reason
				})
			} else {
				this.setState({
					formSubmitError: ''
        });
        window.open("/app/joinNetwork/invitation", "_self");
			}
		});
  }

  render() {
    return (
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
              You have been invited by {this.state.invitingUser.profile.firstName} {this.state.invitedUser.profile.lastName} to join their network {this.state.network.name} on Blockcluster.
              Before you join, you would need to create an account here. Kindly create your account here. If you already have an account, click
              <Link to="/login" className="text-info">
                here
              </Link>
              to login
            </p>
            <form
              id="form-register"
              className="p-t-15"
              role="form"
              onSubmit={this.createAccount}
            >
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
                      value={this.state.invitedUser.emails[0].address}
                      placeholder="We will send loging details to you"
                      className="form-control"
                      disabled={true}
                      required
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
                      <a href="https://www.blockcluster.io/terms" className="text-info">
                        Pages Terms
                      </a>{" "}
                      and{" "}
                      <a href="https://www.blockcluster.io/privacy" className="text-info">
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
                type="submit"
              >
                <i className="fa fa-user-plus" aria-hidden="true" />&nbsp;Create
                a new account
              </button>
            </form>
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
  }
}
