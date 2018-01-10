import React, {Component} from "react";
import {withTracker} from "meteor/react-meteor-data";
import {Networks} from "../../../collections/networks/networks.js"
import {Utilities} from "../../../collections/utilities/utilities.js"
import {withRouter} from 'react-router-dom'
import helpers from "../../../modules/helpers"
import ReactHtmlParser, { processNodes, convertNodeToElement, htmlparser2 } from "react-html-parser";

import "./ViewEditNetwork.scss"

class ViewEditNetwork extends Component {
	componentWillUnmount() {
        this.props.subscriptions.forEach((s) =>{
            s.stop();
        });
    }

    deleteNetwork = () => {
    	Meteor.call("deleteNetwork", this.props.network[0]._id, (error) => {
    		if(error) {
    			$("body").pgNotification({
                    style: "circle",
                    message: "An error occured",
                    position: "bottom-right",
                    timeout: 5000,
                    type: "error",
                    thumbnail: '<img width="40" height="40" style="display: inline-block;" src="/assets/img/icons/profile.png" alt="">'
                }).show();
    		} else {
    			this.props.history.push("/app");

                $("body").pgNotification({
                    style: "circle",
                    message: "Network deleted successful",
                    position: "bottom-right",
                    timeout: 5000,
                    type: "success",
                    thumbnail: '<img width="40" height="40" style="display: inline-block;" src="/assets/img/icons/profile.png" alt="">'
                }).show();
    		}
    	})
    }

    vote = (e) => {
    	e.preventDefault()
    	Meteor.call("vote", this.props.network[0]._id, this.authorityAddress.value, (error) => {
    		if(error) {
    			$("body").pgNotification({
                    style: "circle",
                    message: "An error occured",
                    position: "bottom-right",
                    timeout: 5000,
                    type: "error",
                    thumbnail: '<img width="40" height="40" style="display: inline-block;" src="/assets/img/icons/profile.png" alt="">'
                }).show();
    		} else {
                $("body").pgNotification({
                    style: "circle",
                    message: "Voted Successfully",
                    position: "bottom-right",
                    timeout: 5000,
                    type: "success",
                    thumbnail: '<img width="40" height="40" style="display: inline-block;" src="/assets/img/icons/profile.png" alt="">'
                }).show();
    			this.authorityAddress.value = "";
    		}
    	})
    }

    unVote = (e) => {
    	e.preventDefault()
    	Meteor.call("unVote", this.props.network[0]._id, this.authorityAddress.value, (error) => {
    		if(error) {
    			$("body").pgNotification({
                    style: "circle",
                    message: "An error occured",
                    position: "bottom-right",
                    timeout: 5000,
                    type: "error",
                    thumbnail: '<img width="40" height="40" style="display: inline-block;" src="/assets/img/icons/profile.png" alt="">'
                }).show();
    		} else {
                $("body").pgNotification({
                    style: "circle",
                    message: "Voted Successfully",
                    position: "bottom-right",
                    timeout: 5000,
                    type: "success",
                    thumbnail: '<img width="40" height="40" style="display: inline-block;" src="/assets/img/icons/profile.png" alt="">'
                }).show();
                this.authorityAddress.value = "";
    		}
    	})
    }

	render(){
		return (
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
	                                <span className="value-valign-middle">{this.props.network.length === 1 ? this.props.network[0]._id.toLowerCase() : ""}</span>
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
				       										"enode://" + this.props.network[0].nodeId + "@" + this.props.network[0].clusterIP + ":" + this.props.network[0].realEthNodePort
				       									)
				       								}
				       							}
				       						})()
				   						}
	                                </b>
	                            </div>
	                        </div>
	                        <div className="form-group row">
	                            <label className="col-md-3 control-label">HTTP-RPC URL</label>
	                            <div className="col-md-9">
	                                <b className="value-valign-middle">
	                                	{
				   							(() => {
				       							if (this.props.network.length === 1) {
				       								if("rpcNodePort" in this.props.network[0]) {
				       									return (
				       										"http://" + Utilities.find({"name": "minikube-ip"}).fetch()[0].value + ":" + this.props.network[0].realRPCNodePort
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
				       										this.props.network[0].clusterIP + ":" + this.props.network[0].realConstellationNodePort
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
	                            <div className="col-md-3">
	                                <p>You can download and share the genesis block for other's to connect to this network. </p>
	                            </div>
	                            <div className="col-md-9">
	                                <button className="btn btn-primary btn-cons" type="button" onClick={() => {
	                                	if(this.props.network.length === 1) {
	                                		if(this.props.network[0].genesisBlock !== undefined) {
	                                			helpers.downloadString(this.props.network[0].genesisBlock, "application/json", "genesis.json")
	                                		} else {
	                                			$("body").pgNotification({
								                    style: "circle",
								                    message: "Genesis file not ready for download",
								                    position: "bottom-right",
								                    timeout: 5000,
								                    type: "success",
								                    thumbnail: '<img width="40" height="40" style="display: inline-block;" src="/assets/img/icons/profile.png" alt="">'
								                }).show();
	                                		}
	                                	} else {
                                			$("body").pgNotification({
							                    style: "circle",
							                    message: "Genesis file not ready for download",
							                    position: "bottom-right",
							                    timeout: 5000,
							                    type: "success",
							                    thumbnail: '<img width="40" height="40" style="display: inline-block;" src="/assets/img/icons/profile.png" alt="">'
							                }).show();
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
	   							(() => {
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
	   							})()
							}

							{
	   							(() => {
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
	   							})()
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
	                                <button onClick={this.deleteNetwork} className="btn btn-danger btn-cons" type="submit"><i className="fa fa-trash-o" aria-hidden="true"></i>&nbsp;Yes! Leave Network</button>
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
        subscriptions: [Meteor.subscribe("networks", {
        	onReady: function (){
        		if(Networks.find({_id: props.match.params.id}).fetch().length !== 1) {
        			props.history.push("/app");
        		} 
        	}
        }), Meteor.subscribe("utilities")]
    }
})(withRouter(ViewEditNetwork))