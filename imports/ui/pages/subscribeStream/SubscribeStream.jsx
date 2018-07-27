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
                                    <div className="card-title">
                                        <Link to={"/app/networks/" + this.props.match.params.id}> Control Panel <i className="fa fa-angle-right"></i></Link> Subscribe and Unsubscribe Stream
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
                                                        <div className="container m-l-0 m-r-0 p-l-0 p-r-0">
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
                                                                                {this.props.streams.map((item) => {
                                                                                    if(item.subscribed === true) {
                                                                                        return (
                                                                                            <tr key={item.streamName}>
                                                                                                <td className="v-align-middle ">
                                                                                                    {item.streamName}
                                                                                                </td>
                                                                                            </tr>
                                                                                        )
                                                                                    }
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
                                                                            <select className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_subscribeStream_name"] = input}} required>
                                                                                {this.props.streams.map((item) => {
                                                                                    return <option key={item.streamName} value={item.streamName}>{item.streamName}</option>
                                                                                })}
                                                                            </select>
                                                                        </div>

                                                                        {this.state[this.props.network[0].instanceId + "_subscribeStream_formSubmitError"] &&
                                                                            <div className="row m-t-30">
                                                                                <div className="col-md-12">
                                                                                    <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                                                        <button className="close" data-dismiss="alert"></button>
                                                                                        {this.state[this.props.network[0].instanceId + "_subscribeStream_formSubmitError"]}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        }
                                                                        <LaddaButton
                                                                            loading={this.state[this.props.network[0].instanceId + "_subscribeStream_formloading"]}
                                                                            data-size={S}
                                                                            data-style={SLIDE_UP}
                                                                            data-spinner-size={30}
                                                                            data-spinner-lines={12}
                                                                            className="btn btn-success m-t-10"
                                                                            type="button"
                                                                            onClick={(e) => {
                                                                                this.subscribeStream(e, this.props.network[0].instanceId);
                                                                            }}
                                                                        >
                                                                            <i className="fa fa-download" aria-hidden="true"></i>&nbsp;&nbsp;Subscribe
                                                                        </LaddaButton>
                                                                        &nbsp;&nbsp;
                                                                        <LaddaButton
                                                                            loading={this.state[this.props.network[0].instanceId + "_unsubscribeStream_formloading"]}
                                                                            data-size={S}
                                                                            data-style={SLIDE_UP}
                                                                            data-spinner-size={30}
                                                                            data-spinner-lines={12}
                                                                            className="btn btn-success m-t-10"
                                                                            type="button"
                                                                            onClick={(e) => {
                                                                                this.unsubscribeStream(e, this.props.network[0].instanceId);
                                                                            }}
                                                                        >
                                                                            <i className="fa fa-ban" aria-hidden="true"></i>&nbsp;&nbsp;Unsubscribe
                                                                        </LaddaButton>
                                                                    </form>
                                                                </div>
                                                            </div>
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
        networks: Networks.find({active: true}).fetch(),
        streams: Streams.find({instanceId: props.match.params.id}).fetch(),
        subscriptions: [Meteor.subscribe("networks", {
        	onReady: function (){
        		if(Networks.find({instanceId: props.match.params.id, active: true}).fetch().length !== 1) {
        			props.history.push("/app/networks");
        		}
        	}
        }), Meteor.subscribe("streams", props.match.params.id)]
    }
})(withRouter(SubscribeStream))
