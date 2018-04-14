import React, {Component} from "react";
import LaddaButton, { S, SLIDE_UP } from "react-ladda";
import {withTracker} from "meteor/react-meteor-data";
import {withRouter} from 'react-router-dom'
import {Networks} from "../../../collections/networks/networks.js"
import notifications from "../../../modules/notifications"

class APIsCreds extends Component {
    constructor() {
        super()

        this.state = {
            updateRPCFormSubmitError: "",
            updateRESTFormSubmitError: "",
            updateRPCFormSubmitSuccess: "",
            rpcLoading: false,
            restLoading: false
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

        Meteor.call("rpcPasswordUpdate", this.networkNameRPCUpdate.value, this.rpcPassword.value, (error) => {
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
            <div className="content ">
                <div className="m-t-20 container-fluid container-fixed-lg">
                    <div className="row">
                        <div className="card card-borderless card-transparent">
                            <ul className="nav nav-tabs nav-tabs-linetriangle" role="tablist" data-init-reponsive-tabs="dropdownfx">
                                <li className="nav-item">
                                    <a className="active" href="#" data-toggle="tab" role="tab" data-target="#jsonrpc">JSON-RPC Basic Authentication</a>
                                </li>
                                <li className="nav-item">
                                    <a data-toggle="tab" role="tab" data-target="#restapis" href="#">REST APIs Credentials</a>
                                </li>
                            </ul>
                            <div className="tab-content">
                                <div className="tab-pane active" id="jsonrpc">
                                    <div className="row">
                                        <div className="col-lg-5">
                                            <div className="card card-transparent">
                                                <div className="card-header ">
                                                    <div className="card-title">
                                                        <h5>Update Password of JSON-RPC</h5>
                                                    </div>
                                                </div>
                                                <div className="card-block">
                                                    <p>BlockCluster's node's JSON-RPC APIs are protected using HTTP Basic Authentication. In web3.js, you can use the below code snippet to easily get your application authenticated:</p>
                                                    <pre>
                                                        let web3 = new Web3(
                                                            new Web3.providers.HttpProvider(
                                                            	"http://" + "username" + ":" + "password" + "@" + "x.x.x.x/instanceId" + ":" + "port"
                                                            )
                                                        )
                                                    </pre>
                                                    <p>Default username and password is your network's instance id</p>
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
                                                                        <label>Network name</label>
                                                                        <select className="form-control" ref={(input) => {this.networkNameRPCUpdate = input;}}>
                                                                            {this.props.networks.map((item, index) => {
                                                                                return (
                                                                                    <option value={item.instanceId} key={item.instanceId}>{item.name}</option>
                                                                                )
                                                                            })}
                                                                        </select>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="row clearfix">
                                                                <div className="col-md-12">
                                                                    <div className="form-group form-group-default required">
                                                                        <label>Password</label>
                                                                        <input ref={(input) => {this.rpcPassword = input;}} type="password" className="form-control" name="password" required placeholder="nrx923xrm" />
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
                                {/*Add next section here*/}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
		)
	}
}

export default withTracker(() => {
    return {
        networks: Networks.find({}).fetch(),
        subscriptions: [Meteor.subscribe("networks")]
    }
})(withRouter(APIsCreds))
