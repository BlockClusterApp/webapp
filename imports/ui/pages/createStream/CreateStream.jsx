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

import "./CreateStream.scss"

class CreateStream extends Component {

    constructor() {
        super()
        this.state = {
            accounts: []
        }

        this.getAccounts = this.getAccounts.bind(this)
    }

    componentDidMount() {
        this.setState({
            refreshAccountsTimer: setInterval(this.getAccounts, 2000)
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

    createStream = (e, instanceId) => {
        e.preventDefault();

        this.setState({
            createStream_formSubmitError: '',
            createStream_formloading: true
        });

        Meteor.call("createStream", instanceId, this[instanceId + "_createStream_name"].value, this[instanceId + "_createStream_issuer"].value, (error) => {
            if(!error) {
                this.setState({
                    [instanceId + "_createStream_formloading"]: false,
                    [instanceId + "_createStream_formSubmitError"]: ''
                });

                notifications.success("Transaction sent")
            } else {
                this.setState({
                    [instanceId + "_createStream_formloading"]: false,
                    [instanceId + "_createStream_formSubmitError"]: error.reason
                });
            }
        });
    }

    componentWillUnmount() {
        this.props.subscriptions.forEach((s) =>{
            s.stop();
        });
        clearInterval(this.state.refreshAccountsTimer);
    }

	render(){

		return (
            <div className="createStream content">
                <div className="m-t-20 container-fluid container-fixed-lg bg-white">
                    <div className="row dashboard">
                        <div className="col-lg-12">
                            <div className="card card-transparent">
                                <div className="card-header ">
                                    <div className="card-title">
                                        <Link to={"/app/networks/" + this.props.match.params.id}> Control Panel <i className="fa fa-angle-right"></i></Link> Create Stream
                                    </div>
                                </div>
                                <div className="card card-transparent ">
                                    {this.props.network.length === 1 &&
                                        <div>
                                            {this.props.network[0].streamsContractAddress === '' &&
                                                <div>
                                                    Please deploy smart contract
                                                </div>
                                            }
                                            {(this.props.network[0].streamsContractAddress !== undefined && this.props.network[0].streamsContractAddress !== '') &&
                                                <div className="card-block" onSubmit={(e) => {
                                                        this.createStream(e, this.props.network[0].instanceId);
                                                    }}>
                                                    <form role="form">
                                                        <div className="form-group">
                                                            <label>Stream Name</label>
                                                            <span className="help"> e.g. "Renew"</span>
                                                            <input type="text" className="form-control" required ref={(input) => {this[this.props.network[0].instanceId + "_createStream_name"] = input}} />
                                                        </div>
                                                        <div className="form-group">
                                                            <label>Issuing Address</label>
                                                            <span className="help"> e.g. "0x84eddb1..."</span>
                                                            <select className="form-control" required ref={(input) => {this[this.props.network[0].instanceId + "_createStream_issuer"] = input}}>
                                                                {this.state.accounts.map((item) => {
                                                                    return <option key={item.address} value={item.address}>{item.name} ({item.address})</option>
                                                                })}
                                                            </select>
                                                        </div>

                                                        {this.state[this.props.network[0].instanceId + "_createStream_formSubmitError"] &&
                                                            <div className="row m-t-30">
                                                                <div className="col-md-12">
                                                                    <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                                        <button className="close" data-dismiss="alert"></button>
                                                                        {this.state[this.props.network[0].instanceId + "_createStream_formSubmitError"]}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        }
                                                        <LaddaButton
                                                            loading={this.state[this.props.network[0].instanceId + "_createStream_formloading"]}
                                                            data-size={S}
                                                            data-style={SLIDE_UP}
                                                            data-spinner-size={30}
                                                            data-spinner-lines={12}
                                                            className="btn btn-success m-t-10"
                                                            type="submit"
                                                        >
                                                            <i className="fa fa-plus-circle" aria-hidden="true"></i>&nbsp;&nbsp;Create
                                                        </LaddaButton>
                                                    </form>
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
})(withRouter(CreateStream))
