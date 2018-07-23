import React, {Component} from "react";
import {withTracker} from "meteor/react-meteor-data";
import {Networks} from "../../../collections/networks/networks.js"
import {withRouter} from 'react-router-dom'
import helpers from "../../../modules/helpers"
import notifications from "../../../modules/notifications"
import ReactHtmlParser, { processNodes, convertNodeToElement, htmlparser2 } from "react-html-parser";
import LaddaButton, { S, SLIDE_UP } from "react-ladda";
import {Link} from "react-router-dom";
import Config from '../../../modules/config/client';

import "./viewNetwork.scss"

class ViewNetwork extends Component {
	constructor() {
        super()
    }

	render(){
		return (
            <div className="content viewNetwork">
                <div className=" container-fluid   container-fixed-lg">
                    <div className="row">
                        <div className="col-sm-12">
                            <div className="card card-transparent">
								<div className="card-header ">
                    				<div className="card-title">
										<Link to={"/app/networks"}> <i className="fa fa-angle-left"></i> All Networks</Link>
                    				</div>
                  				</div>
                                <div className="card-block">
									<h2>
										{this.props.network.length === 1 ? this.props.network[0].name : ""}
									</h2>
                                    <h5>
                                         {this.props.network.length === 1 ? helpers.firstLetterCapital(this.props.network[0].peerType) : ""} node created on {this.props.network.length === 1 ? helpers.timeConverter(this.props.network[0].createdOn / 1000) : ""}. Here is the control panel for this blockchain node.
                                    </h5>
                                    <hr />
                                    <div className="row ">
                                        <div className="col-lg-3">
                                            <p>
                                                Assets
                                            </p>
                                            <div className="row m-l-5 m-t-10">
                                                <div className="col-1 card-left-piller no-padding ">
                                                    <div className="light-black-bg p-t-30 p-b-35"></div>
                                                    <div className="bg-master-light p-t-30 p-b-35"></div>
                                                    <div className="light-black-bg p-t-30 p-b-35"></div>
                                                </div>
                                                <div className="col-10 bg-white b-a b-grey padding-10">
                                                    <div className="clickable" onClick={() => {
															this.props.network.length === 1 ? this.props.history.push("/app/networks/" + this.props.network[0].instanceId + "/assets/create") : ""
														}}>
                                                        <p className="no-margin text-black bold text-uppercase fs-12">Create Asset Type</p>
                                                        <p className="no-margin fs-12">Bulk or Solo Asset</p>
                                                    </div>
                                                    <div className="clickable" onClick={() => {
															this.props.network.length === 1 ? this.props.history.push("/app/networks/" + this.props.network[0].instanceId + "/assets/management") : ""
														}}>
                                                        <p className="p-t-20 no-margin text-black bold text-uppercase fs-12">Manage Assets</p>
                                                        <p className="no-margin fs-12">Issue and Transfer</p>
                                                    </div>
                                                    <div className="clickable" onClick={() => {
															this.props.network.length === 1 ? this.props.history.push("/app/networks/" + this.props.network[0].instanceId + "/assets/stats") : ""
														}}>
                                                        <p className="p-t-20 no-margin text-black bold text-uppercase fs-12">Stats</p>
                                                        <p className="no-margin fs-12">Total Units</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <br />
                                            <p className="small hint-text">
                                                Assets are programmable. You can write your own smart contracts to interact with the assets.
                                            </p>
                                        </div>
                                        <div className="col-lg-3">
                                            <p>
                                                Streams
                                            </p>
                                            <div className="row m-l-5 m-t-10">
                                                <div className="col-1 card-left-piller no-padding ">
                                                    <div className="light-black-bg p-t-30 p-b-35"></div>
                                                    <div className="bg-master-light p-t-30 p-b-35"></div>
                                                    <div className="light-black-bg p-t-30 p-b-35"></div>
                                                </div>
                                                <div className="col-10 bg-white b-a b-grey padding-10">
                                                    <div className="clickable" onClick={() => {
															this.props.network.length === 1 ? this.props.history.push("/app/networks/" + this.props.network[0].instanceId + "/streams/create") : ""
														}}>
                                                        <p className="no-margin text-black bold text-uppercase fs-12">Create Stream</p>
                                                        <p className="no-margin fs-12">Timestamped Events</p>
                                                    </div>
                                                    <div className="clickable" onClick={() => {
															this.props.network.length === 1 ? this.props.history.push("/app/networks/" + this.props.network[0].instanceId + "/streams/publish") : ""
														}}>
                                                        <p className="p-t-20 no-margin text-black bold text-uppercase fs-12">Publish</p>
                                                        <p className="no-margin fs-12">Send Event</p>
                                                    </div>
                                                    <div className="clickable" onClick={() => {
															this.props.network.length === 1 ? this.props.history.push("/app/networks/" + this.props.network[0].instanceId + "/streams/subscribe") : ""
														}}>
                                                        <p className="p-t-20 no-margin text-black bold text-uppercase fs-12">Subscribe</p>
                                                        <p className="no-margin fs-12">Receive Event</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <br />
                                            <p className="small hint-text">
                                                Streams are programmable. You can write your own smart contracts to interact with the streams.
                                            </p>
                                        </div>
                                    </div>
                                    <hr />
                                    <div className="row ">
                                        <div className="col-lg-3">
                                            <p>Advanced Features</p>
                                            <div className="row m-l-5 m-t-10">
                                                <div className="col-1 card-left-piller no-padding ">
                                                    <div className="light-black-bg p-t-30 p-b-35"></div>
                                                    <div className="bg-master-light p-t-30 p-b-35"></div>
                                                    <div className="light-black-bg p-t-30 p-b-35"></div>
                                                </div>
                                                <div className="col-10 bg-white b-a b-grey padding-10">
                                                    <div className="clickable" onClick={() => {
															this.props.network.length === 1 ? this.props.history.push("/app/networks/" + this.props.network[0].instanceId + "/assets/exchange") : ""
														}}>
                                                        <p className="no-margin text-black bold text-uppercase fs-12">Exchange</p>
                                                        <p className="no-margin fs-12">Cross-Chain Atomic Swaps</p>
                                                    </div>
                                                    <div className="clickable" onClick={() => {
															this.props.network.length === 1 ? this.props.history.push("/app/networks/" + this.props.network[0].instanceId + "/assets/search") : ""
														}}>
                                                        <p className="p-t-20 no-margin text-black bold text-uppercase fs-12">Search</p>
                                                        <p className="no-margin fs-12">No-SQL Style Queries</p>
                                                    </div>
													<div className="clickable" onClick={() => {
															this.props.network.length === 1 ? this.props.history.push("/app/networks/" + this.props.network[0].instanceId + "/assets/audit") : ""
														}}>
                                                        <p className="p-t-20 no-margin text-black bold text-uppercase fs-12">Asset History</p>
                                                        <p className="no-margin fs-12">Get Audit Trial of Asset's Changes</p>
                                                    </div>

                                                </div>
                                            </div>
                                            <br />
                                            <p className="small hint-text">
                                                Exchange Assets atomically, search assets and audit blockchain transactions
                                            </p>
                                        </div>
                                        <div className="col-lg-3">
                                            <p>Development Tools</p>
                                            <div className="row m-l-5 m-t-10">
                                                <div className="col-1 card-left-piller no-padding ">
                                                    <div className="light-black-bg p-t-30 p-b-35"></div>
                                                    <div className="bg-master-light p-t-30 p-b-35"></div>
                                                    <div className="light-black-bg p-t-30 p-b-35"></div>
                                                </div>
                                                <div className="col-10 bg-white b-a b-grey padding-10">
                                                    <div className="clickable">
                                                        <p className="no-margin text-black bold text-uppercase fs-12">Write Smart Contract</p>
                                                        <p className="no-margin fs-12">Compile and Deploy</p>
                                                    </div>
                                                    <div className="clickable">
                                                        <p className="p-t-20 no-margin text-black bold text-uppercase fs-12">Add Smart Contracts</p>
                                                        <p className="no-margin fs-12">Auditing, Indexing and APIs</p>
                                                    </div>
                                                    <div className="clickable" onClick={() => {
															this.props.network.length === 1 ? this.props.history.push("/app/networks/" + this.props.network[0].instanceId + "/bc-accounts") : ""
														}}>
                                                        <p className="p-t-20 no-margin text-black bold text-uppercase fs-12">Accounts</p>
                                                        <p className="no-margin fs-12">Create, Import and Export Keys</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <br />
                                            <p className="small hint-text">
                                                Tools to develop your own smart contracts and manage blockchain accounts
                                            </p>
                                        </div>
                                        <div className="col-lg-3">
                                            <p>Miscellaneous</p>
                                            <div className="row m-l-5 m-t-10">
                                                <div className="col-1 card-left-piller no-padding ">
                                                    <div className="light-black-bg p-t-30 p-b-35"></div>
                                                    <div className="bg-master-light p-t-30 p-b-35"></div>
                                                    <div className="light-black-bg p-t-30 p-b-35"></div>
                                                </div>
                                                <div className="col-10 bg-white b-a b-grey padding-10">
                                                    <div className="clickable" onClick={() => {
															this.props.network.length === 1 ? this.props.history.push("/app/networks/" + this.props.network[0].instanceId + "/impulse") : ""
														}}>
                                                        <p className="no-margin text-black bold text-uppercase fs-12">Proxy Re-Encryption</p>
                                                        <p className="no-margin fs-12">Store Encrypted Data</p>
                                                    </div>
                                                    <div className="clickable" onClick={() => {
															this.props.network.length === 1 ? this.props.history.push("/app/networks/" + this.props.network[0].instanceId + "/assets/events") : ""
														}}>
                                                        <p className="p-t-20 no-margin text-black bold text-uppercase fs-12">Register Callbacks</p>
                                                        <p className="no-margin fs-12">Add Callback URLs</p>
                                                    </div>
													<div className="clickable" onClick={() => {
															this.props.network.length === 1 ? this.props.history.push("/app/networks/" + this.props.network[0].instanceId + "/explorer") : ""
														}}>
                                                        <p className="p-t-20 no-margin text-black bold text-uppercase fs-12">Audit</p>
                                                        <p className="no-margin fs-12">Blockchain Explorer</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <br />
                                            <p className="small hint-text">
                                                Features providing privacy, notification and on-demand DApps
                                            </p>
                                        </div>
                                    </div>
                                    <hr />
                                    <div className="row ">
                                        <div className="col-lg-3">
                                            <p>Settings
                                            </p>
                                            <div className="row m-l-5 m-t-10">
                                                <div className="col-1 card-left-piller no-padding ">
                                                    <div className="light-black-bg p-t-30 p-b-35"></div>
                                                    <div className="bg-master-light p-t-30 p-b-35"></div>
                                                    <div className="light-black-bg p-t-30 p-b-35"></div>
                                                </div>
                                                <div className="col-10 bg-white b-a b-grey padding-10">
                                                    <div className="clickable" onClick={() => {
															this.props.network.length === 1 ? this.props.history.push("/app/networks/" + this.props.network[0].instanceId + "/settings") : ""
														}}>
                                                        <p className="no-margin text-black bold text-uppercase fs-12">Node Info and Settings</p>
                                                        <p className="no-margin fs-12">Node Authorities and IPs</p>
                                                    </div>

                                                    <div className="clickable" onClick={() => {
															this.props.network.length === 1 ? this.props.history.push("/app/networks/" + this.props.network[0].instanceId + "/security/peers") : ""
														}}>
                                                        <p className="p-t-20 no-margin text-black bold text-uppercase fs-12">Node Peers</p>
                                                        <p className="no-margin fs-12">Add or Remove Peers</p>
                                                    </div>
                                                    <div className="clickable" onClick={() => {
															this.props.network.length === 1 ? this.props.history.push("/app/networks/" + this.props.network[0].instanceId + "/security/apis") : ""
														}}>
                                                        <p className="p-t-20 no-margin text-black bold text-uppercase fs-12">APIs</p>
                                                        <p className="no-margin fs-12">Credentials and Docs</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <br />
                                            <p className="small hint-text">
                                                Control the node settings, network authorities, peers and measure performance
                                            </p>
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

export default withTracker(function(props) {
    return {
        network: Networks.find({instanceId: props.match.params.id}).fetch(),
        workerNodeIP: Config.workerNodeIP,
        subscriptions: [Meteor.subscribe("networks", {
        	onReady: function (){
        		if(Networks.find({instanceId: props.match.params.id}).fetch().length !== 1) {
        			props.history.push("/app/networks");
        		}
        	}
        })]
    }
})(withRouter(ViewNetwork))
