import React, { Component } from "react";
import queryString from 'stringquery';
import { Link } from "react-router-dom";

import "../userInvitation/AcceptInvitation.scss";

const LinkStatus = {
  Invalid: 1,
  Valid: 2,
  Undefined: 3,
  Redirecting: 5
};

export default class EmailVerification extends Component {
  constructor(props) {
    super(props);

    this.state = {
      linkStatus: LinkStatus.Undefined,
      disabled: false,
      showMessage: false
    }
  }

  componentDidMount() {
    const queries = queryString(this.props.location.search);
    sessionStorage.setItem("key", queries.key);
    if (history.pushState) {
      const newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + `?action=verification&id=${btoa(`${new Date().getTime()}-${queries.key}`)}`;
      window.history.pushState({ path: newurl }, '', newurl);
    }
    Meteor.call("emailVerification", queries.key, (err, res) => {
      if(res){
        this.setState({
          linkStatus: LinkStatus.Valid,
          disabled: true,
          showMessage: true,
          resultMessage: <p>Congrats...!!! Your email has been verified. You would be automatically redirected to login page in 5 seconds. Else <a href="/app/login"> Click here </a></p>
        });
        setTimeout(() => {
          window.open('/login', "_self");
        }, 2 * 1000);
      } else {
        this.setState({
          linkStatus: LinkStatus.Invalid,
          disabled: false,
          showMessage: true,
          resultMessage: <p>Email id does not match or the link has expired. Kindly try again...</p>
        })
      }
    });
  }

  submitToVerify(){
    this.setState({
      disabled: true,
      showMessage: false
    });

  }

  render() {

    const LoadingView = (
      <div className="d-flex justify-content-center flex-column full-height ">
        <img src="assets/img/logo/blockcluster.png" alt="logo" width="250" />
        <div id="loader" />
        <br />
        <p style={{ textAlign: "center", fontSize: "1.2em" }}>
          Hold on... We are validating the email id...
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
          Oooppsss... <br />Seems like the verification link is invalid. <br />
        </div>
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
          Congrats...!!! Your email has been verified. Redirecting you to login page...
        </div>

        <p>
          If not redirected in 5 seconds, <Link to="/login">Click here to login</Link>
        </p>
      </div>
    );

    let RenderView = LoadingView;
    if(this.state.linkStatus === LinkStatus.Valid) {
      RenderView =  RedirectingView;
    } else if (this.state.linkStatus === LinkStatus.Invalid) {
      RenderView =  InvalidView;
    }

    return (
      <div className="full-height accept-invite">
        <div className="register-container full-height sm-p-t-30">
        {RenderView}
        </div>
      </div>
    )


    // return (
    //   <div className="full-height">
    //     <div className="register-container full-height sm-p-t-30" style={{marginTop: "50px"}}>
    //         <img src="/assets/img/logo/blockcluster.png" alt="logo" width="250" style={{padding: "10px 0px"}}/> <br />
    //         <p>We just need to verify your email address. Kindly enter the email address below.</p>
    //         <div className="form-group form-group-default">
    //           <label>Verify Email Address</label>
    //           <div className="controls">
    //             <input type="email" name="email" placeholder="E-Mail" className="form-control" required ref={(input) => { this.email = input; }} />
    //           </div>
    //         </div>
    //         <button className="btn btn-complete btn-cons m-t-10" onClick={this.submitToVerify.bind(this)} disabled={this.state.disabled}><i className="fa fa-sign-in" aria-hidden="true"></i>&nbsp;&nbsp;Verify</button>
    //         <br /><br />
    //       {this.state.showMessage ? this.state.resultMessage: ''}
    //       <hr style={{ borderTop: "1px solid #ccc" }} />
    //       <p className="small no-margin pull-left sm-pull-reset" style={{ textAlign: "center", fontSize: "0.9em", color: "#888", width: "100%" }}>
    //         <span className="hint-text">Copyright &copy; 2017 </span>
    //         <span className="font-montserrat">BlockCluster</span>.
    //         <span className="hint-text">&nbsp;All rights reserved. </span>
    //         <br />

    //         <span className="sm-block">
    //           <a href="https://www.blockcluster.io/terms" className="m-l-10 m-r-10" style={{ color: "#222", textDecoration: "none" }}>Terms of use</a>
    //           <span className="muted">|</span>
    //           <a href="https://www.blockcluster.io/privacy" className="m-l-10" style={{ color: "#222", textDecoration: "none" }}>Privacy Policy</a>
    //         </span>
    //       </p>
    //       <p className="small no-margin pull-right sm-pull-reset" style={{ textAlign: "center", width: "100%" }}>
    //         Hand-crafted
    //         <span className="hint-text"> &amp; made with Love</span>
    //       </p>
    //     </div>
    //   </div>
    // )
  }
}
