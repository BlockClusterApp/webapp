import React, {Component} from "react";
import {withTracker} from "meteor/react-meteor-data";
import {Networks} from "../../../collections/networks/networks.js"
import helpers from "../../../modules/helpers"
import ReactHtmlParser, { processNodes, convertNodeToElement, htmlparser2 } from "react-html-parser";
import {withRouter} from 'react-router-dom'
import LaddaButton, { S, SLIDE_UP } from "react-ladda";
import notifications from "../../../modules/notifications"
import {AssetTypes} from "../../../collections/assetTypes/assetTypes.js"
var BigNumber = require('bignumber.js');
import {Link} from "react-router-dom"

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
                                    <div className="card-title">
                                        <Link to={"/app/networks/" + this.props.match.params.id}> Control Panel <i className="fa fa-angle-right"></i></Link> Assets Stats
                                    </div>
                                </div>
                                <div className="card-block">
                                    <div className="row">
                                        <div className="col-xl-12">
                                            <div className="card card-transparent">
                                                {this.props.network.length === 1 &&
                                                    <div>
                                                        {this.props.network[0].assetsContractAddress === '' &&
                                                            <div>
                                                                Please deploy smart contract
                                                            </div>
                                                        }
                                                        {(this.props.network[0].assetsContractAddress !== undefined && this.props.network[0].assetsContractAddress !== '') &&
                                                            <div>
                                                                <div className="table-responsive">
                                                                    <table className="table table-hover" id="basicTable">
                                                                        <thead>
                                                                            <tr>
                                                                                <th style={{width: "25%"}}>Asset Name</th>
                                                                                <th style={{width: "25%"}}>Asset Type</th>
                                                                                <th style={{width: "25%"}}>Total Units</th>
                                                                                <th style={{width: "25%"}}>Administrator</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {this.props.assetTypes.map((item) => {
                                                                                if(item.type === "bulk") {
                                                                                    let units = (new BigNumber(item.units)).dividedBy(helpers.addZeros(1, item.parts)).toFixed(parseInt(item.parts))
                                                                                    return (
                                                                                        <tr key={item.uniqueIdentifier}>
                                                                                            <td className="v-align-middle ">
                                                                                                {item.assetName}
                                                                                            </td>
                                                                                            <td className="v-align-middle">
                                                                                                {item.type}
                                                                                            </td>
                                                                                            <td className="v-align-middle">
                                                                                                {units.toString()}
                                                                                            </td>
                                                                                            <td className="v-align-middle">
                                                                                                {item.admin}
                                                                                            </td>
                                                                                        </tr>
                                                                                    )
                                                                                } else if(item.type === "solo") {
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
                                                                                                {item.admin}
                                                                                            </td>
                                                                                        </tr>
                                                                                    )
                                                                                }
                                                                            })}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        }
                                                    </div>
                                                }
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
        assetTypes: AssetTypes.find({instanceId: props.match.params.id}).fetch(),
        subscriptions: [Meteor.subscribe("networks", {
        	onReady: function (){
        		if(Networks.find({instanceId: props.match.params.id}).fetch().length !== 1) {
        			props.history.push("/app/networks");
        		}
        	}
        }), Meteor.subscribe("assetTypes", props.match.params.id)]
    }
})(withRouter(AssetsStats))
