import React, {Component} from "react";
import {withTracker} from "meteor/react-meteor-data";
import {Networks} from "../../../collections/networks/networks.js"
import helpers from "../../../modules/helpers"
import ReactHtmlParser, { processNodes, convertNodeToElement, htmlparser2 } from "react-html-parser";
import {withRouter} from 'react-router-dom'

import "./Dashboard.scss"

class Dashboard extends Component {
    componentWillUnmount() {
        this.props.subscriptions.forEach((s) =>{
            s.stop();
        });
    }

    openNetwork = (networkId) => {
        this.props.history.push("/app/network/" + networkId);
    }

	render(){
		return (
            <div className="row dashboard">
                <div className="col-lg-12">
                    <div className="card card-transparent">
                        <div className="card-header ">
                            <div className="card-title">List of Networks
                            </div>
                        </div>
                        <div className="card-block">
                            <div className="table-responsive">
                                <table className="table table-hover" id="basicTable">
                                <thead>
                                    <tr>
                                        <th style={{width: "20%"}}>Name</th>
                                        <th style={{width: "20%"}}>Instance ID</th>
                                        <th style={{width: "20%"}}>Member Type</th>
                                        <th style={{width: "20%"}}>Status</th>
                                        <th style={{width: "20%"}}>Created on</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {this.props.networks.map((item, index) => {
                                        return (
                                            <tr key={item._id} onClick={() => this.openNetwork(item._id)}>
                                                <td className="v-align-middle ">
                                                    {item.name}
                                                </td>
                                                <td className="v-align-middle">
                                                    {item._id.toLowerCase()}
                                                </td>
                                                <td className="v-align-middle">
                                                    {helpers.firstLetterCapital(item.peerType)}
                                                </td>
                                                <td className="v-align-middle">
                                                    {ReactHtmlParser(helpers.convertStatusToTag(item.status, helpers.firstLetterCapital(item.status)))}
                                                </td>
                                                <td className="v-align-middle">
                                                    {helpers.timeConverter(item.createdOn / 1000)}
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
		)
	}
}

export default withTracker(() => {
    return {
        networks: Networks.find({}).fetch(),
        subscriptions: [Meteor.subscribe("networks")]
    }
})(withRouter(Dashboard))
