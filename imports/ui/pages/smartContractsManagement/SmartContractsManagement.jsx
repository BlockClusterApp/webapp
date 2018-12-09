import React, {Component} from "react";
import {withTracker} from "meteor/react-meteor-data";
import {Networks} from "../../../collections/networks/networks.js"
import helpers from "../../../modules/helpers"
import {withRouter} from 'react-router-dom'
import LaddaButton, { S, SLIDE_UP } from "react-ladda";
import notifications from "../../../modules/notifications"
import {Link} from "react-router-dom"
import Config from '../../../modules/config/client'

import "./SmartContractsManagement.scss"

class SmartContractsManagement extends Component {

    constructor() {
        super()
        this.state = {
            smartContracts: []
        }

        this.getSC = this.getSC.bind(this)
    }

    componentDidMount() {
        this.setState({
            refreshSCTimer: setInterval(this.getSC, 2000)
        })
    }

    componentWillUnmount() {
        this.props.subscriptions.forEach((s) =>{
            s.stop();
        });

        clearInterval(this.state.refreshSCTimer);
    }

    getSC() {
        if(this.props.network.length === 1) {
            let url = `https://${Config.workerNodeDomainName(this.props.network[0].locationCode)}/api/node/${this.props.network[0].instanceId}/contracts/search`;

            HTTP.call("POST", url, {
                "content": JSON.stringify({}),
                "headers": {
                    "Content-Type": "application/json",
                    'Authorization': "Basic " + (new Buffer(`${this.props.network[0].instanceId}:${this.props.network[0]["api-password"]}`).toString("base64"))
                }
            }, (error, response) => {
                if (!error) {
                    this.setState({
                        smartContracts: response.data
                    });
                } else {
                    console.log(error)
                }
            })
        }
    }

    addSC(e) {
        e.preventDefault();

        this.setState({
            ["_sc_formSubmitError"]: '',
            ["_sc_formloading"]: true,
            ["_sc_formSubmitSuccess"]: ''
        });

        e.preventDefault();
		Meteor.call("addSmartContract", this.name.value, this.bytecode.value, this.abi.value, this.props.network[0]._id, (error) => {
			if(error) {
                this.setState({
                    ["_sc_formSubmitError"]: error.reason,
                    ["_sc_formSubmitSuccess"]: "",
                    ["_sc_formloading"]: false
                });
			} else {
                this.setState({
                    ["_sc_formSubmitError"]: '',
                    ["_sc_formSubmitSuccess"]: "Successfully added contract",
                    ["_sc_formloading"]: false
                });
			}
		})
    }

    downloadSC = (e, item) => {
		e.preventDefault();
        let name = item.name;

		this.setState({
            [name + "_downloading"]: true
        });

        helpers.downloadString(JSON.stringify(item, null, "\t"), "application/json", `${item.name}.json`)

        this.setState({
            [name + "_downloading"]: false
        });
	}

	render(){
		return (
            <div className="smartContractsManagement content">
                <div className="m-t-20 container-fluid container-fixed-lg bg-white">
                    <div className="row dashboard">
                        <div className="col-lg-12">
                            <div className="card card-transparent">
                                <div className="card-header ">
                                    <div className="card-title">
                                        <Link to={"/app/networks/" + this.props.match.params.id}> Control Panel <i className="fa fa-angle-right"></i></Link> Smart Contracts Management
                                    </div>
                                </div>
                                <div className="card-block">
                                    {this.props.network.length === 1 &&
                                        <div>
                                            <div className="row column-seperation">
                                                <div className="col-lg-12">
                                                    <div className="card card-transparent">
                                                        <div className="row column-seperation">
                                                            <div className="col-lg-4">
                                                                <h4>Add Smart Contract</h4>
                                                                <form role="form" onSubmit={(e) => {
                                                                        this.addSC(e);
                                                                    }}>
                                                                    <div className="form-group">
                                                                        <label>Name</label>
                                                                        <input type="text" className="form-control" ref={(input) => {this.name = input;}} required />
                                                                    </div>
                                                                    <div className="form-group">
                                                                        <label>Bytecode</label>
                                                                        <textarea className="form-control" ref={(input) => {this.bytecode = input;}} style={{"height": "100px"}}></textarea>
                                                                    </div>
                                                                    <div className="form-group">
                                                                        <label>ABI</label>
                                                                        <textarea className="form-control" ref={(input) => {this.abi = input;}} style={{"height": "100px"}}></textarea>
                                                                    </div>
                                                                    {this.state["_sc_formSubmitError"] &&
                                                                        <div className="row m-t-15">
                                                                            <div className="col-md-12">
                                                                                <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                                                    <button className="close" data-dismiss="alert"></button>
                                                                                    {this.state["_sc_formSubmitError"]}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    }
                                                                    {this.state["_sc_formSubmitSuccess"] &&
                                                                        <div className="row m-t-15">
                                                                            <div className="col-md-12">
                                                                                <div className="m-b-20 alert alert-success m-b-0" role="alert">
                                                                                    <button className="close" data-dismiss="alert"></button>
                                                                                    {this.state["_sc_formSubmitSuccess"]}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    }
                                                                    <p className="pull-right">
                                                                        <LaddaButton
                                                                            loading={this.state["_sc_formloading"]}
                                                                            data-size={S}
                                                                            data-style={SLIDE_UP}
                                                                            data-spinner-size={30}
                                                                            data-spinner-lines={12}
                                                                            className="btn btn-success"
                                                                            type="submit"
                                                                        >
                                                                            <i className="fa fa-plus" aria-hidden="true"></i>&nbsp;&nbsp;Add
                                                                        </LaddaButton>
                                                                    </p>
                                                                </form>
                                                            </div>
                                                            <div className="col-lg-8">
                                                                <h4>Smart Contracts</h4>
                                                                <div className="table-responsive">
                                                                    <table className="table table-hover" id="basicTable">
                                                                        <thead>
                                                                            <tr>
                                                                                <th style={{width: "50%"}}>Name</th>
                                                                                <th style={{width: "25%"}}>Download</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {this.state.smartContracts.map((item) => {
                                                                                return (
                                                                                    <tr key={item.name}>
                                                                                        <td className="v-align-middle">
                                                                                            {item.name}
                                                                                        </td>
                                                                                        <td className="v-align-middle">
                                                                                            {(this.state[item.name + "_downloading"] == true) &&
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
                                                                                            {(this.state[item.name + "_downloading"] != true) &&
																								<i className="clickable fa fa-download" onClick={(e) => {this.downloadSC(e, item)}}></i>
																							}
                                                                                        </td>
                                                                                    </tr>
                                                                                )
                                                                            })}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    }
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
        network: Networks.find({instanceId: props.match.params.id, active: true}).fetch(),
        workerNodeDomainName: Config.workerNodeDomainName,
        subscriptions: [Meteor.subscribe("networks", {
        	onReady: function (){
        		if(Networks.find({instanceId: props.match.params.id, active: true}).fetch().length !== 1) {
        			props.history.push("/app/networks");
        		}
        	}
        })]
    }
})(withRouter(SmartContractsManagement))
