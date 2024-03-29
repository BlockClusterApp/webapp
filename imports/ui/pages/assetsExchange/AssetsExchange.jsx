import React, {Component} from "react";
import {withTracker} from "meteor/react-meteor-data";
import {Networks} from "../../../collections/networks/networks.js"
import helpers from "../../../modules/helpers"
import ReactHtmlParser, { processNodes, convertNodeToElement, htmlparser2 } from "react-html-parser";
import {withRouter} from 'react-router-dom'
import LaddaButton, { S, SLIDE_UP } from "react-ladda";
import notifications from "../../../modules/notifications"
import {Link} from "react-router-dom"
var BigNumber = require('bignumber.js');
import Config from '../../../modules/config/client'

import "./AssetsExchange.scss"

class AssetsManagement extends Component {
    constructor() {

        super()

        this.state = {
            assetTypes: [],
            accounts: [],
            fullFillNetworkAccounts: [],
            otherSelectedNetworkAssetTypes: [],
            orders: []
        }

        Session.set("otherSelectedNetwork", null)
        Session.set("fullFillNetwork", null)

        this.getAccounts = this.getAccounts.bind(this)
        this.getAssetTypes = this.getAssetTypes.bind(this)
        this.getOtherAccounts = this.getOtherAccounts.bind(this)
        this.getOtherAssetTypes = this.getOtherAssetTypes.bind(this)
        this.getOrders = this.getOrders.bind(this)
    }

    componentDidMount() {
        this.setState({
            refreshAssetTypesTimer: setInterval(this.getAssetTypes, 500),
            refreshAccountsTimer: setInterval(this.getAccounts, 500),
            refreshOtherAssetTypesTimer: setInterval(this.getOtherAssetTypes, 500),
            refreshOtherAccountsTimer: setInterval(this.getOtherAccounts, 500),
            refreshOrders: setInterval(this.getOrders, 500)
        })
    }

    componentWillUnmount() {
        this.props.subscriptions.forEach((s) =>{
            s.stop();
        });

        delete Session.keys['otherSelectedNetwork']
        delete Session.keys['fullFillNetwork']

        clearInterval(this.state.refreshAssetTypesTimer);
        clearInterval(this.state.refreshAccountsTimer);
        clearInterval(this.state.refreshOtherAssetTypesTimer);
        clearInterval(this.state.refreshOtherAccountsTimer);
        clearInterval(this.state.refreshOrders);
    }

    getOtherAssetTypes() {
        if(this.props.network[0]) {
            let otherNetwork = Networks.find({instanceId: Session.get("otherSelectedNetwork"), active: true}).fetch()[0];
            if(otherNetwork) {
                let url = `https://${Config.workerNodeDomainName(otherNetwork.locationCode)}/api/node/${otherNetwork.instanceId}/assets/assetTypes`;
                HTTP.get(url, {
                    headers: {
                        'Authorization': "Basic " + (new Buffer(`${otherNetwork.instanceId}:${otherNetwork["api-password"]}`).toString("base64"))
                    }
                }, (err, res) => {
                    if(!err) {
                        this.setState({
                            otherSelectedNetworkAssetTypes: res.data
                        });
                    }
                })
            }
        }
    }

    getOtherAccounts() {
        if(this.props.network[0]) {
            let otherNetwork = Networks.find({instanceId: Session.get("otherSelectedNetwork"), active: true}).fetch()[0];
            if(otherNetwork) {
                let url = `https://${Config.workerNodeDomainName(otherNetwork.locationCode)}/api/node/${otherNetwork.instanceId}/utility/accounts`;

                HTTP.get(url, {
                    headers: {
                        'Authorization': "Basic " + (new Buffer(`${otherNetwork.instanceId}:${otherNetwork["api-password"]}`).toString("base64"))
                    }
                }, (err, res) => {
                    if(!err) {
                        this.setState({
                            fullFillNetworkAccounts: res.data
                        });
                    }
                })
            }
        }
    }

    getAssetTypes() {
        if(this.props.network[0]) {
            let url = `https://${Config.workerNodeDomainName(this.props.network[0].locationCode)}/api/node/${this.props.network[0].instanceId}/assets/assetTypes`;
            HTTP.get(url, {
                headers: {
                    'Authorization': "Basic " + (new Buffer(`${this.props.network[0].instanceId}:${this.props.network[0]["api-password"]}`).toString("base64"))
                }
            }, (err, res) => {
                if(!err) {
                    this.setState({
                        assetTypes: res.data
                    });
                }
            })
        }
    }

