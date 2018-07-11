import React, { Component } from "react";
import queryString from 'stringquery';
import { withTracker } from "meteor/react-meteor-data";
import { withRouter } from 'react-router-dom'
import LaddaButton, { S, SLIDE_UP } from "react-ladda";
import { Link } from "react-router-dom"

export default class EmailVerification extends Component {
	constructor(props) {
		super();
  }
  
  componentDidMount(){
    const queries = queryString(this.props.location.search);
    console.log(queries);
  }

	render() {
		return (
			<div className="full-height">
				<div className="register-container full-height sm-p-t-30">
				<form id="form-login" className="p-t-15" role="form" onSubmit={this.login}>
				<img src="/assets/img/logo/blockcluster.png" alt="logo" width="250" /> <br />
				<p>We just need to verify your email address. Kindly enter the email address below.</p>
					<div className="form-group form-group-default">
						<label>Verify Email Address</label>
						<div className="controls">
							<input type="email" name="email" placeholder="E-Mail" className="form-control" required ref={(input) => { this.email = input; }} />
						</div>
					</div>
					<button className="btn btn-complete btn-cons m-t-10" type="submit"><i className="fa fa-sign-in" aria-hidden="true"></i>&nbsp;&nbsp;Verify</button>
				</form>
				</div>
			</div>
		)
	}
}
