import React, {Component} from "react";
import {withTracker} from "meteor/react-meteor-data";
import {Networks} from "../../../collections/networks/networks.js"
import helpers from "../../../modules/helpers"
import ReactHtmlParser, { processNodes, convertNodeToElement, htmlparser2 } from "react-html-parser";
import {withRouter} from 'react-router-dom'
import LaddaButton, { S, SLIDE_UP } from "react-ladda";
import notifications from "../../../modules/notifications"

import "./PublishStream.scss"

class PublishStream extends Component {

    constructor() {
        super()
        this.state = {}
    }

    publishStream = (e, instanceId) => {
        e.preventDefault();

        this.setState({
            publishStream_formSubmitError: '',
            publishStream_formloading: true
        });

        Meteor.call("publishStream", instanceId, this[instanceId + "_publishStream_name"].value, this[instanceId + "_publishStream_issuer"].value, this[instanceId + "_publishStream_key"].value, this[instanceId + "_publishStream_data"].value, (error) => {
            if(!error) {
                this.setState({
                    [instanceId + "_publishStream_formloading"]: false,
                    [instanceId + "_publishStream_formSubmitError"]: ''
                });

                notifications.success("Transaction sent")
            } else {
                this.setState({
                    [instanceId + "_publishStream_formloading"]: false,
                    [instanceId + "_publishStream_formSubmitError"]: error.reason
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
            <div className="publishStream content">
                <div className="m-t-20 container-fluid container-fixed-lg bg-white">
                    <div className="row dashboard">
                        <div className="col-lg-12">
                            <div className="card card-transparent">
                                <div className="card-header ">
                                    <div className="card-title">Publish Stream
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
                                                                                    <div className="card-block" onSubmit={(e) => {
                                                                                            this.publishStream(e, item.instanceId);
                                                                                        }}>
                                                                                        <form role="form">
                                                                                            <div className="form-group">
                                                                                                <label>Stream Name</label>
                                                                                                <span className="help"> e.g. "Renew"</span>
                                                                                                <select className="form-control" ref={(input) => {this[item.instanceId + "_publishStream_name"] = input}} required>
                                                                                                    {this.props.networks[index].streams.map((streamName) => {
                                                                                                        return <option key={streamName} value={streamName}>{streamName}</option>
                                                                                                    })}
                                                                                                </select>
                                                                                            </div>
                                                                                            <div className="form-group">
                                                                                                <label>Key</label>
                                                                                                <span className="help"> e.g. "Renew"</span>
                                                                                                <input type="text" className="form-control" required ref={(input) => {this[item.instanceId + "_publishStream_key"] = input}} />
                                                                                            </div>
                                                                                            <div className="form-group">
                                                                                                <label>Data</label>
                                                                                                <span className="help"> e.g. {"{'licenseNumber': '121'}"}</span>
                                                                                                <textarea className="form-control" required ref={(input) => {this[item.instanceId + "_publishStream_data"] = input}}></textarea>
                                                                                            </div>
                                                                                            <div className="form-group">
                                                                                                <label>From Account</label>
                                                                                                <span className="help"> e.g. "0x84eddb1..."</span>
                                                                                                <select className="form-control" required ref={(input) => {this[item.instanceId + "_publishStream_issuer"] = input}}>
                                                                                                    {item.accounts.map((address, addressIndex) => {
                                                                                                        return (
                                                                                                            <option key={addressIndex}>{address}</option>
                                                                                                        )
                                                                                                    })}
                                                                                                </select>
                                                                                            </div>

                                                                                            {this.state[item.instanceId + "_publishStream_formSubmitError"] &&
                                                                                                <div className="row m-t-30">
                                                                                                    <div className="col-md-12">
                                                                                                        <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                                                                            <button className="close" data-dismiss="alert"></button>
                                                                                                            {this.state[item.instanceId + "_publishStream_formSubmitError"]}
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>
                                                                                            }
                                                                                            <LaddaButton
                                                                                                loading={this.state[item.instanceId + "_publishStream_formloading"]}
                                                                                                data-size={S}
                                                                                                data-style={SLIDE_UP}
                                                                                                data-spinner-size={30}
                                                                                                data-spinner-lines={12}
                                                                                                className="btn btn-success m-t-10"
                                                                                                type="submit"
                                                                                            >
                                                                                                <i className="fa fa-upload" aria-hidden="true"></i>&nbsp;&nbsp;Publish
                                                                                            </LaddaButton>
                                                                                        </form>
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
})(withRouter(PublishStream))