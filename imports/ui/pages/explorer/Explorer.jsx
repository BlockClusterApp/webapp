import React, {Component} from "react";
import {withTracker} from "meteor/react-meteor-data";
import {Networks} from "../../../collections/networks/networks.js"
import helpers from "../../../modules/helpers"
import ReactHtmlParser, { processNodes, convertNodeToElement, htmlparser2 } from "react-html-parser";
import {withRouter} from 'react-router-dom'

import "./Explorer.scss"

class Explorer extends Component {
    componentWillUnmount() {
        this.props.subscriptions.forEach((s) =>{
            s.stop();
        });
    }

	render(){
		return (
            <div className="content sm-gutter">
                <div className="container-fluid m-t-20 p-l-25 p-r-25 p-t-0 p-b-25 sm-padding-10">
                    <div className="row">
                        <div className="col-lg-3 col-sm-6  d-flex flex-column">
                            <div className="card social-card share  full-width m-b-10 no-border" data-social="item">
                                <div className="card-header ">
                                    <h5 className="text-primary pull-left fs-12">Select Network </h5>
                                    <div className="pull-right small hint-text">
                                        <i className="fa fa-circle text-success fs-11"></i>
                                    </div>
                                    <div className="clearfix"></div>
                                </div>
                                <div className="card-description m-b-0 p-b-0">
                                    <div className="radio radio-success">
                                        {this.props.networks.map((item, index) => {
                                            return (
                                                <span key={index}>
                                                    <input type="radio" value={item.instanceId} name="networkId" id={item.instanceId} />
                                                    <label htmlFor={item.instanceId}>{item.name}</label>
                                                </span>
                                            )
                                        })}
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
})(withRouter(Explorer))
