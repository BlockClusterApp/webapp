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
            rpcLoading: false,
            restLoading: false
        };
    }

    componentWillUnmount() {
        this.props.subscriptions.forEach((s) =>{
            s.stop();
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
                                                    <div className="card-title">Username and Password of JSON-RPC
                                                    </div>
                                                </div>
                                                <div className="card-block">
                                                    <h3>
                                                        Making JSON-RPC Calls
                                                    </h3>
                                                    <p>BlockCluster's node's JSON-RPC APIs are protected using HTTP Basic Authentication. In web3.js, you can use the below code snippet to easily get your application authenticated:</p>
                                                    <pre>
                                                        let web3 = new Web3(
                                                            new Web3.providers.HttpProvider(
                                                            	"http://" + "username" + ":" + "password" + "@" + "x.x.x.x/jsonRPC" + ":" + "port"
                                                            )
                                                        )
                                                    </pre>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-lg-7">
                                            <div className="card card-transparent">
                                                <div className="card-block">
                                                    <form id="form-project" role="form" onSubmit={this.onInviteSubmit} autoComplete="off">
                                                        <p>Update Credentials</p>
                                                        <div className="form-group-attached">
                                                            <div className="row clearfix">
                                                                <div className="col-md-6">
                                                                    <div className="form-group form-group-default required">
                                                                        <label>Network name</label>
                                                                        <select className="form-control" ref={(input) => {this.networkNameInvite = input;}}>
                                                                            {this.props.networks.map((item, index) => {
                                                                                return (
                                                                                    <option value={item._id} key={item._id}>{item.name}</option>
                                                                                )
                                                                            })}
                                                                        </select>
                                                                    </div>
                                                                </div>
                                                                <div className="col-md-6">
                                                                    <div className="form-group form-group-default required">
                                                                        <label>Node Type</label>
                                                                        <select className="form-control" ref={(input) => {this.nodeTypeInvite = input;}}>
                                                                            <option value="authority">Validator</option>
                                                                            <option value="peer">Peer</option>
                                                                        </select>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="row clearfix">
                                                                <div className="col-md-12">
                                                                    <div className="form-group form-group-default required">
                                                                        <label>User Email</label>
                                                                        <input ref={(input) => {this.email = input;}} type="email" className="form-control" name="firstName" required placeholder="admin@blockcluster.io" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <br />
                                                        {this.state.inviteFormSubmitError != '' &&
                                                            <div className="row">
                                                                <div className="col-md-12">
                                                                    <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                                        <button className="close" data-dismiss="alert"></button>
                                                                        {this.state.inviteFormSubmitError}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        }

                                                        <LaddaButton
                                                            loading={this.state.inviteLoading}
                                                            data-size={S}
                                                            data-style={SLIDE_UP}
                                                            data-spinner-size={30}
                                                            data-spinner-lines={12}
                                                            className="btn btn-success"
                                                            type="submit"
                                                        >
                                                            <i className="fa fa-plus-circle" aria-hidden="true"></i>&nbsp;&nbsp;Invite
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
