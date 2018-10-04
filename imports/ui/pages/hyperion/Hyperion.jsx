import React, {Component} from "react";
import LaddaButton, { S, SLIDE_UP } from "react-ladda";
import {withTracker} from "meteor/react-meteor-data";
import {withRouter} from 'react-router-dom'
import notifications from "../../../modules/notifications"
import {Link} from "react-router-dom"
import Config from '../../../modules/config/client';

import "./Hyperion.scss"

class Hyperion extends Component {
    constructor() {
        super()

        this.state = {
            updateRPCFormSubmitError: "",
            updateRESTFormSubmitError: "",
            updateRPCFormSubmitSuccess: "",
            updateRESTFormSubmitSuccess: "",
            rpcLoading: false,
            restLoading: false,
            locationCode: "us-west-2"
        };
    }

    componentWillUnmount() {
        this.props.subscriptions.forEach((s) =>{
            s.stop();
        });
    }

    onRPCUpdateSubmit = (e) => {
        e.preventDefault()

        this.setState({
            updateRPCFormSubmitError: '',
            rpcLoading: true
        });

        Meteor.call("rpcPasswordUpdate", this.networkNameRPCUpdate.value, this.rpcPassword.value, this.state.locationCode, (error) => {
            if(!error) {
                this.setState({
                    updateRPCFormSubmitError: '',
                    updateRPCFormSubmitSuccess: "Password updated successfully",
                    rpcLoading: false
                });

            } else {
                this.setState({
                    updateRPCFormSubmitError: 'An error occured while updating password',
                    updateRPCFormSubmitSuccess: "",
                    rpcLoading: false
                });
            }
        });
    }

	render(){
		return (
            <div className="content hyperion">
                <div className="m-t-20 container-fluid container-fixed-lg">
                    <div className="row">
                        <div className="card card-borderless card-transparent">
                            <ul className="nav nav-tabs nav-tabs-linetriangle" role="tablist" data-init-reponsive-tabs="dropdownfx">
                                <li className="nav-item">
                                    <a className="active" href="#" data-toggle="tab" role="tab" data-target="#creds">Authentication Credentials</a>
                                </li>
                                <li className="nav-item">
                                    <a href="#" data-toggle="tab" role="tab" data-target="#stats">Stats & Billing</a>
                                </li>
                            </ul>
                            <div className="tab-content">
                                <div className="tab-pane active" id="creds">
                                    <div className="row">
                                        <div className="col-lg-5">
                                            <div className="card card-transparent">
                                                <div className="card-header ">
                                                    <div className="card-title">
                                                        <h5>Update Password of APIs</h5>
                                                    </div>
                                                </div>
                                                <div className="card-block">
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-lg-7">
                                            <div className="card card-transparent">
                                                <div className="card-block">
                                                    <form id="form-project" role="form" onSubmit={this.onRPCUpdateSubmit} autoComplete="off">
                                                        <p>Set new password</p>
                                                        <div className="form-group-attached">
                                                            <div className="row clearfix">
                                                                <div className="col-md-12">
                                                                    <div className="form-group form-group-default required">
                                                                        <label>Username</label>
                                                                        <input type="text" className="form-control readOnly-Value" readOnly />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="row clearfix">
                                                                <div className="col-md-12">
                                                                    <div className="form-group form-group-default required">
                                                                        <label>Password</label>
                                                                        <input ref={(input) => {this.rpcPassword = input;}} type="password" className="form-control" name="password" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <br />
                                                        {this.state.updateRPCFormSubmitError != '' &&
                                                            <div className="row">
                                                                <div className="col-md-12">
                                                                    <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                                        <button className="close" data-dismiss="alert"></button>
                                                                        {this.state.updateRPCFormSubmitError}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        }

                                                        {this.state.updateRPCFormSubmitSuccess != '' &&
                                                            <div className="row">
                                                                <div className="col-md-12">
                                                                    <div className="m-b-20 alert alert-success m-b-0" role="alert">
                                                                        <button className="close" data-dismiss="alert"></button>
                                                                        {this.state.updateRPCFormSubmitSuccess}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        }

                                                        <LaddaButton
                                                            loading={this.state.rpcLoading}
                                                            data-size={S}
                                                            data-style={SLIDE_UP}
                                                            data-spinner-size={30}
                                                            data-spinner-lines={12}
                                                            className="btn btn-success"
                                                            type="submit"
                                                        >
                                                            <i className="fa fa-wrench" aria-hidden="true"></i>&nbsp;&nbsp;Update
                                                        </LaddaButton>
                                                    </form>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="tab-pane" id="stats">
                                    <div className="row">
                                        <div className="col-lg-5">
                                            <div className="card card-transparent">
                                                <div className="card-header ">
                                                    <div className="card-title">
                                                        <h5>Update Password of APIs</h5>
                                                    </div>
                                                </div>
                                                <div className="card-block">
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-lg-7">
                                            <div className="card card-transparent">
                                                <div className="card-block">
                                                    <form id="form-project" role="form" onSubmit={this.onRPCUpdateSubmit} autoComplete="off">
                                                        <p>Set new password</p>
                                                        <div className="form-group-attached">
                                                            <div className="row clearfix">
                                                                <div className="col-md-12">
                                                                    <div className="form-group form-group-default required">
                                                                        <label>Username</label>
                                                                        <input type="text" className="form-control readOnly-Value" readOnly />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="row clearfix">
                                                                <div className="col-md-12">
                                                                    <div className="form-group form-group-default required">
                                                                        <label>Password</label>
                                                                        <input ref={(input) => {this.rpcPassword = input;}} type="password" className="form-control" name="password" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <br />
                                                        {this.state.updateRPCFormSubmitError != '' &&
                                                            <div className="row">
                                                                <div className="col-md-12">
                                                                    <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                                        <button className="close" data-dismiss="alert"></button>
                                                                        {this.state.updateRPCFormSubmitError}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        }

                                                        {this.state.updateRPCFormSubmitSuccess != '' &&
                                                            <div className="row">
                                                                <div className="col-md-12">
                                                                    <div className="m-b-20 alert alert-success m-b-0" role="alert">
                                                                        <button className="close" data-dismiss="alert"></button>
                                                                        {this.state.updateRPCFormSubmitSuccess}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        }

                                                        <LaddaButton
                                                            loading={this.state.rpcLoading}
                                                            data-size={S}
                                                            data-style={SLIDE_UP}
                                                            data-spinner-size={30}
                                                            data-spinner-lines={12}
                                                            className="btn btn-success"
                                                            type="submit"
                                                        >
                                                            <i className="fa fa-wrench" aria-hidden="true"></i>&nbsp;&nbsp;Update
                                                        </LaddaButton>
                                                    </form>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
		)
	}
}

export default withTracker((props) => {
    return {
        workerNodeIP: Config.workerNodeIP,
        workerNodeDomainName: Config.workerNodeDomainName,
        subscriptions: [Meteor.subscribe("hyperion", {
            onReady: function (){

        	}
        })]
    }
})(withRouter(Hyperion))
