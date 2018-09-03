import React, {Component} from "react";
import {withTracker} from "meteor/react-meteor-data";
import {Networks} from "../../../collections/networks/networks.js"
import helpers from "../../../modules/helpers"
import ReactHtmlParser, { processNodes, convertNodeToElement, htmlparser2 } from "react-html-parser";
import {withRouter} from 'react-router-dom'

import "./NetworksList.scss"

class NetworksList extends Component {

    constructor(props){
        super(props);

        this.state = {
            locations: []
        }
    }

    componentWillUnmount() {
        this.props.subscriptions.forEach((s) =>{
            s.stop();
        });
    }

    openNetwork = (networkId) => {
        this.props.history.push("/app/networks/" + networkId);
    }


	componentDidMount(){
		Meteor.call("getClusterLocations", (err, res) => {
			this.setState({
			  locations: res
			});
    });

    Meteor.call('nodeCount', (err, res) => {
      if(!err){
        if(res.total <= 0){
          this.props.history.push(`/app/createNetwork`);
        }
      }
    });
  }


	getLocationName = (locationCode) => {
		const locationConfig = this.state.locations.find(a => a.locationCode === locationCode);
		if(!locationConfig) {
			return undefined;
		}
		return locationConfig.locationName
	}

	render(){
		return (
            <div className="content networksList">
                <div className="m-t-20 m-l-20 m-r-20  container-fluid container-fixed-lg bg-white">
                    <div className="row">
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
                                                    <th style={{width: "15%"}}>Instance ID</th>
                                                    <th style={{width: "15%"}}>Member Type</th>
                                                    <th style={{width: "18%"}}>Location</th>
                                                    <th style={{width: "17%"}}>Status</th>
                                                    <th style={{width: "15%"}}>Created on</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {this.props.networks.map((item, index) => {
                                                    return (
                                                        <tr key={item._id} onClick={() => this.openNetwork(item.instanceId)}>
                                                            <td className="v-align-middle ">
                                                                {item.name}
                                                            </td>
                                                            <td className="v-align-middle">
                                                                {item.instanceId}
                                                            </td>
                                                            <td className="v-align-middle">
                                                                {helpers.firstLetterCapital(item.peerType)}
                                                            </td>
                                                            <td className="v-align-middle">
                                                                {this.getLocationName(item.locationCode)}
                                                            </td>
                                                            <td className="v-align-middle">
                                                                {ReactHtmlParser(helpers.convertStatusToTag(helpers.calculateNodeStatus(item.status, item.lastPinged), helpers.firstLetterCapital(helpers.calculateNodeStatus(item.status, item.lastPinged))))}
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
                </div>
            </div>
		)
	}
}

export default withTracker(() => {
    return {
        networks: Networks.find({user: Meteor.userId(), active: true}).fetch(),
        subscriptions: [Meteor.subscribe("networks")]
    }
})(withRouter(NetworksList))
