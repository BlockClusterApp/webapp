import React, {Component} from "react";
import {withTracker} from "meteor/react-meteor-data";
import {Networks} from "../../../collections/networks/networks.js"
import helpers from "../../../modules/helpers"
import ReactHtmlParser, { processNodes, convertNodeToElement, htmlparser2 } from "react-html-parser";
import {withRouter} from 'react-router-dom'

import "./Assets.scss"

class Assets extends Component {
    componentWillUnmount() {
        this.props.subscriptions.forEach((s) =>{
            s.stop();
        });
    }

    openNetwork = (networkId) => {
        this.props.history.push("/app/networks/network/" + networkId);
    }

	render(){
		return (
            <div className="content ">
                <div className="m-t-20 container-fluid container-fixed-lg bg-white">
                    <div className="row dashboard">
                        <div className="col-lg-12">
                            <div className="card card-transparent">
                                <div className="card-header ">
                                    <div className="card-title">Assets
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
                                                            <div className={index === 0 ? "tab-pane active" : "tab-pane "} id={"#" + item.instanceId}>
                                                                <div className="row column-seperation">
                                                                    <div className="col-lg-6">
                                                                        <h3>
                                                                            1
                                                                            <span className="semi-bold">Sometimes </span>Small things in life
                                                                            means the most
                                                                        </h3>
                                                                    </div>
                                                                    <div className="col-lg-6">
                                                                        <h3 className="semi-bold">
                                                                            great tabs
                                                                        </h3>
                                                                        <p>Native boostrap tabs customized to Pages look and feel, simply changing class name you can change color as well as its animations</p>
                                                                    </div>
                                                                </div>
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
})(withRouter(Assets))
