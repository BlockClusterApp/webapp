import React, {Component} from "react";
import {withTracker} from "meteor/react-meteor-data";
import {Networks} from "../../../collections/networks/networks.js"
import {Utilities} from "../../../collections/utilities/utilities.js"
import {withRouter} from 'react-router-dom'
import helpers from "../../../modules/helpers"
import notifications from "../../../modules/notifications"
import ReactHtmlParser, { processNodes, convertNodeToElement, htmlparser2 } from "react-html-parser";
import LaddaButton, { S, SLIDE_UP } from "react-ladda";

import "./ViewEditNetwork.scss"

class ViewEditNetwork extends Component {
	constructor() {
        super()

        this.state = {
            deleting: false
        };
    }

	componentWillUnmount() {
        this.props.subscriptions.forEach((s) =>{
            s.stop();
        });
    }

    deleteNetwork = () => {
		this.setState({
            deleting: true
        });

    	Meteor.call("deleteNetwork", this.props.network[0].instanceId, (error) => {
    		if(error) {
    			notifications.error("An error occured")
    		} else {
    			this.props.history.push("/app/networks");
    			notifications.success("Network deleted successful")
    		}

			this.setState({
	            deleting: false
	        });
    	})
    }

    vote = (e) => {
    	e.preventDefault()
    	Meteor.call("vote", this.props.network[0]._id, this.authorityAddress.value, (error) => {
    		if(error) {
    			notifications.error("An error occured")
    		} else {
    			notifications.success("Voted Successfully")
    			this.authorityAddress.value = "";
    		}
    	})
    }

    unVote = (e) => {
    	e.preventDefault()
    	Meteor.call("unVote", this.props.network[0]._id, this.authorityAddress.value, (error) => {
    		if(error) {
    			notifications.error("An error occured")
    		} else {
    			notifications.success("Unvoted Successfully")
                this.authorityAddress.value = "";
    		}
    	})
    }

	createAccount = (e) => {
		e.preventDefault();
		Meteor.call("createAccount", this.accountPassword.value, this.props.network[0]._id, (error) => {
			if(error) {
				notifications.error("An error occured")
			} else {
				notifications.success("Account created")
				this.accountPassword.value = "";
			}
		})
	}

