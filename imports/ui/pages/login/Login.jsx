import React, {Component} from "react";
import {Link} from "react-router-dom"

export default class Login extends Component {
	constructor(props){
		super(props);

		this.state = {
	      formSubmitError: "",
	    };
	}

	login = (e) => {
		e.preventDefault();
		Meteor.loginWithPassword(this.email.value, this.pass.value, (error) => {
			if(error) {
				this.setState({
					formSubmitError: error.reason
				})
			} else {
				if(window.location.search.includes("action=join-network")){
					window.open("/app/invites", "_self");
				}
				this.setState({
					formSubmitError: ''
				})
			}
		})
	}

	render(){
		return (
			<div className="login-wrapper">
	            <div className="bg-pic">
	                <img src="assets/img/pages/login2.jpg"  alt="" className="lazy" />
	                <div className="bg-caption pull-bottom sm-pull-bottom text-white p-l-20 m-b-20">
	                    <h2 className="semi-bold text-white">
	                        Blockchain Management System for Consortiums
	                    </h2>
	                    <p className="small">
	                    the next generation secure and scalable cloud platform for building blockchains.
	                    </p>
	                </div>
	            </div>
	            <div className="login-container bg-white">
	                <div className="p-l-50 m-l-20 p-r-50 m-r-20 p-t-50 m-t-30 sm-p-l-15 sm-p-r-15 sm-p-t-40">
	                    <img src="assets/img/logo/blockcluster.png" alt="logo" height="55" />
	                    <p className="p-t-35">Sign into your account</p>
	                    <form id="form-login" className="p-t-15" role="form" onSubmit={this.login}>
	                        <div className="form-group form-group-default">
	                            <label>Login</label>
	                            <div className="controls">
	                                <input type="email" name="email" placeholder="E-Mail" className="form-control" required ref={(input) => {this.email = input;}} />
	                            </div>
	                        </div>
	                        <div className="form-group form-group-default">
	                            <label>Password</label>
	                            <div className="controls">
	                                <input type="password" className="form-control" name="password" placeholder="Credentials" required ref={(input) => {this.pass = input;}} />
	                            </div>
	                        </div>
	                        {this.state.formSubmitError != '' &&
						        <div className="row">
			                        <div className="col-md-12">
			                        	<div className="alert alert-danger m-b-0" role="alert">
	                      					<button className="close" data-dismiss="alert"></button>
	                      					{this.state.formSubmitError}
	                    				</div>
			                        </div>
			                    </div>
						    }
	                        <div className="row">
	                            <div className="col-md-6 no-padding sm-p-l-10">
	                                <div className="checkbox ">
	                                    <input type="checkbox" value="1" id="checkbox1" />
	                                    <label htmlFor="checkbox1">Keep Me Signed in</label>
	                                </div>
	                            </div>
	                            <div className="col-md-6 d-flex align-items-center justify-content-end form-links">
	                                <Link to="/forgot-password" >Forgot Password?</Link> &nbsp;<small>|</small>&nbsp; <Link to="/register" >Register</Link>
	                            </div>
	                        </div>
	                        <button className="btn btn-complete btn-cons m-t-10" type="submit"><i className="fa fa-sign-in" aria-hidden="true"></i>&nbsp;&nbsp;Sign in</button>
	                    </form>
	                    <div className="pull-bottom sm-pull-bottom">
	                        <div className="m-b-30 p-r-80 sm-m-t-20 sm-p-r-15 sm-p-b-20 clearfix">
	                            <div className="col-sm-3 col-md-2 no-padding">
	                                <img alt="" className="m-t-5" data-src="assets/img/demo/blockcluster.png" data-src-retina="assets/img/demo/pages_icon_2x.png" height="60" src="assets/img/demo/pages_icon.png" width="60" />
	                            </div>
	                            <div className="col-sm-9 no-padding m-t-10">
	                                <p>
	                                    <small>
	                                    All work copyright of respective owner, otherwise © 2017-2018 BlockCluster.
	                                    </small>
	                                </p>
	                            </div>
	                        </div>
	                    </div>
	                </div>
	            </div>
	        </div>
		)
	}
}
