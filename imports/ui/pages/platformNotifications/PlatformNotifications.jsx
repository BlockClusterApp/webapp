import React, {Component} from "react";
import {withTracker} from "meteor/react-meteor-data";
import {Networks} from "../../../collections/networks/networks.js"
import helpers from "../../../modules/helpers"
import ReactHtmlParser, { processNodes, convertNodeToElement, htmlparser2 } from "react-html-parser";
import {withRouter} from 'react-router-dom'
import LaddaButton, { S, SLIDE_UP } from "react-ladda";
import notifications from "../../../modules/notifications"
import {Link} from "react-router-dom"

import "./PlatformNotifications.scss"

class PlatformNotifications extends Component {

    constructor() {
        super()
        this.state = {}
    }

    updateURL = (e) => {
        e.preventDefault();

        this.setState({
            ["_nodeEvents_formloading"]: true,
            ["_nodeEvents_formSubmitError"]: ''
        });

        Meteor.call("updateNetworksCallbackURL", this["_nodeEvents_url"].value, (error) => {
            if(!error) {
                this.setState({
                    ["_nodeEvents_formloading"]: false,
                    ["_nodeEvents_formSubmitError"]: ''
                });

                notifications.success("URL Updated")
            } else {
                this.setState({
                    ["_nodeEvents_formloading"]: false,
                    ["_nodeEvents_formSubmitError"]: error.reason
                })
            }
        });
    }

	render(){
		return (
            <div className="nodeEvents content">
                <div className="m-t-20 m-l-20 m-r-20 container-fluid container-fixed-lg bg-white">
                    <div className="row dashboard">
                        <div className="col-lg-12">
                            <div className="card card-transparent">
                                <div className="card-header ">
                                    <div className="card-title">
                                        Networks Notifications Web Book
                                    </div>
                                </div>
                                <div className="card-block">
                                    <div className="card card-transparent">
                                        <form role="form" onSubmit={(e) => {
                                                this.updateURL(e);
                                            }}>

                                            {this.props.user &&
                                                <div className="form-group">
                                                    <label>URL</label>
                                                    <span className="help"> e.g. "http://callback.blockcluster.io/eventHandler"</span>
                                                    <input type="text" className="form-control" required defaultValue={this.props.user.profile.notifyURL} ref={(input) => {this["_nodeEvents_url"] = input}} />
                                                </div>
                                            }

                                            {this.state["_nodeEvents_formSubmitError"] &&
                                                <div className="row m-t-30">
                                                    <div className="col-md-12">
                                                        <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                            <button className="close" data-dismiss="alert"></button>
                                                            {this.state["_nodeEvents_formSubmitError"]}
                                                        </div>
                                                    </div>
                                                </div>
                                            }
                                            <LaddaButton
                                                loading={this.state["_nodeEvents_formloading"]}
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
        user: Meteor.user()
    }
})(withRouter(PlatformNotifications))
