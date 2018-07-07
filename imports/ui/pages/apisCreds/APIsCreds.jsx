import React, {Component} from "react";
import LaddaButton, { S, SLIDE_UP } from "react-ladda";
import {withTracker} from "meteor/react-meteor-data";
import {withRouter} from 'react-router-dom'
import {Networks} from "../../../collections/networks/networks.js"
import {Utilities} from "../../../collections/utilities/utilities.js"
import notifications from "../../../modules/notifications"
import {Link} from "react-router-dom"

import "./APIsCreds.scss"

class APIsCreds extends Component {
    constructor() {
        super()

        this.state = {
            updateRPCFormSubmitError: "",
            updateRESTFormSubmitError: "",
            updateRPCFormSubmitSuccess: "",
            updateRESTFormSubmitSuccess: "",
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

    onRESTUpdateSubmit = (e) => {
        e.preventDefault()

        Meteor.call("restAPIPasswordUpdate", this.networkNameRPCUpdate.value, this.restPassword.value, (error) => {
            if(!error) {
                this.setState({
                    updateRESTFormSubmitError: '',
                    updateRESTFormSubmitSuccess: "Password updated successfully",
                    restLoading: false
                });
            } else {
                this.setState({
                    updateRESTFormSubmitError: 'An error occured while updating password',
                    updateRESTFormSubmitSuccess: "",
                    restLoading: false
                });
            }
        });
    }

	render(){
		return (
            <div className="content apis-creds">
                <div className="m-t-20 container-fluid container-fixed-lg">
                    <div className="row">
                        <div className="col-lg-12 m-b-10">
                            <Link to={"/app/networks/" + this.props.match.params.id}> Control Panel <i className="fa fa-angle-right"></i></Link> APIs
                        </div>
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
                                                    <p>BlockCluster's node's JSON-RPC APIs are protected using HTTP Basic Authentication. In web3.js (version 0.20.*), you can use the below code snippet to easily get your application authenticated:</p>
                                                    <pre>
                                                        var web3 = new Web3(
                                                            new Web3.providers.HttpProvider(
                                                                {"\"https://" + (this.props.workerNodeDomainName[0] ? this.props.workerNodeDomainName[0].value : '') + "/node/networkId" + "\", 0, " + "\"username\", \"password\""}
                                                            )
                                                        );
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
                                                                        {this.props.network.length === 1 &&
                                                                            <input type="text" className="form-control readOnly-Value" ref={(input) => {this.networkNameRPCUpdate = input;}} readOnly value={this.props.network[0].instanceId} />
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="row clearfix">
                                                                <div className="col-md-12">
                                                                    <div className="form-group form-group-default required">
                                                                        <label>Password</label>
                                                                        {this.props.network.length === 1 &&
                                                                            <input ref={(input) => {this.rpcPassword = input;}} type="password" className="form-control" name="password" required placeholder={this.props.network[0].instanceId} />
                                                                        }
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
                                <div className="tab-pane" id="restapis">
                                    <div className="row">
                                        <div className="col-lg-5">
                                            <div className="card card-transparent">
                                                <div className="card-header ">
                                                    <div className="card-title">
                                                        <h5>Update Password of REST APIs</h5>
                                                    </div>
                                                </div>
                                                <div className="card-block">
                                                    <p>BlockCluster's Assets APIs are protected using password. While making any of the API calls you need to provide the password for authentication.</p>
                                                    <p>Default password is your network's instance id. <Link target="_blank" to={"http://api.blockcluster.io"}> Click Here</Link> for API Documentation.</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-lg-7">
                                            <div className="card card-transparent">
                                                <div className="card-block">
                                                    <form id="form-project" role="form" onSubmit={this.onRESTUpdateSubmit} autoComplete="off">
                                                        <p>Set new password</p>
                                                        <div className="form-group-attached">
                                                            <div className="row clearfix">
                                                                <div className="col-md-12">
                                                                    <div className="form-group form-group-default required">
                                                                        <label>Network name</label>
                                                                        {this.props.network.length === 1 &&
                                                                            <input type="text" className="form-control readOnly-Value" ref={(input) => {this.networkNameRESTUpdate = input;}} readOnly value={this.props.network[0].instanceId} />
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="row clearfix">
                                                                <div className="col-md-12">
                                                                    <div className="form-group form-group-default required">
                                                                        <label>Password</label>
                                                                        {this.props.network.length === 1 &&
                                                                            <input ref={(input) => {this.restPassword = input;}} type="password" className="form-control" name="password" required placeholder={this.props.network[0].instanceId} />
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <br />
                                                        {this.state.updateRESTFormSubmitError != '' &&
                                                            <div className="row">
                                                                <div className="col-md-12">
                                                                    <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                                        <button className="close" data-dismiss="alert"></button>
                                                                    {this.state.updateRESTFormSubmitError}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        }

                                                        {this.state.updateRESTFormSubmitSuccess != '' &&
                                                            <div className="row">
                                                                <div className="col-md-12">
                                                                    <div className="m-b-20 alert alert-success m-b-0" role="alert">
                                                                        <button className="close" data-dismiss="alert"></button>
                                                                    {this.state.updateRESTFormSubmitSuccess}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        }

                                                        <LaddaButton
                                                            loading={this.state.restLoading}
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
        network: Networks.find({instanceId: props.match.params.id}).fetch(),
        networks: Networks.find({}).fetch(),
        workerNodeIP: Utilities.find({"name": "workerNodeIP"}).fetch(),
        workerNodeDomainName: Utilities.find({"name": "workerNodeDomainName"}).fetch(),
        firewallPort: Utilities.find({"name": "firewall_Port"}).fetch(),
        subscriptions: [Meteor.subscribe("networks", {
            onReady: function (){
        		if(Networks.find({instanceId: props.match.params.id}).fetch().length !== 1) {
        			props.history.push("/app/networks");
        		}
        	}
        }), Meteor.subscribe("utilities")]
    }
})(withRouter(APIsCreds))
