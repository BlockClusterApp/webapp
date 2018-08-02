import React, {Component} from "react";
import {withTracker} from "meteor/react-meteor-data";
import {Networks} from "../../../collections/networks/networks.js"
import helpers from "../../../modules/helpers"
import {withRouter} from 'react-router-dom'
import LaddaButton, { S, SLIDE_UP } from "react-ladda";
import notifications from "../../../modules/notifications"
import {Link} from "react-router-dom"

import "./Peers.scss"

class Peers extends Component {

    constructor() {
        super()
        this.state = {
            defaultJSONQuery: JSON.stringify(JSON.parse('{"assetName":"license","uniqueIdentifier":"1234","company":"blockcluster"}'), undefined, 4)
        }
    }

    componentWillUnmount() {
        this.props.subscriptions.forEach((s) =>{
            s.stop();
        });
    }

    addPeer(e, instanceId) {
        e.preventDefault();

        this.setState({
            [instanceId + "_enodeURL_formSubmitError"]: '',
            [instanceId + "_enodeURL_formloading"]: true,
            [instanceId + "_enodeURL_formSubmitSuccess"]: ''
        });

        Meteor.call(
            "addPeer",
            instanceId,
            this[instanceId + "_enodeURL"].value,
            (error) => {
                if(error) {
                    this.setState({
                        [instanceId + "_enodeURL_formSubmitError"]: error.reason,
                        [instanceId + "_enodeURL_formSubmitSuccess"]: "",
                        [instanceId + "_enodeURL_formloading"]: false
                    });
                } else {
                    this.setState({
                        [instanceId + "_enodeURL_formSubmitError"]: '',
                        [instanceId + "_enodeURL_formSubmitSuccess"]: "Successfully added ENode URL to static peers list",
                        [instanceId + "_enodeURL_formloading"]: false
                    });
                }
            }
        )
    }

	render(){
		return (
            <div className="peers content">
                <div className="m-t-20 container-fluid container-fixed-lg bg-white">
                    <div className="row dashboard">
                        <div className="col-lg-12">
                            <div className="card card-transparent">
                                <div className="card-header ">
                                    <div className="card-title">
                                        <Link to={"/app/networks/" + this.props.match.params.id}> Control Panel <i className="fa fa-angle-right"></i></Link> Peers Management
                                    </div>
                                </div>
                                <div className="card-block">
                                    {this.props.network.length === 1 &&
                                        <div>
                                            <div className="row column-seperation">
                                                <div className="col-lg-12">
                                                    <div className="card card-transparent">
                                                        <div className="row column-seperation">
                                                            <div className="col-lg-12">
                                                                <h4>Add Static Peer</h4>
                                                                <form role="form" onSubmit={(e) => {
                                                                        this.addPeer(e, this.props.network[0].instanceId);
                                                                    }}>
                                                                    <div className="form-group">
                                                                        <label>ENode URL</label>
                                                                        <input type="text" className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_enodeURL"] = input}} required />
                                                                    </div>
                                                                    {this.state[this.props.network[0].instanceId + "_enodeURL_formSubmitError"] &&
                                                                        <div className="row m-t-15">
                                                                            <div className="col-md-12">
                                                                                <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                                                    <button className="close" data-dismiss="alert"></button>
                                                                                    {this.state[this.props.network[0].instanceId + "_enodeURL_formSubmitError"]}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    }
                                                                    {this.state[this.props.network[0].instanceId + "_enodeURL_formSubmitSuccess"] &&
                                                                        <div className="row m-t-15">
                                                                            <div className="col-md-12">
                                                                                <div className="m-b-20 alert alert-success m-b-0" role="alert">
                                                                                    <button className="close" data-dismiss="alert"></button>
                                                                                    {this.state[this.props.network[0].instanceId + "_enodeURL_formSubmitSuccess"]}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    }
                                                                    <p className="pull-left">
                                                                        <LaddaButton
                                                                            loading={this.state[this.props.network[0].instanceId + "_enodeURL_formloading"]}
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

                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    }
                                </div>
                                <hr style={{margin: '0px'}} />
                                <div className="card-block" style={{marginTop: '10px'}}>
                                {this.props.network.length === 1 &&<div className="col-lg-12">
                                        <h4>Connected Peers</h4>
                                        <div className="table-responsive">
                                            <table className="table table-hover" id="basicTable">
                                                <thead>
                                                    <tr>
                                                        <th style={{width: "25%"}}></th>
                                                        <th style={{width: "25%"}}>IP and Port</th>
                                                        <th style={{width: "25%"}}>ENode ID</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {
                                                        (() => {
                                                            if (this.props.network[0].connectedPeers) {
                                                                return (
                                                                    this.props.network[0].connectedPeers.map((item, index) => {
                                                                        return (
                                                                            <tr key={item.id}>
                                                                                <td className="v-align-middle">
                                                                                    <i className="fa fa-circle text-success fs-11"></i>
                                                                                </td>
                                                                                <td className="v-align-middle">
                                                                                    {item.network.remoteAddress}
                                                                                </td>
                                                                                <td className="v-align-middle ">
                                                                                    {item.id}
                                                                                </td>
                                                                            </tr>
                                                                        )
                                                                    })
                                                                )
                                                            }
                                                        })()
                                                    }
                                                </tbody>
                                            </table>
                                        </div>
                                    </div> }
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
        subscriptions: [Meteor.subscribe("networks", {
        	onReady: function (){
        		if(Networks.find({instanceId: props.match.params.id, active: true}).fetch().length !== 1) {
        			props.history.push("/app/networks");
        		}
        	}
        }), Meteor.subscribe("utilities")]
    }
})(withRouter(Peers))
