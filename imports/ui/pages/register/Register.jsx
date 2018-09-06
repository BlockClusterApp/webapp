import React, {Component} from 'react';
import {Link} from 'react-router-dom'
import validations from "../../../modules/validations"
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';

export default class Register extends Component {
	constructor(props){
		super();

		this.state = {
	      formSubmitError: "",
		  formSubmitSuccess: false
	    };
	}

	createAccount = (e) => {
		e.preventDefault();
		this.setState({
			register_formloading:true
		  },()=>{
		Accounts.createUser({
			email: this.email.value,
			password: this.pass.value,
			profile: {
				firstName: this.fname.value,
				lastName: this.lname.value
			}
		}, (error) => {
			console.log(error);
			if(error) {
				if(error.error && error.error === "unverified-account-created") {
					this.setState({
						register_formloading:false,
						formSubmitError: '',
						formSubmitSuccess: true
					})
				} else if(error && !error.error){
					this.setState({
						register_formloading:false,
						formSubmitError: 'An error occured during creating your account.',
						formSubmitSuccess: true
					})
				}else {
					this.setState({
						register_formloading:false,
						formSubmitError: error.reason,
						formSubmitSuccess: false
					})
				}
			} else {
				this.setState({
					register_formloading:false,
					formSubmitError: '',
					formSubmitSuccess: false
				})
			}
		})
	});
	}

	render(){
		return (
			<div className="full-height">
				<div className="register-container full-height sm-p-t-30">
		            <div className="d-flex justify-content-center flex-column full-height ">
	                <Link to={"//blockcluster.io"} target="_self"><img src="assets/img/logo/blockcluster.png" alt="logo" width="250" /></Link>
					<h3>This BMS provides the easiest way to manage your blockchain consortiums</h3>
		                <p>
		                    Create a BlockCluster account. If you already have an account then click <Link to="/login" className="text-info">here</Link> to login
		                </p>
		                <form id="form-register" className="p-t-15" role="form" onSubmit={this.createAccount}>
		                    <div className="row">
		                        <div className="col-md-6">
		                            <div className="form-group form-group-default">
		                                <label>First Name</label>
		                                <input type="text" name="fname" placeholder="John" className="form-control" required
		                                	ref={(input) => {this.fname = input;}}
		                                	pattern={validations.firstLastName.html}
		                                	onInput={() => this.fname.setCustomValidity('')}
		                                	onInvalid={() => this.fname.value === ''
							                    ? this.fname.setCustomValidity("You must enter first name")
							                    : this.fname.setCustomValidity(validations.firstLastName.message)
							                }
		                                />
		                            </div>
		                        </div>
		                        <div className="col-md-6">
		                            <div className="form-group form-group-default">
		                                <label>Last Names</label>
		                                <input type="text" name="lname" placeholder="Smith" className="form-control" required
		                                	ref={(input) => {this.lname = input;}}
		                                	pattern={validations.firstLastName.html}
		                                	onInput={() => this.lname.setCustomValidity('')}
		                                	onInvalid={() => this.lname.value === ''
							                    ? this.lname.setCustomValidity("You must enter last name")
							                    : this.lname.setCustomValidity(validations.firstLastName.message)
							                }
		                                />
		                            </div>
		                        </div>
		                    </div>
		                    <div className="row">
		                        <div className="col-md-12">
		                            <div className="form-group form-group-default">
		                                <label>Password</label>
		                                <input type="password" name="pass" placeholder="Minimum of 4 Charactors" className="form-control" required ref={(input) => {this.pass = input;}} />
		                            </div>
		                        </div>
		                    </div>
		                    <div className="row">
		                        <div className="col-md-12">
		                            <div className="form-group form-group-default">
		                                <label>Email</label>
		                                <input type="email" name="email" placeholder="We will send loging details to you" className="form-control" required ref={(input) => {this.email = input;}} />
		                            </div>
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
							{this.state.formSubmitSuccess === true &&
						        <div className="row">
			                        <div className="col-md-12">
			                        	<div className="alert alert-success m-b-0" role="alert">
	                      					<button className="close" data-dismiss="alert"></button>
	                      					Account created. Please check your email to confirm your email address before <Link to={'/login'}>login</Link>.
	                    				</div>
			                        </div>
			                    </div>
						    }
		                    <div className="row m-t-10">
		                        <div className="col-lg-6">
		                            <p><small>I agree to the <a href="https://www.blockcluster.io/terms" className="text-info">Pages Terms</a> and <a href="https://www.blockcluster.io/privacy" className="text-info">Privacy</a>.</small></p>
		                        </div>
		                        <div className="col-lg-6 text-right">
		                            <a href="https://blockcluster.io/contact" className="text-info small">Help? Contact Support</a>
		                        </div>
		                    </div>
							<LaddaButton
								loading={this.state.register_formloading ? this.state.register_formloading : false}
								data-size={S}
								data-style={SLIDE_UP}
								data-spinner-size={30}
								data-spinner-lines={12}
								className="btn btn-complete btn-cons m-t-10" 
								type="sumbit"
							>
								<i className="fa fa-user-plus" aria-hidden="true" />
								&nbsp;&nbsp;Create a new account
							</LaddaButton>
		                </form>
		            </div>
		        </div>
		        <div className="full-width">
		            <div className="register-container clearfix">
		                <div className="m-b-30 sm-m-t-20 sm-p-r-15 sm-p-b-20 clearfix d-flex-md-up">
		                    <div className="col-md-2 no-padding d-flex align-items-center">
		                        <img src="assets/img/logo/blockcluster.png" alt="" className="" width="60" />
		                    </div>
		                    <div className="col-md-9 no-padding d-flex align-items-center">
		                        <p className="hinted-text small inline sm-p-t-10">No part of this website or any of its contents may be reproduced, copied, modified or adapted, without the prior written consent of the author, unless otherwise indicated for stand-alone materials.</p>
		                    </div>
		                </div>
		            </div>
		        </div>
			</div>
		)
	}
}
