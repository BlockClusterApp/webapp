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
                                                                                <th style={{width: "25%"}}>Issuer</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {Object.keys(this.props.network[0].assetsTypes || {}).reverse().map((key, index) => {
                                                                                return (
                                                                                    <tr key={this.props.network[0].assetsTypes[key].uniqueIdentifier}>
                                                                                        <td className="v-align-middle ">
                                                                                            {this.props.network[0].assetsTypes[key].assetName}
                                                                                        </td>
                                                                                        <td className="v-align-middle">
                                                                                            {this.props.network[0].assetsTypes[key].type}
                                                                                        </td>
                                                                                        <td className="v-align-middle">
                                                                                            {this.props.network[0].assetsTypes[key].units}
                                                                                        </td>
                                                                                        <td className="v-align-middle">
                                                                                            {this.props.network[0].assetsTypes[key].authorizedIssuer}
                                                                                        </td>
                                                                                    </tr>
                                                                                )
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
        network: Networks.find({_id: props.match.params.id}).fetch(),
        subscriptions: [Meteor.subscribe("networks", {
        	onReady: function (){
        		if(Networks.find({_id: props.match.params.id}).fetch().length !== 1) {
        			props.history.push("/app/networks");
        		}
        	}
        })]
    }
})(withRouter(AssetsStats))
