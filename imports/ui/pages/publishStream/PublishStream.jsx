import React, {Component} from "react";
import {withTracker} from "meteor/react-meteor-data";
import {Networks} from "../../../collections/networks/networks.js"
import helpers from "../../../modules/helpers"
import ReactHtmlParser, { processNodes, convertNodeToElement, htmlparser2 } from "react-html-parser";
import {withRouter} from 'react-router-dom'
import LaddaButton, { S, SLIDE_UP } from "react-ladda";
import notifications from "../../../modules/notifications"
import {Link} from "react-router-dom"
import Config from '../../../modules/config/client'

import "./PublishStream.scss"

class PublishStream extends Component {

    constructor() {
        super()

        this.state = {
            accounts: [],
            streams: []
        }

        this.getAccounts = this.getAccounts.bind(this)
        this.getStreams = this.getStreams.bind(this)
    }

    componentDidMount() {
        this.setState({
            refreshAccountsTimer: setInterval(this.getAccounts, 500),
            refreshStreamsTimer: setInterval(this.getStreams, 500)
        })
    }

    getAccounts() {
        if(this.props.network[0]) {
            let url = `https://${Config.workerNodeDomainName(this.props.network[0].locationCode)}/api/node/${this.props.network[0].instanceId}/utility/accounts`;
            HTTP.get(url, {
                headers: {
                    'Authorization': "Basic " + (new Buffer(`${this.props.network[0].instanceId}:${this.props.network[0]["api-password"]}`).toString("base64"))
                }
            }, (err, res) => {
                if(!err) {
                    this.setState({
                        accounts: res.data
                    });
                }
            })
        }
    }

    getStreams() {
        if(this.props.network[0]) {
            let url = `https://${Config.workerNodeDomainName(this.props.network[0].locationCode)}/api/node/${this.props.network[0].instanceId}/streams/streamTypes`;
            HTTP.get(url, {
                headers: {
                    'Authorization': "Basic " + (new Buffer(`${this.props.network[0].instanceId}:${this.props.network[0]["api-password"]}`).toString("base64"))
                }
            }, (err, res) => {
                if(!err) {
                    this.setState({
                        streams: res.data
                    });
                }
            })
        }
    }