    getOrders() {
        if(this.props.network[0]) {
            let url = `https://${Config.workerNodeDomainName(this.props.network[0].locationCode)}/api/node/${this.props.network[0].instanceId}/assets/orders`;
            HTTP.get(url, {
                headers: {
                    'Authorization': "Basic " + (new Buffer(`${this.props.network[0].instanceId}:${this.props.network[0]["api-password"]}`).toString("base64"))
                }
            }, (err, res) => {
                if(!err) {
                    this.setState({
                        orders: res.data
                    });
                }
            })
        }
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


    sellAsset_assetTypeChange = (e, instanceId) => {
        if(e.target.value == "bulk") {
            this.setState({
                [instanceId + "_sellAsset_assetType_bulk"]: true,
                [instanceId + "_sellAsset_assetType_solo"]: false
            })
        } else {
            this.setState({
                [instanceId + "_sellAsset_assetType_bulk"]: false,
                [instanceId + "_sellAsset_assetType_solo"]: true
            })
        }
    }

    buyAsset_assetTypeChange = (e, instanceId) => {
        if(e.target.value == "bulk") {
            this.setState({
                [instanceId + "_buyAsset_assetType_bulk"]: true,
                [instanceId + "_buyAsset_assetType_solo"]: false
            })
        } else {
            this.setState({
                [instanceId + "_buyAsset_assetType_bulk"]: false,
                [instanceId + "_buyAsset_assetType_solo"]: true
            })
        }
    }

    buyAsset_networkChange = (e, instanceId) => {
        Session.set("otherSelectedNetwork", this[this.props.match.params.id + "_buyAsset_networkId"].value)
    }

    fullfillOrder_orderIdChange = (e, instanceId) => {
        let orderId = e.target.value;

        let url = `https://${Config.workerNodeDomainName(this.props.network[0].locationCode)}/api/node/${this.props.network[0].instanceId}/assets/getOrderInfo`;

        HTTP.call("POST", url, {
            "content": JSON.stringify({
                orderId: orderId
            }),
            "headers": {
                "Content-Type": "application/json",
                'Authorization': "Basic " + (new Buffer(`${this.props.network[0].instanceId}:${this.props.network[0]["api-password"]}`).toString("base64"))
            }
        }, (err, res) => {
            if(!err) {
                let order = res.data;

                if(!order.error) {
                    let genesisBlockHash = order.toGenesisBlockHash;
                    this.setState({
                        [instanceId + "_fullOrder_genesisBlockHash"]: genesisBlockHash
                    })

                    this[instanceId + "_fullOrder_continueAccountLoop"] = true;

                    for(let count  = 0; count < this.props.networks.length; count++) {
                        if(this.props.networks[count].genesisBlockHash === genesisBlockHash) {
                            Session.set("fullFillNetwork", this.props.networks[count].instanceId)
                            break;
                        }
                    }
                } else {
                    this.setState({
                        [instanceId + "_fullOrder_genesisBlockHash"]: undefined,
                        [instanceId + "_fullfillOrder_selectedNetwork"]: undefined
                    })

                    this[instanceId + "_fullOrder_continueAccountLoop"] = false;
                }
            }
        })
    }

    fullfillOrder_networkChange = (e, instanceId) => {
        let selectedInstanceId = e.target.value;

        this.setState({
            [instanceId + "_fullfillOrder_selectedNetwork"]: selectedInstanceId
        })

        Session.set("fullFillNetwork", selectedInstanceId)

        this[instanceId + "_fullOrder_continueAccountLoop"] = true;
    }

    placeOrder = (e, instanceId) => {
        e.preventDefault();

        this.setState({
            [instanceId + "_placeOrder_formloading"]: true,
            [instanceId + "_placeOrder_formSubmitError"]: ''
        });

        if(this[instanceId + "_sellAsset_assetType"].value == "bulk") {
            var fromType = "bulk";
            var fromId = this[instanceId + "_sellAsset_assetName"].value;
            var fromUnits = this[instanceId + "_sellAsset_units"].value;
            var fromUniqueIdentifier = "";
        } else {
            var fromType = "solo";
            var fromId = this[instanceId + "_sellAsset_assetName"].value;
            var fromUnits = "1";
            var fromUniqueIdentifier = this[instanceId + "_sellAsset_identifier"].value;
        }

        var buyAsset_networkId = this[instanceId + "_buyAsset_networkId"].value;

        if(this[instanceId + "_buyAsset_assetType"].value == "bulk") {
            var toType = "bulk";
            var toId = this[instanceId + "_buyAsset_assetName"].value;
            var toUnits = this[instanceId + "_buyAsset_units"].value;
            var toUniqueIdentifier = "";
        } else {
            var toType = "solo";
            var toId = this[instanceId + "_buyAsset_assetName"].value;
            var toUnits = "1";
            var toUniqueIdentifier = this[instanceId + "_buyAsset_identifier"].value;
        }

        Meteor.call(
            "placeOrder",
            instanceId,
            fromType,
            toType,
            fromId,
            toId,
            fromUnits,
            toUnits,
            fromUniqueIdentifier,
            toUniqueIdentifier,
            this[instanceId + "_sellAsset_fromAddress"].value,
            this[instanceId + "_buyAsset_toAddress"].value,
            Networks.find({instanceId: buyAsset_networkId, active: true}).fetch()[0].genesisBlockHash,
            this[instanceId + "_sellAsset_timePeriod"].value,
            buyAsset_networkId,
            (error) => {
                if(error) {
                    this.setState({
                        [instanceId + "_placeOrder_formloading"]: false,
                        [instanceId + "_placeOrder_formSubmitError"]: error.reason
                    });
                } else {
                    this.setState({
                        [instanceId + "_placeOrder_formloading"]: false,
                        [instanceId + "_placeOrder_formSubmitError"]: ''
                    });

                    notifications.success("Transaction sent");
                }
            }
        )
    }

    fulfillOrder = (e, instanceId) => {
        e.preventDefault();

        this.setState({
            [instanceId + "_fullfill_formloading"]: true,
            [instanceId + "_fullfill_formSubmitError"]: ''
        });

        let url = `https://${Config.workerNodeDomainName(this.props.network[0].locationCode)}/api/node/${this.props.network[0].instanceId}/assets/getOrderInfo`;

        HTTP.call("POST", url, {
            "content": JSON.stringify({
                orderId: this[instanceId + "_fullfill_orderID"].value
            }),
            "headers": {
                "Content-Type": "application/json",
                'Authorization': "Basic " + (new Buffer(`${this.props.network[0].instanceId}:${this.props.network[0]["api-password"]}`).toString("base64"))
            }
        }, (err, res) => {
            if(!err) {
                let order = res.data;
                let otherInstanceId = this[instanceId + "_fullfillOrder_networkId"].value;

                if(Networks.find({instanceId: instanceId, active: true}).fetch()[0].genesisBlockHash === order.toGenesisBlockHash) {
                    Meteor.call(
                        "claimOrder",
                        otherInstanceId,
                        this[instanceId + "_fullfill_orderID"].value,
                        this[instanceId + "_fullfill_address"].value,
                        order.toAssetType,
                        order.toAssetName,
                        order.toAssetId,
                        order.toAssetUnits,
                        (error) => {
                            if(error) {
                                this.setState({
                                    [instanceId + "_fullfill_formloading"]: false,
                                    [instanceId + "_fullfill_formSubmitError"]: error.reason
                                });
                            } else {
                                this.setState({
                                    [instanceId + "_fullfill_formloading"]: false,
                                    [instanceId + "_fullfill_formSubmitError"]: ""
                                });

                                notifications.success("Transaction sent");
                            }
                        }
                    )
                } else {
                    let expiryTimestamp = order.fromLockPeriod;
                    let currentTimestamp = new Date().getTime() / 1000;
                    let newMin = null;

                    if(expiryTimestamp - currentTimestamp <= 0) {
                        this.setState({
                            [instanceId + "_fullfill_formloading"]: false,
                            [instanceId + "_fullfill_formSubmitError"]: "Order has expired"
                        });

                        return;
                    } else {
                        let temp = currentTimestamp + ((expiryTimestamp - currentTimestamp) / 2)
                        temp = (temp - currentTimestamp) / 60;
                        newMin = temp;
                    }

                    Meteor.call(
                        "fullfillOrder",
                        instanceId,
                        otherInstanceId,
                        order.toAssetType,
                        order.fromAssetType,
                        order.toAssetName,
                        order.fromAssetName,
                        order.toAssetUnits,
                        order.fromAssetUnits,
                        order.toAssetId,
                        order.fromAssetId,
                        order.toAddress,
                        order.fromAddress,
                        Networks.find({instanceId: instanceId, active: true}).fetch()[0].genesisBlockHash,
                        newMin,
                        this[instanceId + "_fullfill_orderID"].value,
                        (error) => {
                            if(error) {
                                this.setState({
                                    [instanceId + "_fullfill_formloading"]: false,
                                    [instanceId + "_fullfill_formSubmitError"]: error.reason
                                });
                            } else {
                                this.setState({
                                    [instanceId + "_fullfill_formloading"]: false,
                                    [instanceId + "_fullfill_formSubmitError"]: ""
                                });

                                notifications.success("Transaction sent");
                            }
                        }
                    )
                }
            }
        })
    }


    cancelOrder = (e, instanceId) => {
        e.preventDefault();

        this.setState({
            [instanceId + "_cancel_formloading"]: true,
            [instanceId + "_cancel_formSubmitError"]: ''
        });

        Meteor.call(
            "cancelOrder",
            instanceId,
            this[instanceId + "_cancel_orderID"].value,
            this[instanceId + "_cancel_address"].value,
            (error) => {
                if(error) {
                    this.setState({
                        [instanceId + "_cancel_formloading"]: false,
                        [instanceId + "_cancel_formSubmitError"]: error.reason
                    });
                } else {
                    this.setState({
                        [instanceId + "_cancel_formloading"]: false,
                        [instanceId + "_cancel_formSubmitError"]: ""
                    });

                    notifications.success("Transaction sent");
                }
            }
        )
    }

	render(){
		return (
            <div className="assetsManagement content">
                <div className="m-t-20 container-fluid container-fixed-lg bg-white">
                    <div className="row dashboard">
                        <div className="col-lg-12">
                            <div className="card card-transparent">
                                <div className="card-header ">
                                    <div className="card-title">
                                        <Link to={"/app/networks/" + this.props.match.params.id}> Control Panel <i className="fa fa-angle-right"></i></Link> Assets Exchange
                                    </div>
                                </div>
                                <div className="card-block">
                                    <div className="card card-transparent">
                                        {this.props.network.length === 1 &&
                                            <div>
                                                {this.props.network[0].assetsContractAddress === '' &&
                                                    <div>
                                                        Please deploy smart contract
                                                    </div>
                                                }
                                                {(this.props.network[0].assetsContractAddress !== undefined && this.props.network[0].assetsContractAddress !== '') &&
                                                    <div>
                                                        <div className="card card-transparent">
                                                            <ul className="nav nav-tabs nav-tabs-fillup" data-init-reponsive-tabs="dropdownfx">
                                                                <li className="nav-item">
                                                                    <a href="#" className="active" data-toggle="tab" data-target={"#" + this.props.network[0].instanceId + "_slide1"}><span>Place Order</span></a>
                                                                </li>
                                                                <li className="nav-item">
                                                                    <a href="#" data-toggle="tab" data-target={"#" + this.props.network[0].instanceId + "_slide2"}><span>Order Book</span></a>
                                                                </li>
                                                                <li className="nav-item">
                                                                    <a href="#" data-toggle="tab" data-target={"#" + this.props.network[0].instanceId + "_slide3"}><span>Fulfill Order</span></a>
                                                                </li>
                                                                <li className="nav-item">
                                                                    <a href="#" data-toggle="tab" data-target={"#" + this.props.network[0].instanceId + "_slide4"}><span>Cancel Order</span></a>
                                                                </li>
                                                            </ul>
                                                            <div className="tab-content p-l-0 p-r-0">
                                                                <div className="tab-pane slide-left active" id={this.props.network[0].instanceId + "_slide1"}>
                                                                    <form onSubmit={(e) => {this.placeOrder(e, this.props.network[0].instanceId)}}>
                                                                        <div className="row column-seperation">
                                                                            <div className="col-lg-6">
                                                                                <h4>Asset Sale Details</h4>
                                                                                    <div className="form-group">
                                                                                        <label>Asset Type</label>
                                                                                        <select className="form-control" onChange={(e) => {this.sellAsset_assetTypeChange(e, this.props.network[0].instanceId)}} ref={(input) => {this[this.props.network[0].instanceId + "_sellAsset_assetType"] = input}} required>
                                                                                            <option value="bulk">Bulk</option>
                                                                                            <option value="solo">Solo</option>
                                                                                        </select>
                                                                                    </div>

                                                                                    {this.state[this.props.network[0].instanceId + "_sellAsset_assetType_bulk"] &&
                                                                                        <div className="form-group">
                                                                                            <label>Asset Name</label>
                                                                                            <select className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_sellAsset_assetName"] = input}} required>
                                                                                                {this.state.assetTypes.map((item) => {
                                                                                                    if(item.type === "bulk") {
                                                                                                        return <option key={item.assetName} value={item.assetName}>{item.assetName}</option>
                                                                                                    }
                                                                                                })}
                                                                                            </select>
                                                                                        </div>
                                                                                    }

                                                                                    {this.state[this.props.network[0].instanceId + "_sellAsset_assetType_solo"] &&
                                                                                        <div className="form-group">
                                                                                            <label>Asset Name</label>
                                                                                            <select className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_sellAsset_assetName"] = input}} required>
                                                                                                {this.state.assetTypes.map((item) => {
                                                                                                    if(item.type === "solo") {
                                                                                                        return <option key={item.assetName} value={item.assetName}>{item.assetName}</option>
                                                                                                    }
                                                                                                })}
                                                                                            </select>
                                                                                        </div>
                                                                                    }

                                                                                    {(this.state[this.props.network[0].instanceId + "_sellAsset_assetType_bulk"] == undefined && this.state[this.props.network[0].instanceId + "_sellAsset_assetType_solo"] == undefined) &&
                                                                                        <div className="form-group">
                                                                                            <label>Asset Name</label>
                                                                                            <select className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_sellAsset_assetName"] = input}} required>
                                                                                                {this.state.assetTypes.map((item) => {
                                                                                                    if(item.type === "bulk") {
                                                                                                        return <option key={item.assetName} value={item.assetName}>{item.assetName}</option>
                                                                                                    }
                                                                                                })}
                                                                                            </select>
                                                                                        </div>
                                                                                    }

                                                                                    {(this.state[this.props.network[0].instanceId + "_sellAsset_assetType_bulk"] == true || this.state[this.props.network[0].instanceId + "_sellAsset_assetType_bulk"] == undefined) &&
                                                                                        <div className="form-group">
                                                                                            <label>Units</label>
                                                                                            <input type="float" className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_sellAsset_units"] = input}} required />
                                                                                        </div>
                                                                                    }

                                                                                    {(this.state[this.props.network[0].instanceId + "_sellAsset_assetType_solo"] == true) &&
                                                                                        <div className="form-group">
                                                                                            <label>Identifier</label>
                                                                                            <input type="text" className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_sellAsset_identifier"] = input}} required />
                                                                                        </div>
                                                                                    }

                                                                                    <div className="form-group">
                                                                                        <label>Time Period (min)</label>
                                                                                        <input type="number" className="form-control" min="1" step="1" defaultValue="5" ref={(input) => {this[this.props.network[0].instanceId + "_sellAsset_timePeriod"] = input}} required />
                                                                                    </div>

                                                                                    <div className="form-group">
                                                                                        <label>Seller Account</label>
                                                                                        <select className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_sellAsset_fromAddress"] = input}} required>
                                                                                            {this.state.accounts.map((item) => {
                                                                                                return <option key={item.address} value={item.address}>{item.name} ({item.address})</option>
                                                                                            })}
                                                                                        </select>
                                                                                    </div>
                                                                            </div>
                                                                            <div className="col-lg-6">
                                                                                <h4>Asset Buy Details</h4>
                                                                                    <div className="form-group">
                                                                                        <label>Network To Buy From</label>
                                                                                        <select className="form-control" onChange={(e) => {this.buyAsset_networkChange(e, this.props.network[0].instanceId)}} ref={(input) => {this[this.props.network[0].instanceId + "_buyAsset_networkId"] = input}} required>
                                                                                            {Object.keys(this.props.networks || {}).map((key) => {
                                                                                                return <option key={this.props.networks[key].instanceId} value={this.props.networks[key].instanceId}>{this.props.networks[key].name}</option>
                                                                                            })}
                                                                                        </select>
                                                                                    </div>

                                                                                    <div className="form-group">
                                                                                        <label>Asset Type</label>
                                                                                        <select className="form-control" onChange={(e) => {this.buyAsset_assetTypeChange(e, this.props.network[0].instanceId)}} ref={(input) => {this[this.props.network[0].instanceId + "_buyAsset_assetType"] = input}} required>
                                                                                            <option value="bulk">Bulk</option>
                                                                                            <option value="solo">Solo</option>
                                                                                        </select>
                                                                                    </div>

                                                                                    {this.state[this.props.network[0].instanceId + "_buyAsset_assetType_bulk"] &&
                                                                                        <div className="form-group">
                                                                                            <label>Asset Name</label>
                                                                                            <select className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_buyAsset_assetName"] = input}} required>
                                                                                                {Session.get("otherSelectedNetwork") &&
                                                                                                    this.state.otherSelectedNetworkAssetTypes.map((item) => {
                                                                                                        if(item.type === "bulk") {
                                                                                                            return <option key={item.assetName} value={item.assetName}>{item.assetName}</option>
                                                                                                        }
                                                                                                    })
                                                                                                }
                                                                                            </select>
                                                                                        </div>
                                                                                    }

                                                                                    {this.state[this.props.network[0].instanceId + "_buyAsset_assetType_solo"] &&
                                                                                        <div className="form-group">
                                                                                            <label>Asset Name</label>
                                                                                            <select className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_buyAsset_assetName"] = input}} required>
                                                                                                {Session.get("otherSelectedNetwork") &&
                                                                                                    this.state.otherSelectedNetworkAssetTypes.map((item) => {
                                                                                                        if(item.type === "solo") {
                                                                                                            return <option key={item.assetName} value={item.assetName}>{item.assetName}</option>
                                                                                                        }
                                                                                                    })
                                                                                                }
                                                                                            </select>
                                                                                        </div>
                                                                                    }

                                                                                    {(this.state[this.props.network[0].instanceId + "_buyAsset_assetType_bulk"] == undefined && this.state[this.props.network[0].instanceId + "_buyAsset_assetType_solo"] == undefined) &&
                                                                                        <div className="form-group">
                                                                                            <label>Asset Name</label>
                                                                                            <select className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_buyAsset_assetName"] = input}} required>
                                                                                                {Session.get("otherSelectedNetwork") &&
                                                                                                    this.state.otherSelectedNetworkAssetTypes.map((item) => {
                                                                                                        if(item.type === "bulk") {
                                                                                                            return <option key={item.assetName} value={item.assetName}>{item.assetName}</option>
                                                                                                        }
                                                                                                    })
                                                                                                }
                                                                                            </select>
                                                                                        </div>
                                                                                    }

                                                                                    {(this.state[this.props.network[0].instanceId + "_buyAsset_assetType_bulk"] == true || this.state[this.props.network[0].instanceId + "_buyAsset_assetType_bulk"] == undefined) &&
                                                                                        <div className="form-group">
                                                                                            <label>Units</label>
                                                                                            <input type="float" className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_buyAsset_units"] = input}} required />
                                                                                        </div>
                                                                                    }

                                                                                    {(this.state[this.props.network[0].instanceId + "_buyAsset_assetType_solo"] == true) &&
                                                                                        <div className="form-group">
                                                                                            <label>Identifier</label>
                                                                                            <input type="text" className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_buyAsset_identifier"] = input}} required />
                                                                                        </div>
                                                                                    }

                                                                                    <div className="form-group">
                                                                                        <label>Buyer Account</label>
                                                                                        <input type="text" className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_buyAsset_toAddress"] = input}} required />
                                                                                    </div>


                                                                                    {this.state[this.props.network[0].instanceId + "_placeOrder_formSubmitError"] &&
                                                                                        <div className="row m-t-40">
                                                                                            <div className="col-md-12">
                                                                                                <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                                                                    <button className="close" data-dismiss="alert"></button>
                                                                                                    {this.state[this.props.network[0].instanceId + "_placeOrder_formSubmitError"]}
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    }
                                                                                    <p className="pull-right">
                                                                                        <LaddaButton
                                                                                            loading={this.state[this.props.network[0].instanceId + "_placeOrder_formloading"]}
                                                                                            data-size={S}
                                                                                            data-style={SLIDE_UP}
                                                                                            data-spinner-size={30}
                                                                                            data-spinner-lines={12}
                                                                                            className="btn btn-success m-t-10"
                                                                                            type="submit"
                                                                                        >
                                                                                            <i className="fa fa-plus" aria-hidden="true"></i>&nbsp;&nbsp;Place Order
                                                                                        </LaddaButton>
                                                                                    </p>
                                                                            </div>
                                                                        </div>
                                                                    </form>
                                                                </div>
                                                                <div className="tab-pane slide-left" id={this.props.network[0].instanceId + "_slide2"}>
                                                                    <div className="row">
                                                                        <div className="col-lg-12">
                                                                            <h4>Orders</h4>
                                                                            <div className="table-responsive">
                                                                                <table className="table table-hover" id="basicTable">
                                                                                    <thead>
                                                                                        <tr>
                                                                                            <th style={{width: "16%"}}>Order ID</th>
                                                                                            <th style={{width: "16%"}}>Sell Asset</th>
                                                                                            <th style={{width: "16%"}}>Buy Asset</th>
                                                                                            <th style={{width: "16%"}}>Seller</th>
                                                                                            <th style={{width: "16%"}}>Buyer</th>
                                                                                            <th style={{width: "17%"}}>Status</th>
                                                                                        </tr>
                                                                                    </thead>
                                                                                    <tbody>
                                                                                        {this.state.orders.map((item1, index) => {
                                                                                            if(item1.instanceId == this.props.network[0].instanceId) {
                                                                                                return (
                                                                                                    <tr key={item1.atomicSwapHash}>
                                                                                                        <td className="v-align-middle ">
                                                                                                            {item1.atomicSwapHash}
                                                                                                        </td>
                                                                                                        <td className="v-align-middle">
                                                                                                            {item1.fromAssetType == "bulk" &&
                                                                                                                <span>{(new BigNumber(item1.fromAssetUnits)).dividedBy(helpers.addZeros(1, item1.fromAssetParts)).toFixed(parseInt(item1.fromAssetParts)).toString()} {item1.fromAssetName}</span>
                                                                                                            }

                                                                                                            {item1.fromAssetType == "solo" &&
                                                                                                                <span>{item1.fromAssetId} {item1.fromAssetName}</span>
                                                                                                            }
                                                                                                        </td>
                                                                                                        <td className="v-align-middle">
                                                                                                            {item1.toAssetType == "bulk" &&
                                                                                                                <span>{(new BigNumber(item1.toAssetUnits)).dividedBy(helpers.addZeros(1, item1.toAssetParts)).toFixed(parseInt(item1.toAssetParts)).toString()} {item1.toAssetName}</span>
                                                                                                            }

                                                                                                            {item1.toAssetType == "solo" &&
                                                                                                                <span>{item1.toAssetId} {item1.toAssetName}</span>
                                                                                                            }
                                                                                                        </td>
                                                                                                        <td className="v-align-middle">
                                                                                                            {item1.fromAddress}
                                                                                                        </td>
                                                                                                        <td className="v-align-middle">
                                                                                                            <span>{item1.toAddress}</span>
                                                                                                        </td>
                                                                                                        <td className="v-align-middle">
                                                                                                            {ReactHtmlParser(helpers.convertOrderStatusToTag(item1.status))}
                                                                                                        </td>
                                                                                                    </tr>
                                                                                                )
                                                                                            }
                                                                                        })}
                                                                                    </tbody>
                                                                                </table>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="tab-pane slide-left" id={this.props.network[0].instanceId + "_slide3"}>
                                                                    <div className="row">
                                                                        <div className="col-lg-12">
                                                                            <h4>Fulfill Order</h4>
                                                                            <form role="form" onSubmit={(e) => {
                                                                                    this.fulfillOrder(e, this.props.network[0].instanceId);
                                                                                }}>
                                                                                <div className="form-group">
                                                                                    <label>Order ID</label>
                                                                                    <input type="text" className="form-control" onChange={(e) => {this.fullfillOrder_orderIdChange(e, this.props.network[0].instanceId)}} ref={(input) => {this[this.props.network[0].instanceId + "_fullfill_orderID"] = input}} required />
                                                                                </div>

                                                                                <div className="form-group">
                                                                                    <label>Network</label>
                                                                                    <select className="form-control" onChange={(e) => {this.fullfillOrder_networkChange(e, this.props.network[0].instanceId)}} ref={(input) => {this[this.props.network[0].instanceId + "_fullfillOrder_networkId"] = input}} required>
                                                                                        {(this.state[this.props.network[0].instanceId + "_fullOrder_genesisBlockHash"] !== undefined) ? (
                                                                                            Object.keys(this.props.networks || {}).map((key) => {
                                                                                                if(this.props.networks[key].genesisBlockHash === this.state[this.props.network[0].instanceId + "_fullOrder_genesisBlockHash"]) {
                                                                                                    return <option key={this.props.networks[key].instanceId} value={this.props.networks[key].instanceId}>{this.props.networks[key].name}</option>
                                                                                                }
                                                                                            })
                                                                                        ) : (
                                                                                            ""
                                                                                        )}

                                                                                    </select>
                                                                                </div>

                                                                                <div className="form-group">
                                                                                    <label>Account</label>
                                                                                    {(() => {
                                                                                        this[this.props.network[0].instanceId + "_fullOrder_continueAccountLoop"] = true;
                                                                                        return "";
                                                                                    })()}
                                                                                    <select className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_fullfill_address"] = input}} required>
                                                                                        {this.state.fullFillNetworkAccounts.map((item) => {
                                                                                            return <option key={item.address} value={item.address}>{item.name} ({item.address})</option>
                                                                                        })}
                                                                                    </select>
                                                                                </div>

                                                                                {this.state[this.props.network[0].instanceId + "_fullfill_formSubmitError"] &&
                                                                                    <div className="row m-t-30">
                                                                                        <div className="col-md-12">
                                                                                            <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                                                                <button className="close" data-dismiss="alert"></button>
                                                                                                {this.state[this.props.network[0].instanceId + "_fullfill_formSubmitError"]}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                }
                                                                                <p className="pull-right">
                                                                                    <LaddaButton
                                                                                        loading={this.state[this.props.network[0].instanceId + "_fullfill_formloading"]}
                                                                                        data-size={S}
                                                                                        data-style={SLIDE_UP}
                                                                                        data-spinner-size={30}
                                                                                        data-spinner-lines={12}
                                                                                        className="btn btn-success m-t-10"
                                                                                        type="submit"
                                                                                    >
                                                                                        <i className="fa fa-check" aria-hidden="true"></i>&nbsp;&nbsp;Submit
                                                                                    </LaddaButton>
                                                                                </p>
                                                                            </form>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="tab-pane slide-left" id={this.props.network[0].instanceId + "_slide4"}>
                                                                    <div className="row">
                                                                        <div className="col-lg-12">
                                                                            <h4>Cancel Order</h4>
                                                                            <form role="form" onSubmit={(e) => {
                                                                                    this.cancelOrder(e, this.props.network[0].instanceId);
                                                                                }}>
                                                                                <div className="form-group">
                                                                                    <label>Order ID</label>
                                                                                    <input type="text" className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_cancel_orderID"] = input}} required />
                                                                                </div>
                                                                                <div className="form-group">
                                                                                    <label>Account</label>
                                                                                    <select className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_cancel_address"] = input}} required>
                                                                                        {this.state.accounts.map((item) => {
                                                                                            return <option key={item.address} value={item.address}>{item.name} ({item.address})</option>
                                                                                        })}
                                                                                    </select>
                                                                                </div>
                                                                                {this.state[this.props.network[0].instanceId + "_cancel_formSubmitError"] &&
                                                                                    <div className="row m-t-30">
                                                                                        <div className="col-md-12">
                                                                                            <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                                                                <button className="close" data-dismiss="alert"></button>
                                                                                                {this.state[this.props.network[0].instanceId + "_cancel_formSubmitError"]}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                }
                                                                                <p className="pull-right">
                                                                                    <LaddaButton
                                                                                        loading={this.state[this.props.network[0].instanceId + "_cancel_formloading"]}
                                                                                        data-size={S}
                                                                                        data-style={SLIDE_UP}
                                                                                        data-spinner-size={30}
                                                                                        data-spinner-lines={12}
                                                                                        className="btn btn-success m-t-10"
                                                                                        type="submit"
                                                                                    >
                                                                                        <i className="fa fa-times" aria-hidden="true"></i>&nbsp;&nbsp;Cancel
                                                                                    </LaddaButton>
                                                                                </p>
                                                                            </form>
                                                                        </div>
                                                                    </div>
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
        subscriptions: [Meteor.subscribe("networks", {
            onReady: function () {
        		if(Networks.find({instanceId: props.match.params.id, active: true}).fetch().length !== 1) {
        			props.history.push("/app/networks");
        		}

                if(Session.get("otherSelectedNetwork") === null) {
                    Session.set("otherSelectedNetwork",  Networks.find({active: true}).fetch()[0].instanceId)
                }
        	}
        })]
    }
})(withRouter(AssetsManagement))
