import React, {Component} from "react";
import {withTracker} from "meteor/react-meteor-data";
import {Networks} from "../../../collections/networks/networks.js"
import helpers from "../../../modules/helpers"
import ReactHtmlParser, { processNodes, convertNodeToElement, htmlparser2 } from "react-html-parser";
import {withRouter} from 'react-router-dom'
import LaddaButton, { S, SLIDE_UP } from "react-ladda";
import notifications from "../../../modules/notifications"
import {Streams} from "../../../collections/streams/streams.js"
import {Link} from "react-router-dom"
import {BCAccounts} from "../../../collections/bcAccounts/bcAccounts.js"

import "./NodeEvents.scss"

class NodeEvents extends Component {

    constructor() {
        super()
        this.state = {}
    }

    updateURL = (e, instanceId) => {
        e.preventDefault();

        this.setState({
            [instanceId + "_nodeEvents_formloading"]: true,
            [instanceId + "_nodeEvents_formSubmitError"]: ''
        });

        Meteor.call("updateNodeCallbackURL", instanceId, this[instanceId + "_nodeEvents_url"].value, (error) => {
            if(!error) {
                this.setState({
                    [instanceId + "_nodeEvents_formloading"]: false,
                    [instanceId + "_nodeEvents_formSubmitError"]: ''
                });

                notifications.success("URL Updated")
            } else {
                this.setState({
                    [instanceId + "_nodeEvents_formloading"]: false,
                    [instanceId + "_nodeEvents_formSubmitError"]: error.reason
                })
            }
        });
    }

    componentWillUnmount() {
        this.props.subscriptions.forEach((s) =>{
            s.stop();
        });
    }

	render(){
		return (
            <div className="nodeEvents content">
                <div className="m-t-20 container-fluid container-fixed-lg bg-white">
                    <div className="row dashboard">
                        <div className="col-lg-12">
                            <div className="card card-transparent">
                                <div className="card-header ">
                                    <div className="card-title">
                                        <Link to={"/app/networks/" + this.props.match.params.id}> Control Panel <i className="fa fa-angle-right"></i></Link> Event Callback URL
                                    </div>
                                </div>
                                <div className="card-block">
                                    <div className="card card-transparent">
                                        {this.props.network.length === 1 &&
                                            <div>
                                                <div onSubmit={(e) => {
                                                        this.updateURL(e, this.props.network[0].instanceId);
                                                    }}>
                                                    <form role="form">

                                                        <div className="form-group">
                                                            <label>URL</label>
                                                            <span className="help"> e.g. "http://callback.blockcluster.io/eventHandler"</span>
                                                            <input type="text" className="form-control" required value={this.props.network[0] ? this.props.network[0].callbackURL : ""} ref={(input) => {this[this.props.network[0].instanceId + "_nodeEvents_url"] = input}} />
                                                        </div>

                                                        {this.state[this.props.network[0].instanceId + "_nodeEvents_formSubmitError"] &&
                                                            <div className="row m-t-30">
                                                                <div className="col-md-12">
                                                                    <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                                        <button className="close" data-dismiss="alert"></button>
                                                                        {this.state[this.props.network[0].instanceId + "_nodeEvents_formSubmitError"]}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        }
                                                        <LaddaButton
                                                            loading={this.state[this.props.network[0].instanceId + "_nodeEvents_formloading"]}
                                                            data-size={S}
                                                            data-style={SLIDE_UP}
                                                            data-spinner-size={30}
                                                            data-spinner-lines={12}
                                                            className="btn btn-success m-t-10"
                                                            type="submit"
                                                        >
                                                            <i className="fa fa-upload" aria-hidden="true"></i>&nbsp;&nbsp;Update
                                                        </LaddaButton>
                                                    </form>
                                                </div>
                                            </div>
                                        }
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
        subscriptions: [Meteor.subscribe("networks", {
        	onReady: function (){
        		if(Networks.find({instanceId: props.match.params.id}).fetch().length !== 1) {
        			props.history.push("/app/networks");
        		}
        	}
        })]
    }
})(withRouter(NodeEvents))
