import React, {Component} from "react";
import {withTracker} from "meteor/react-meteor-data";
import {Networks} from "../../../collections/networks/networks.js"
import helpers from "../../../modules/helpers"
import ReactHtmlParser, { processNodes, convertNodeToElement, htmlparser2 } from "react-html-parser";
import {withRouter} from 'react-router-dom'
import LaddaButton, { S, SLIDE_UP } from "react-ladda";
import notifications from "../../../modules/notifications"

import "./SubscribeStream.scss"

class SubscribeStream extends Component {

    constructor() {
        super()
        this.state = {}
    }

    subscribeStream = (e, instanceId) => {
        e.preventDefault();

        this.setState({
            subscribeStream_formSubmitError: '',
            subscribeStream_formloading: true
        });

        Meteor.call("subscribeStream", instanceId, this[instanceId + "_subscribeStream_name"].value, (error) => {
            if(!error) {
                this.setState({
                    [instanceId + "_subscribeStream_formloading"]: false,
                    [instanceId + "_subscribeStream_formSubmitError"]: ''
                });

                notifications.success("Subscribed")
            } else {
                this.setState({
                    [instanceId + "_subscribeStream_formloading"]: false,
                    [instanceId + "_subscribeStream_formSubmitError"]: error.reason
                })
            }
        });
    }

    unsubscribeStream = (e, instanceId) => {
        e.preventDefault();

        this.setState({
            subscribeStream_formSubmitError: '',
            subscribeStream_formloading: true
        });

        Meteor.call("unsubscribeStream", instanceId, this[instanceId + "_subscribeStream_name"].value, (error) => {
            if(!error) {
                this.setState({
                    [instanceId + "_subscribeStream_formloading"]: false,
                    [instanceId + "_subscribeStream_formSubmitError"]: ''
                });

                notifications.success("Unsubscribed")
            } else {
                this.setState({
                    [instanceId + "_subscribeStream_formloading"]: false,
                    [instanceId + "_subscribeStream_formSubmitError"]: error.reason
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
            <div className="subscribeStream content">
                <div className="m-t-20 container-fluid container-fixed-lg bg-white">
                    <div className="row dashboard">
                        <div className="col-lg-12">
                            <div className="card card-transparent">
                                <div className="card-header ">
                                    <div className="card-title">Subscribe and Unsubscribe Stream
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
                                                                {item.streamsContractAddress === '' &&
                                                                    <div>
                                                                        Please deploy smart contract
                                                                    </div>
                                                                }
                                                                {(item.streamsContractAddress !== undefined && item.streamsContractAddress !== '') &&
                                                                    <div>
                                                                        <div className="container">
                                                                            <div className="row column-seperation">
                                                                                <div className="col-lg-12">
                                                                                    <div className="card-block">
                                                                                        <div className="row column-seperation">
                                                                                            <div className="col-lg-6">
                                                                                                <div className="table-responsive">
                                                                                                    <table className="table table-hover" id="basicTable">
                                                                                                        <thead>
                                                                                                            <tr>
                                                                                                                <th>Subscribed Streams</th>
                                                                                                            </tr>
                                                                                                        </thead>
                                                                                                        <tbody>
                                                                                                            {this.props.networks[index].subscribedStreams.map((streamName) => {
                                                                                                                return (
                                                                                                                    <tr key={streamName}>
                                                                                                                        <td className="v-align-middle ">
                                                                                                                            {streamName}
                                                                                                                        </td>
                                                                                                                    </tr>
                                                                                                                )
                                                                                                            })}
                                                                                                        </tbody>
                                                                                                    </table>
                                                                                                </div>
                                                                                            </div>
                                                                                            <div className="col-lg-6">
                                                                                                <form role="form">
                                                                                                    <div className="form-group">
                                                                                                        <label>Stream Name</label>
                                                                                                        <span className="help"> e.g. "Renew"</span>
                                                                                                        <select className="form-control" ref={(input) => {this[item.instanceId + "_subscribeStream_name"] = input}} required>
                                                                                                            {this.props.networks[index].streams.map((streamName) => {
                                                                                                                return <option key={streamName} value={streamName}>{streamName}</option>
                                                                                                            })}
                                                                                                        </select>
                                                                                                    </div>

                                                                                                    {this.state[item.instanceId + "_subscribeStream_formSubmitError"] &&
                                                                                                        <div className="row m-t-30">
                                                                                                            <div className="col-md-12">
                                                                                                                <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                                                                                    <button className="close" data-dismiss="alert"></button>
                                                                                                                    {this.state[item.instanceId + "_subscribeStream_formSubmitError"]}
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    }
                                                                                                    <LaddaButton
                                                                                                        loading={this.state[item.instanceId + "_subscribeStream_formloading"]}
                                                                                                        data-size={S}
                                                                                                        data-style={SLIDE_UP}
                                                                                                        data-spinner-size={30}
                                                                                                        data-spinner-lines={12}
                                                                                                        className="btn btn-success m-t-10"
                                                                                                        type="button"
                                                                                                        onClick={(e) => {
                                                                                                            this.subscribeStream(e, item.instanceId);
                                                                                                        }}
                                                                                                    >
                                                                                                        <i className="fa fa-download" aria-hidden="true"></i>&nbsp;&nbsp;Subscribe
                                                                                                    </LaddaButton>
                                                                                                    &nbsp;&nbsp;
                                                                                                    <LaddaButton
                                                                                                        loading={this.state[item.instanceId + "_unsubscribeStream_formloading"]}
                                                                                                        data-size={S}
                                                                                                        data-style={SLIDE_UP}
                                                                                                        data-spinner-size={30}
                                                                                                        data-spinner-lines={12}
                                                                                                        className="btn btn-success m-t-10"
                                                                                                        type="button"
                                                                                                        onClick={(e) => {
                                                                                                            this.unsubscribeStream(e, item.instanceId);
                                                                                                        }}
                                                                                                    >
                                                                                                        <i className="fa fa-ban" aria-hidden="true"></i>&nbsp;&nbsp;Unsubscribe
                                                                                                    </LaddaButton>
                                                                                                </form>
                                                                                            </div>
                                                                                        </div>

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
})(withRouter(SubscribeStream))
