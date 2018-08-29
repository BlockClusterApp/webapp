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

import "./CreateAssetType.scss"

class CreateAssetType extends Component {

    constructor() {
        super()

        this.state = {
            accounts: []
        }

        this.getAccounts = this.getAccounts.bind(this)
    }

    componentDidMount() {
        this.setState({
            refreshAccountsTimer: setInterval(this.getAccounts, 500)
        })
    }

    componentWillUnmount() {
        this.props.subscriptions.forEach((s) =>{
            s.stop();
        });

        clearInterval(this.state.refreshAccountsTimer);
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

    createAssetType = (e, instanceId) => {
        e.preventDefault();

        this.setState({
            createAssetType_formSubmitError: '',
            createAssetType_formloading: true
        });

        let reissuable = false;
        let decimals = 0;

        if(this[instanceId + "_createAssetType_assetType"].value === "bulk") {
            reissuable = this[instanceId + "_createAssetType_reissuable"].value
            decimals = this[instanceId + "_createAssetType_decimals"].value
        }

        Meteor.call("createAssetType", instanceId, this[instanceId + "_createAssetType_assetName"].value, this[instanceId + "_createAssetType_assetType"].value, this[instanceId + "_createAssetType_assetIssuer"].value, reissuable, decimals, (error) => {
            if(!error) {
                this.setState({
                    [instanceId + "_createAssetType_formloading"]: false,
                    [instanceId + "_createAssetType_formSubmitError"]: ''
                });

                notifications.success("Transaction sent")
            } else {
                this.setState({
                    [instanceId + "_createAssetType_formloading"]: false,
                    [instanceId + "_createAssetType_formSubmitError"]: error.reason
                })
            }
        });
    }

    assetTypeSelectionChanged = (instanceId, e) => {
        let obj = {}

        if(e.target.value === "bulk") {
            obj[instanceId + "_showReissuable"] = true;
            obj[instanceId + "_showDecimals"] = true;
        } else {
            obj[instanceId + "_showReissuable"] = false;
            obj[instanceId + "_showDecimals"] = false;
        }

        this.setState(obj)
    }

	render(){
		return (
            <div className="createAssetType content">
                <div className="m-t-20 container-fluid container-fixed-lg bg-white">
                    <div className="row dashboard">
                        <div className="col-lg-12">
                            <div className="card card-transparent">
                                <div className="card-header ">
                                    <div className="card-title">
                                        <Link to={"/app/networks/" + this.props.match.params.id}> Control Panel <i className="fa fa-angle-right"></i></Link> Create Asset Type
                                    </div>
                                </div>
                                <div className="card-block">
                                    <div className="card card-transparent ">
                                        {this.props.network.length === 1 &&
                                            <div>
                                                {this.props.network[0].assetsContractAddress === '' &&
                                                    <div>
                                                        Please deploy smart contract
                                                    </div>
                                                }
                                                {(this.props.network[0].assetsContractAddress !== undefined && this.props.network[0].assetsContractAddress !== '') &&
                                                    <div onSubmit={(e) => {
                                                            this.createAssetType(e, this.props.network[0].instanceId);
                                                        }}>
                                                        <form role="form">
                                                            <div className="form-group">
                                                                <label>Asset Name</label>
                                                                <span className="help"> e.g. "License"</span>
                                                                <input type="text" className="form-control" required ref={(input) => {this[this.props.network[0].instanceId + "_createAssetType_assetName"] = input}} />
                                                            </div>
                                                            <div className="form-group">
                                                                <label>Asset Type</label>
                                                                <span className="help"> e.g. "Bulk"</span>
                                                                <select className="form-control" onChange={(e) => {this.assetTypeSelectionChanged(this.props.network[0].instanceId, e)}} required ref={(input) => {this[this.props.network[0].instanceId + "_createAssetType_assetType"] = input}}>
                                                                    <option key="solo" value="solo">Solo</option>
                                                                    <option key="bulk" value="bulk">Bulk</option>
                                                                </select>
                                                            </div>
                                                            {this.state[this.props.network[0].instanceId + "_showReissuable"] &&
                                                                <div className="form-group">
                                                                    <label>Re-Issuable</label>
                                                                    <span className="help"> e.g. "Fixed Supply?"</span>
                                                                    <select className="form-control"
                                                                        required
                                                                        ref={(input) => {this[this.props.network[0].instanceId + "_createAssetType_reissuable"] = input}}
                                                                    >
                                                                        <option key="yes" value="true">Yes</option>
                                                                        <option key="no" value="false">No</option>
                                                                    </select>
                                                                </div>
                                                            }
                                                            {this.state[this.props.network[0].instanceId + "_showDecimals"] &&
                                                                <div className="form-group">
                                                                    <label>Decimals</label>
                                                                    <span className="help"> e.g. "12.55896"</span>
                                                                    <input type="number" defaultValue="0" min="0" max="18" className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_createAssetType_decimals"] = input}} />
                                                                </div>
                                                            }
                                                            <div className="form-group">
                                                                <label>Issuing Address</label>
                                                                <span className="help"> e.g. "0x84eddb1..."</span>
                                                                <select className="form-control" required ref={(input) => {this[this.props.network[0].instanceId + "_createAssetType_assetIssuer"] = input}}>
                                                                    {this.state.accounts.map((item) => {
                                                                        return <option key={item.address} value={item.address}>{item.name} ({item.address})</option>
                                                                    })}
                                                                </select>
                                                            </div>

                                                            {this.state[this.props.network[0].instanceId + "_createAssetType_formSubmitError"] &&
                                                                <div className="row m-t-30">
                                                                    <div className="col-md-12">
                                                                        <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                                            <button className="close" data-dismiss="alert"></button>
                                                                            {this.state[this.props.network[0].instanceId + "_createAssetType_formSubmitError"]}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            }
                                                            <LaddaButton
                                                                loading={this.state[this.props.network[0].instanceId + "_createAssetType_formloading"]}
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
})(withRouter(CreateAssetType))