    publishStream = (e, instanceId) => {
        e.preventDefault();

        this.setState({
            publishStream_formSubmitError: '',
            publishStream_formloading: true
        });

        let publicKeys = "";

        if(this[instanceId + "_publishStream_visibility"].value === "private") {
            publicKeys = this[instanceId + "_publicKeys"].value
        }

        Meteor.call("publishStream", instanceId, this[instanceId + "_publishStream_name"].value, this[instanceId + "_publishStream_issuer"].value, this[instanceId + "_publishStream_key"].value, this[instanceId + "_publishStream_data"].value, this[instanceId + "_publishStream_visibility"].value, publicKeys, (error) => {
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

        clearInterval(this.state.refreshAccountsTimer);
        clearInterval(this.state.refreshStreamsTimer);
    }

    visibilityChanged = (instanceId, e) => {
        let obj = {}
        if(e.target.value === "private") {
            obj[instanceId + "_showPublicKeys"] = true;
        } else {
            obj[instanceId + "_showPublicKeys"] = false;
        }

        this.setState(obj)
    }

	render(){
		return (
            <div className="publishStream content">
                <div className="m-t-20 container-fluid container-fixed-lg bg-white">
                    <div className="row dashboard">
                        <div className="col-lg-12">
                            <div className="card card-transparent">
                                <div className="card-header ">
                                    <div className="card-title">
                                        <Link to={"/app/networks/" + this.props.match.params.id}> Control Panel <i className="fa fa-angle-right"></i></Link> Publish Stream
                                    </div>
                                </div>
                                <div className="card-block">
                                    <div className="card card-transparent">
                                        {this.props.network.length === 1 &&
                                            <div>
                                                {this.props.network[0].streamsContractAddress === '' &&
                                                    <div>
                                                        Please deploy smart contract
                                                    </div>
                                                }
                                                {(this.props.network[0].streamsContractAddress !== undefined && this.props.network[0].streamsContractAddress !== '') &&
                                                    <div>
                                                        <div onSubmit={(e) => {
                                                                this.publishStream(e, this.props.network[0].instanceId);
                                                            }}>
                                                            <form role="form">
                                                                <div className="form-group">
                                                                    <label>Stream Name</label>
                                                                    <span className="help"> e.g. "Renew"</span>
                                                                    <select className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_publishStream_name"] = input}} required>
                                                                        {this.state.streams.map((item) => {
                                                                            return <option key={item.streamName} value={item.streamName}>{item.streamName}</option>
                                                                        })}
                                                                    </select>
                                                                </div>
                                                                <div className="form-group">
                                                                    <label>Key</label>
                                                                    <span className="help"> e.g. "Renew"</span>
                                                                    <input type="text" className="form-control" required ref={(input) => {this[this.props.network[0].instanceId + "_publishStream_key"] = input}} />
                                                                </div>
                                                                <div className="form-group">
                                                                    <label>Data</label>
                                                                    <span className="help"> e.g. {"{'licenseNumber': '121'}"}</span>
                                                                    <textarea className="form-control" required ref={(input) => {this[this.props.network[0].instanceId + "_publishStream_data"] = input}}></textarea>
                                                                </div>

                                                                <div className="form-group">
                                                                    <label>Visibility</label>
                                                                    <span className="help"> e.g. Plain or Encrypted</span>
                                                                    <select className="form-control" required onChange={(e) => {this.visibilityChanged(this.props.network[0].instanceId, e)}} ref={(input) => {this[this.props.network[0].instanceId + "_publishStream_visibility"] = input}}>
                                                                        <option key="public" value="public">Public</option>
                                                                        <option key="private" value="private">Private</option>
                                                                    </select>
                                                                </div>
                                                                {this.state[this.props.network[0].instanceId + "_showPublicKeys"] &&
                                                                    <div className="form-group">
                                                                        <label>Public Keys</label>
                                                                        <span className="help"> e.g. "jx89u2mxjdsklfjsd..., djkaskldjlkasjdkl..."</span>
                                                                        <input type="text" className="form-control" required ref={(input) => {this[this.props.network[0].instanceId + "_publicKeys"] = input}} />
                                                                    </div>
                                                                }
                                                                <div className="form-group">
                                                                    <label>From Account</label>
                                                                    <span className="help"> e.g. "0x84eddb1..."</span>
                                                                    <select className="form-control" required ref={(input) => {this[this.props.network[0].instanceId + "_publishStream_issuer"] = input}}>
                                                                        {this.state.accounts.map((item) => {
                                                                            return <option key={item.address} value={item.address}>{item.name} ({item.address})</option>
                                                                        })}
                                                                    </select>
                                                                </div>

                                                                {this.state[this.props.network[0].instanceId + "_publishStream_formSubmitError"] &&
                                                                    <div className="row m-t-30">
                                                                        <div className="col-md-12">
                                                                            <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                                                <button className="close" data-dismiss="alert"></button>
                                                                                {this.state[this.props.network[0].instanceId + "_publishStream_formSubmitError"]}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                }
                                                                <LaddaButton
                                                                    loading={this.state[this.props.network[0].instanceId + "_publishStream_formloading"]}
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
		)
	}
}

export default withTracker((props) => {
    return {
        network: Networks.find({instanceId: props.match.params.id, active: true}).fetch(),
        subscriptions: [Meteor.subscribe("networks", {
        	onReady: function (){
        		if(Networks.find({instanceId: props.match.params.id, active: true}).fetch().length !== 1) {
        			props.history.push("/app/networks");
        		}
        	}
        })]
    }
})(withRouter(PublishStream))
