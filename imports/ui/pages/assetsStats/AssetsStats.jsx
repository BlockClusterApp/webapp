import React, {Component} from "react";
import {withTracker} from "meteor/react-meteor-data";
import {Networks} from "../../../collections/networks/networks.js"
import helpers from "../../../modules/helpers"
import ReactHtmlParser, { processNodes, convertNodeToElement, htmlparser2 } from "react-html-parser";
import {withRouter} from 'react-router-dom'
import LaddaButton, { S, SLIDE_UP } from "react-ladda";
import notifications from "../../../modules/notifications"

import "./AssetsStats.scss"

class AssetsStats extends Component {

    constructor() {
        super()
        this.state = {}
    }

    componentWillUnmount() {
        this.props.subscriptions.forEach((s) =>{
            s.stop();
        });
    }

	render(){
		return (
            <div className="assetsStats content">
                <div className="m-t-20 container-fluid container-fixed-lg bg-white">
                    <div className="row dashboard">
                        <div className="col-lg-12">
                            <div className="card card-transparent">
                                <div className="card-header ">
                                    <div className="card-title">Assets Stats
                                    </div>
                                </div>
                                <div className="card-block no-padding">
                                    <div className="row">
                                        <div className="col-xl-12">
                                            <div className="card card-transparent flex-row">
                                                <ul className="nav nav-tabs nav-tabs-simple nav-tabs-left bg-white" id="tab-3">
                                                    {this.props.networks.map((item, index) => {
                                                        return (
                                                            <li key={item.instanceId} className="nav-item">
                                                                <a href="#" className={index === 0 ? "active" : ""} data-toggle="tab" data-target={"#" + item.instanceId}>{item.name}</a>
                                                            </li>
                                                        )
                                                    })}
                                                </ul>
                                                <div className="tab-content bg-white">
                                                    {this.props.networks.map((item, index) => {
                                                        return (
                                                            <div key={index} className={index === 0 ? "tab-pane active" : "tab-pane "} id={item.instanceId}>
                                                                {item.assetsContractAddress === '' &&
                                                                    <div>
                                                                        Please deploy smart contract
                                                                    </div>
                                                                }
                                                                {(item.assetsContractAddress !== undefined && item.assetsContractAddress !== '') &&
                                                                    <div>
                                                                        <div className="container">
                                                                            <div className="row column-seperation">
                                                                                <div className="col-lg-12">
                                                                                    <div className="table-responsive">
                                                                                        <table className="table table-hover" id="basicTable">
                                                                                            <thead>
                                                                                                <tr>
                                                                                                    <th style={{width: "25%"}}>Asset Name</th>
                                                                                                    <th style={{width: "25%"}}>Asset Type</th>
                                                                                                    <th style={{width: "25%"}}>Total Units</th>
                                                                                                    <th style={{width: "25%"}}>Issuer</th>
                                                                                                </tr>
                                                                                            </thead>
                                                                                            <tbody>
                                                                                                {item.assetsTypes.reverse().map((item, index) => {
                                                                                                    return (
                                                                                                        <tr key={item.uniqueIdentifier}>
                                                                                                            <td className="v-align-middle ">
                                                                                                                {item.assetName}
                                                                                                            </td>
                                                                                                            <td className="v-align-middle">
                                                                                                                {item.type}
                                                                                                            </td>
                                                                                                            <td className="v-align-middle">
                                                                                                                {item.units}
                                                                                                            </td>
                                                                                                            <td className="v-align-middle">
                                                                                                                {item.authorizedIssuer}
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
                                                                }
                                                            </div>
                                                        )
                                                    })}
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

export default withTracker(() => {
    return {
        networks: Networks.find({}).fetch(),
        subscriptions: [Meteor.subscribe("networks")]
    }
})(withRouter(AssetsStats))
