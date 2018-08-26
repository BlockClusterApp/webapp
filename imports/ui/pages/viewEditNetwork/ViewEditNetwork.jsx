import React, {Component} from "react";
import {withTracker} from "meteor/react-meteor-data";
import {Networks} from "../../../collections/networks/networks.js"
import {withRouter} from 'react-router-dom'
import helpers from "../../../modules/helpers"
import notifications from "../../../modules/notifications"
import ReactHtmlParser, { processNodes, convertNodeToElement, htmlparser2 } from "react-html-parser";
import LaddaButton, { S, SLIDE_UP } from "react-ladda";
import {Link} from "react-router-dom";
import Config from "../../../modules/config/client";

import "./ViewEditNetwork.scss"

class ViewEditNetwork extends Component {
	constructor() {
        super()
        this.state = {
			deleting: false,
			location: "us-west-2",
			locations: [],
			currentValidators: []
        };

      this.locationConfig = {};

	  this.refreshAuthoritiesList = this.refreshAuthoritiesList.bind(this)
    }

	componentWillUnmount() {
        this.props.subscriptions.forEach((s) =>{
            s.stop();
        });

		clearTimeout(this.state.refreshAuthoritiesListTimer);
	}

	componentDidMount(){
		Meteor.call("getClusterLocations", (err, res) => {
			this.setState({
			  locations: res
			});
		});

		this.setState({
            refreshAuthoritiesListTimer: setTimeout(this.refreshAuthoritiesList, 500)
        })
	}

	refreshAuthoritiesList() {
        let rpc = null;
        let status = null;

        if(this.props.network.length === 1) {
            username = this.props.network[0].instanceId
            password = this.props.network[0]["api-password"]
            status = this.props.network[0].status
        }

        if(status == "running") {
            let url = `https://${Config.workerNodeDomainName(this.props.network[0].locationCode)}/api/node/${this.props.network[0].instanceId}/utility/nodeInfo`;
            HTTP.get(url, {
                headers: {
                    'Authorization': "Basic " + (new Buffer(`${username}:${password}`).toString("base64"))
                }
            }, (err, res) => {
                if(!err) {
                    this.setState({
                        currentValidators: (res.data.currentValidators ? res.data.currentValidators : [])
                    }, () => {
                        this.setState({
                            refreshAuthoritiesListTimer: setTimeout(this.refreshAuthoritiesList, 500)
                        })
                    });
                } else {
                    this.setState({
                        refreshAuthoritiesListTimer: setTimeout(this.refreshAuthoritiesList, 500)
                    })
                }
            })
        } else {
            this.setState({
                refreshAuthoritiesListTimer: setTimeout(this.refreshAuthoritiesList, 500)
            })
        }
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

	downloadAccount = (e, address) => {
		e.preventDefault();
		this.setState({
            [address + "_downloading"]: true
        });

		Meteor.call("downloadAccount", this.props.network[0].instanceId, address, (error, result) => {
			if(!error) {
				helpers.downloadString(result, "application/json", "key.json")
			} else {
				notifications.error("An error occured")
			}

			this.setState({
	            [address + "_downloading"]: false
	        });
		})
	}

	getLocationName = (locationCode) => {
		const locationConfig = this.state.locations.find(a => a.locationCode === locationCode);
		if(!locationConfig) {
			return undefined;
		}
		return locationConfig.locationName
	}

	render(){
    if(this.props.network[0]){
      this.locationConfig = this.state.locations.find(i => i && i.locationCode === this.props.network[0].locationCode);
      if(!this.locationConfig) {
        this.locationConfig = {};
      }
    }

		return (
			<div className="content ">
                <div className="m-t-20 container-fluid container-fixed-lg bg-white">
		            <div className="row viewEditNetwork">
		                <div className="col-lg-12">
		                	<div className="m-t-20 m-b-20 m-l-20 m-r-20">
		                		<Link to={"/app/networks/" + this.props.match.params.id}> Control Panel <i className="fa fa-angle-right"></i></Link> Node Info
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
			                                <b className="value-valign-middle-status">{this.props.network.length === 1 ? ReactHtmlParser(helpers.convertStatusToTag(helpers.calculateNodeStatus(this.props.network[0].status), helpers.firstLetterCapital(helpers.calculateNodeStatus(this.props.network[0].status)))) : ""}</b>
			                            </div>
			                        </div>

			                        <div className="form-group row">
			                            <label className="col-md-3 control-label">Location</label>
			                            <div className="col-md-9">
			                                <b className="value-valign-middle-status">{this.props.network.length === 1 ?  this.getLocationName(this.props.network[0].locationCode) : undefined}</b>
			                            </div>
			                        </div>
									<div className="form-group row">
			                            <label className="col-md-3 control-label">Machine Details</label>
			                            <div className="col-md-9">
			                                <span className="value-valign-middle-status">{this.props.network.length === 1 ? (parseFloat(this.props.network[0].networkConfig.cpu) / 1000) + " vCPU" : ""}, {this.props.network.length === 1 ? (parseFloat(this.props.network[0].networkConfig.ram)) + " GB RAM" : ""}, {this.props.network.length === 1 ? (parseFloat(this.props.network[0].networkConfig.disk)) + " GB Disk" : ""}</span>
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
						       										"enode://" + this.props.network[0].nodeId + "@" + this.locationConfig.workerNodeIP + ":" + this.props.network[0].ethNodePort
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

									{/*<div className="form-group row">
										<label className="col-md-3 control-label">Accounts</label>
										<div className="col-md-9">
											<form className="row form-horizontal">
												<div className="col-md-12">
													{
							   							(() => {
							       							if (this.props.network.length === 1) {
																if(this.props.network[0].accounts !== undefined) {
																	if(Object.keys(this.props.network[0].accounts).length > 0) {
								       									return (
								       										<ul ref={(input) => {this.accountAddress = input;}}>
								       											{Object.keys(this.props.network[0].accounts).map((item, index) => {
											                                        return (
											                                            <li key={item}>
																							{item} &nbsp;
																							{(this.state[item + "_downloading"] == true) &&
																								<div className="clickable" style={{width: "14px", height: "14px", "display": "inline-block"}}>
																								    <div style={{width: "100%", height: "100%"}} className="lds-wedges">
																								        <div>
																								            <div>
																								                <div></div>
																								            </div>
																								            <div>
																								                <div></div>
																								            </div>
																								            <div>
																								                <div></div>
																								            </div>
																								            <div>
																								                <div></div>
																								            </div>
																								        </div>
																								    </div>
																								    <style type="text/css">
																								    </style>
																								</div>
																							}
																							{(this.state[item + "_downloading"] != true) &&
																								<i className="clickable fa fa-download" onClick={(e) => {this.downloadAccount(e, item)}}></i>
																							}
																						</li>
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
									</div>*/}


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
													this.state.currentValidators.map((item, index) => {
														return (
															<li key={item}>{item}</li>
														)
													})
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
        network: Networks.find({instanceId: props.match.params.id, active: true}).fetch(),
        subscriptions: [Meteor.subscribe("networks", {
        	onReady: function (){
        		if(Networks.find({instanceId: props.match.params.id, active: true}).fetch().length !== 1) {
        			props.history.push("/app/networks");
        		}
        	}
        })]
    }
})(withRouter(ViewEditNetwork))