	render(){
		return (
			<div className="content ">
                <div className="m-t-20 container-fluid container-fixed-lg bg-white">
		            <div className="row viewEditNetwork">
		                <div className="col-lg-12">
		                	<div className="m-t-20 m-b-20 m-l-20 m-r-20">
		                		<h3>Detailed Information of Network "{this.props.network.length === 1 ? this.props.network[0].name : ""}"</h3>
			                    <p>Here you will find information to connect your DApps to the node, let other's join your network and also allows you to connect to other nodes</p>
			                    <br />
			                    <p className="small hint-text">It is recommended that you don't execute commands in VM to read or add
			                        <br /> any admin related data. Please make changes from here only.
			                    </p>
			                    <div className="form-horizontal">
			                        <div className="form-group row">
			                            <label htmlFor="fname" className="col-md-3 control-label">Instance ID</label>
			                            <div className="col-md-9">
			                                <span className="value-valign-middle">{this.props.network.length === 1 ? this.props.network[0].instanceId : ""}</span>
			                            </div>
			                        </div>
			                        <div className="form-group row">
			                            <label className="col-md-3 control-label">Member Type</label>
			                            <div className="col-md-9">
			                                <span className="value-valign-middle">{this.props.network.length === 1 ? helpers.firstLetterCapital(this.props.network[0].peerType) : ""}</span>
			                            </div>
			                        </div>
			                        <div className="form-group row">
			                            <label className="col-md-3 control-label">Status</label>
			                            <div className="col-md-9">
			                                <b className="value-valign-middle-status">{this.props.network.length === 1 ? ReactHtmlParser(helpers.convertStatusToTag(this.props.network[0].status, helpers.firstLetterCapital(this.props.network[0].status))) : ""}</b>
			                            </div>
			                        </div>
			                        <div className="form-group row">
			                            <label className="col-md-3 control-label">Created On</label>
			                            <div className="col-md-9">
			                                <span className="value-valign-middle">{this.props.network.length === 1 ? helpers.timeConverter(this.props.network[0].createdOn / 1000) : ""}</span>
			                            </div>
			                        </div>
			                        <div className="form-group row">
			                            <label className="col-md-3 control-label">Public URL</label>
			                            <div className="col-md-9">
			                                <b className="value-valign-middle">
			                                	{
						   							(() => {
						       							if (this.props.network.length === 1) {
						       								if("nodeId" in this.props.network[0]) {
						       									return (
						       										"enode://" + this.props.network[0].nodeId + "@" + this.props.workerNodeIP[0].value + ":" + this.props.network[0].ethNodePort
						       									)
						       								}
						       							}
						       						})()
						   						}
			                                </b>
			                            </div>
			                        </div>
			                        <div className="form-group row">
			                            <label className="col-md-3 control-label">Constellation IP and Port</label>
			                            <div className="col-md-9">
			                                <b className="value-valign-middle">
			                                	{
						   							(() => {
						       							if (this.props.network.length === 1) {
						       								if("constellationNodePort" in this.props.network[0]) {
						       									return (
						       										this.props.workerNodeIP[0].value + ":" + this.props.network[0].constellationNodePort
						       									)
						       								}
						       							}
						       						})()
						   						}
			                                </b>
			                            </div>
			                        </div>
			                        <div className="form-group row">
			                            <label className="col-md-3 control-label">Constellation Public Key</label>
			                            <div className="col-md-9">
			                                <b className="value-valign-middle">
			                                	{
						   							(() => {
						       							if (this.props.network.length === 1) {
						       								if("constellationPubKey" in this.props.network[0]) {
						       									return (
						       										helpers.firstLetterCapital(this.props.network[0].constellationPubKey)
						       									)
						       								}
						       							}
						       						})()
						   						}
			                                </b>
			                            </div>
			                        </div>
			                        {
			   							(() => {
			       							if (this.props.network.length === 1) {
			       								if(this.props.network[0].peerType === "authority") {
			       									return (
			       										<div className="form-group row">
								                            <label className="col-md-3 control-label">Vote or Unvote Authority</label>
								                            <div className="col-md-9">
							                            		<form className="row form-horizontal">
							                            			<div className="col-md-6">
								                                        <input type="text" className="form-control" required placeholder="Authority Identity Address" ref={(input) => {this.authorityAddress = input;}} />
								                                    </div>
								                                    <div className="col-md-6">
								                                    	<button className="btn btn-complete btn-cons" onClick={this.vote}><i className="fa fa-thumbs-up" aria-hidden="true"></i>&nbsp;Vote</button>
								                                    	<button className="btn btn-warning btn-cons" onClick={this.unVote}><i className="fa fa-thumbs-down" aria-hidden="true"></i>&nbsp;Unvote</button>
								                                    </div>
							                            		</form>
								                            </div>
								                        </div>
			       									)
			       								}
			          						}
			   							})()
									}
									{
			   							(() => {
			       							if (this.props.network.length === 1) {
			       								if(this.props.network[0].peerType === "authority") {
			       									return (
			       										<div className="form-group row">
								                            <label className="col-md-3 control-label">Your Authority Identity Address</label>
								                            <div className="col-md-9">
								                                <span className="value-valign-middle">{this.props.network.length === 1 ? this.props.network[0].nodeEthAddress  : ""}</span>
								                            </div>
								                        </div>
			       									)
			       								}
			          						}
			   							})()
									}

									<div className="form-group row">
										<label className="col-md-3 control-label">Accounts</label>
										<div className="col-md-9">
											<form className="row form-horizontal">
												<div className="col-md-12">
													{
							   							(() => {
							       							if (this.props.network.length === 1) {
																if(this.props.network[0].accounts !== undefined) {
																	if(this.props.network[0].accounts.length > 0) {
								       									return (
								       										<ul ref={(input) => {this.accountAddress = input;}}>
								       											{this.props.network[0].accounts.map((item, index) => {
											                                        return (
											                                            <li key={item}>{item}</li>
											                                        )
											                                    })}
								       										</ul>
								       									)
								       								} else {
																		return (
																			<span className="value-valign-middle">No Accounts</span>
																		)
																	}
																}
							       							}
							       						})()
							   						}
												</div>
											</form>
										</div>
									</div>

									<div className="form-group row">
										<label className="col-md-3 control-label">Create Account</label>
										<div className="col-md-9">
											<form className="row form-horizontal">
												<div className="col-md-4">
													<input type="password" className="form-control" required placeholder="New Account Password" ref={(input) => {this.accountPassword = input;}} />
												</div>
												<div className="col-md-8">
													<button className="btn btn-complete btn-cons" onClick={this.createAccount}><i className="fa fa-plus" aria-hidden="true"></i>&nbsp;Create</button>
												</div>
											</form>
										</div>
									</div>

									<div className="form-group row">
										<label className="col-md-3 control-label">Assets Smart Contract</label>
										<div className="col-md-9">
											<span className="value-valign-middle">
												{
													(() => {
														if (this.props.network.length === 1) {
															if(typeof this.props.network[0].assetsContractAddress === undefined ) {
																return (
																	""
																)
															} else if (this.props.network[0].assetsContractAddress !== "") {
																return (
																	this.props.network[0].assetsContractAddress
																)
															} else {
																return (
																	"Not Found"
																)
															}
														}
													})()
												}
											</span>
										</div>
									</div>
									<div className="form-group row">
										<label className="col-md-3 control-label">Atomic Swap Smart Contract</label>
										<div className="col-md-9">
											<span className="value-valign-middle">
												{
													(() => {
														if (this.props.network.length === 1) {
															if(typeof this.props.network[0].atomicSwapContractAddress === undefined ) {
																return (
																	""
																)
															} else if (this.props.network[0].atomicSwapContractAddress !== "") {
																return (
																	this.props.network[0].atomicSwapContractAddress
																)
															} else {
																return (
																	"Not Found"
																)
															}
														}
													})()
												}
											</span>
										</div>
									</div>
									<div className="form-group row">
										<label className="col-md-3 control-label">Streams Smart Contract</label>
										<div className="col-md-9">
											<span className="value-valign-middle">
												{
													(() => {
														if (this.props.network.length === 1) {
															if(typeof this.props.network[0].streamsContractAddress === undefined ) {
																return (
																	""
																)
															} else if (this.props.network[0].streamsContractAddress !== "") {
																return (
																	this.props.network[0].streamsContractAddress
																)
															} else {
																return (
																	"Not Found"
																)
															}
														}
													})()
												}
											</span>
										</div>
									</div>

									<div className="form-group row">
			                            <div className="col-md-3">
			                                <p>You can download and share the genesis block for other's to connect to this network. </p>
			                            </div>
			                            <div className="col-md-9">
			                                <button className="btn btn-primary btn-cons" type="button" onClick={() => {
			                                	if(this.props.network.length === 1) {
			                                		if(this.props.network[0].genesisBlock !== undefined) {
			                                			helpers.downloadString(this.props.network[0].genesisBlock, "application/json", "genesis.json")
			                                		} else {
														notifications.success("Genesis file not ready for download")
			                                		}
			                                	} else {
													notifications.error("Genesis file not ready for download")
		                                		}
			                                }}><i className="fa fa-download" aria-hidden="true"></i>&nbsp;Download Genesis File</button>
			                            </div>
			                        </div>

									<div className="form-group row">
			                            <label className="col-md-3 control-label">Current Network Authorities</label>
			                            <div className="col-md-9">
			                            	<ul className="customList">
			                            		{
						   							(() => {
						       							if (this.props.network.length === 1) {
						       								if("currentValidators" in this.props.network[0]) {
						       									return (
						       										<div>
						       											{this.props.network[0].currentValidators.map((item, index) => {
									                                        return (
									                                            <li key={item}>{item}</li>
									                                        )
									                                    })}
						       										</div>
						       									)
						       								}
						       							}
						       						})()
						   						}
			                            	</ul>
			                            </div>
		                        	</div>

		                        	{
			   							/*(() => {
			       							if (this.props.network.length === 1) {
			       								if(this.props.network[0].type === "join") {
			       									return (
			       										<div className="form-group row">
								                            <label className="col-md-3 control-label">Ethereum Nodes Connected To</label>
								                            <div className="col-md-9">
								                                <ul className="customList">
								                            		{
											   							(() => {
											       							if (this.props.network.length === 1) {
											       								if("totalENodes" in this.props.network[0]) {
											       									return (
											       										<div style={{"wordWrap": "break-word"}}>
											       											{this.props.network[0].totalENodes.map((item, index) => {
														                                        return (
														                                            <li key={item}>{item}</li>
														                                        )
														                                    })}
											       										</div>
											       									)
											       								}
											       							}
											       						})()
											   						}
								                            	</ul>
								                            </div>
								                        </div>
			       									)
			       								}
			          						}
			   							})()*/
									}

									{
			   							/*(() => {
			       							if (this.props.network.length === 1) {
			       								if(this.props.network[0].type === "join") {
			       									return (
			       										<div className="form-group row">
								                            <label className="col-md-3 control-label">Constellation Nodes Connected To</label>
								                            <div className="col-md-9">
								                                <ul className="customList">
								                            		{
											   							(() => {
											       							if (this.props.network.length === 1) {
											       								if("totalConstellationNodes" in this.props.network[0]) {
											       									return (
											       										<div>
											       											{this.props.network[0].totalConstellationNodes.map((item, index) => {
														                                        return (
														                                            <li key={item}>{item}</li>
														                                        )
														                                    })}
											       										</div>
											       									)
											       								}
											       							}
											       						})()
											   						}
								                            	</ul>
								                            </div>
								                        </div>
			       									)
			       								}
			          						}
			   							})()*/
									}

			                        {/*<div className="form-group row">
			                            <label className="col-md-3 control-label">Work</label>
			                            <div className="col-md-9">
			                                <p>Have you Worked at page Inc. before, Or joined the Pages Supirior Club?</p>
			                                <p className="hint-text small">If yes State which Place, if yes note date and Job CODE / Membership Number</p>
			                                <div className="row">
			                                    <div className="col-md-5">
			                                        <input type="text" className="form-control" required />
			                                    </div>
			                                    <div className="col-md-5 sm-m-t-10">
			                                        <input type="text" placeholder="Code/Number" className="form-control" />
			                                    </div>
			                                </div>
			                            </div>
			                        </div>*/}
			                        <div className="row form-group">
			                            <div className="col-md-3">
			                                <p>You can leave the network if you wish but remember that if you are only one member then all data will be lost.</p>
			                            </div>
			                            <div className="col-md-9">
											<LaddaButton
	                                            loading={this.state.deleting}
	                                            data-size={S}
	                                            data-style={SLIDE_UP}
	                                            data-spinner-size={30}
	                                            data-spinner-lines={12}
	                                            className="btn btn-danger btn-cons"
	                                            onClick={this.deleteNetwork}
	                                        >
	                                            <i className="fa fa-trash-o" aria-hidden="true"></i>&nbsp;Yes! Leave Network
	                                        </LaddaButton>
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
        network: Networks.find({_id: props.match.params.id}).fetch(),
		workerNodeIP: Utilities.find({"name": "workerNodeIP"}).fetch(),
        subscriptions: [Meteor.subscribe("networks", {
        	onReady: function (){
        		if(Networks.find({_id: props.match.params.id}).fetch().length !== 1) {
        			props.history.push("/app/networks");
        		}
        	}
        }), Meteor.subscribe("utilities")]
    }
})(withRouter(ViewEditNetwork))
