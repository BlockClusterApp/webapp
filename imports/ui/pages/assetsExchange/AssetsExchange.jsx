import React, {Component} from "react";
import {withTracker} from "meteor/react-meteor-data";
import {Networks} from "../../../collections/networks/networks.js"
import {Orders} from "../../../collections/orders/orders.js"
import helpers from "../../../modules/helpers"
import ReactHtmlParser, { processNodes, convertNodeToElement, htmlparser2 } from "react-html-parser";
import {withRouter} from 'react-router-dom'
import LaddaButton, { S, SLIDE_UP } from "react-ladda";
import notifications from "../../../modules/notifications"

import "./AssetsExchange.scss"

class AssetsManagement extends Component {
    constructor() {
        super()
        this.state = {}
    }

    componentWillUnmount() {
        this.props.subscriptions.forEach((s) =>{
            s.stop();
        });

        try {
            ordersSubscription.stop();
        } catch(e){}
    }

    networkSelected(instanceId) {
        this.setState({
            selectedNetwork: instanceId
        }, () => {
            ordersSubscription.stop();
            ordersSubscription = Meteor.subscribe("orders", this.state.selectedNetwork)
        })
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
        this.setState({
            [instanceId + "_buyAsset_selectedNetwork"]: e.target.value
        })
    }

    fullfillOrder_orderIdChange = (e, instanceId) => {
        let orderId = e.target.value;
        let genesisBlockHash = Orders.find({instanceId: instanceId, atomicSwapHash: orderId}).fetch();

        if(genesisBlockHash.length === 1) {
            genesisBlockHash = genesisBlockHash[0].toGenesisBlockHash;
            this.setState({
                [instanceId + "_fullOrder_genesisBlockHash"]: genesisBlockHash
            })

            this[instanceId + "_fullOrder_continueAccountLoop"] = true;
        } else {
            this.setState({
                [instanceId + "_fullOrder_genesisBlockHash"]: undefined,
                [instanceId + "_fullfillOrder_selectedNetwork"]: undefined
            })

            this[instanceId + "_fullOrder_continueAccountLoop"] = false;
        }
    }

    fullfillOrder_networkChange = (e, instanceId) => {
        let selectedInstanceId = e.target.value;

        this.setState({
            [instanceId + "_fullfillOrder_selectedNetwork"]: selectedInstanceId
        })

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
            Networks.find({instanceId: buyAsset_networkId}).fetch()[0].genesisBlockHash,
            this[instanceId + "_sellAsset_timePeriod"].value,
            buyAsset_networkId
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

        let order = Orders.find({instanceId: instanceId, atomicSwapHash: this[instanceId + "_fullfill_orderID"].value}).fetch()[0];

        let otherInstanceId = this[instanceId + "_fullfillOrder_networkId"].value;

        if(Networks.find({instanceId: instanceId}).fetch()[0].genesisBlockHash === order.toGenesisBlockHash) {
            Meteor.call(
                "claimOrder",
                instanceId,
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
                Networks.find({instanceId: instanceId}).fetch()[0].genesisBlockHash,
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
                                    <div className="card-title">Assets Exchange
                                    </div>
                                </div>
                                <div className="card-block no-padding">
                                    <div className="row">
                                        <div className="col-xl-12">
                                            <div className="card card-transparent flex-row">
                                                <ul className="nav nav-tabs nav-tabs-simple nav-tabs-left bg-white" id="tab-3">
                                                    {this.props.networks.map((item, index) => {
                                                        return (
                                                            <li onClick={() => {this.networkSelected(item.instanceId)}} key={item.instanceId} className="nav-item">
                                                                <a href="#" className={index === 0 ? "active" : ""} data-toggle="tab" data-target={"#" + item.instanceId}>{item.name}</a>
                                                            </li>
                                                        )
                                                    })}
                                                </ul>
                                                <div className="tab-content bg-white">
                                                    {this.props.networks.map((item, index) => {
                                                        return (
                                                            <div key={index} className={index === 0 ? "tab-pane active" : "tab-pane "} id={item.instanceId}>
                                                                {item.assetsContractAddress === '' &&
                                                                    <div>
                                                                        Please deploy smart contract
                                                                    </div>
                                                                }
                                                                {(item.assetsContractAddress !== undefined && item.assetsContractAddress !== '') &&
                                                                    <div>
                                                                        <div className="container">
                                                                            <div className="row column-seperation">
                                                                                <div className="col-lg-12">
                                                                                    <div className="card card-transparent">
                                                                                        <ul className="nav nav-tabs nav-tabs-fillup" data-init-reponsive-tabs="dropdownfx">
                                                                                            <li className="nav-item">
                                                                                                <a href="#" className="active" data-toggle="tab" data-target={"#" + item.instanceId + "_slide1"}><span>Place Order</span></a>
                                                                                            </li>
                                                                                            <li className="nav-item">
                                                                                                <a href="#" data-toggle="tab" data-target={"#" + item.instanceId + "_slide2"}><span>Order Book</span></a>
                                                                                            </li>
                                                                                            <li className="nav-item">
                                                                                                <a href="#" data-toggle="tab" data-target={"#" + item.instanceId + "_slide3"}><span>Fulfill Order</span></a>
                                                                                            </li>
                                                                                            <li className="nav-item">
                                                                                                <a href="#" data-toggle="tab" data-target={"#" + item.instanceId + "_slide4"}><span>Cancel Order</span></a>
                                                                                            </li>
                                                                                        </ul>
                                                                                        <div className="tab-content p-l-0 p-r-0">
                                                                                            <div className="tab-pane slide-left active" id={item.instanceId + "_slide1"}>
                                                                                                <form onSubmit={(e) => {this.placeOrder(e, item.instanceId)}}>
                                                                                                    <div className="row column-seperation">
                                                                                                        <div className="col-lg-6">
                                                                                                            <h4>Asset Sale Details</h4>
                                                                                                                <div className="form-group">
                                                                                                                    <label>Asset Type</label>
                                                                                                                    <select className="form-control" onChange={(e) => {this.sellAsset_assetTypeChange(e, item.instanceId)}} ref={(input) => {this[item.instanceId + "_sellAsset_assetType"] = input}} required>
                                                                                                                        <option value="bulk">Bulk</option>
                                                                                                                        <option value="solo">Solo</option>
                                                                                                                    </select>
                                                                                                                </div>

                                                                                                                {this.state[item.instanceId + "_sellAsset_assetType_bulk"] &&
                                                                                                                    <div className="form-group">
                                                                                                                        <label>Asset Name</label>
                                                                                                                        <select className="form-control" ref={(input) => {this[item.instanceId + "_sellAsset_assetName"] = input}} required>
                                                                                                                            {Object.keys(this.props.networks[index].assetsTypes || {}).map((item) => {
                                                                                                                                if(this.props.networks[index].assetsTypes[item].type == "bulk") {
                                                                                                                                    return <option key={this.props.networks[index].assetsTypes[item].assetName} value={this.props.networks[index].assetsTypes[item].assetName}>{this.props.networks[index].assetsTypes[item].assetName}</option>
                                                                                                                                }
                                                                                                                            })}
                                                                                                                        </select>
                                                                                                                    </div>
                                                                                                                }

                                                                                                                {this.state[item.instanceId + "_sellAsset_assetType_solo"] &&
                                                                                                                    <div className="form-group">
                                                                                                                        <label>Asset Name</label>
                                                                                                                        <select className="form-control" ref={(input) => {this[item.instanceId + "_sellAsset_assetName"] = input}} required>
                                                                                                                            {Object.keys(this.props.networks[index].assetsTypes || {}).map((item) => {
                                                                                                                                if(this.props.networks[index].assetsTypes[item].type == "solo") {
                                                                                                                                    return <option key={this.props.networks[index].assetsTypes[item].assetName} value={this.props.networks[index].assetsTypes[item].assetName}>{this.props.networks[index].assetsTypes[item].assetName}</option>
                                                                                                                                }
                                                                                                                            })}
                                                                                                                        </select>
                                                                                                                    </div>
                                                                                                                }

                                                                                                                {(this.state[item.instanceId + "_sellAsset_assetType_bulk"] == undefined && this.state[item.instanceId + "_sellAsset_assetType_solo"] == undefined) &&
                                                                                                                    <div className="form-group">
                                                                                                                        <label>Asset Name</label>
                                                                                                                        <select className="form-control" ref={(input) => {this[item.instanceId + "_sellAsset_assetName"] = input}} required>
                                                                                                                            {Object.keys(this.props.networks[index].assetsTypes || {}).map((item) => {
                                                                                                                                if(this.props.networks[index].assetsTypes[item].type == "bulk") {
                                                                                                                                    return <option key={this.props.networks[index].assetsTypes[item].assetName} value={this.props.networks[index].assetsTypes[item].assetName}>{this.props.networks[index].assetsTypes[item].assetName}</option>
                                                                                                                                }
                                                                                                                            })}
                                                                                                                        </select>
                                                                                                                    </div>
                                                                                                                }

                                                                                                                {(this.state[item.instanceId + "_sellAsset_assetType_bulk"] == true || this.state[item.instanceId + "_sellAsset_assetType_bulk"] == undefined) &&
                                                                                                                    <div className="form-group">
                                                                                                                        <label>Units</label>
                                                                                                                        <input type="number" className="form-control" ref={(input) => {this[item.instanceId + "_sellAsset_units"] = input}} required />
                                                                                                                    </div>
                                                                                                                }

                                                                                                                {(this.state[item.instanceId + "_sellAsset_assetType_solo"] == true) &&
                                                                                                                    <div className="form-group">
                                                                                                                        <label>Identifier</label>
                                                                                                                        <input type="text" className="form-control" ref={(input) => {this[item.instanceId + "_sellAsset_identifier"] = input}} required />
                                                                                                                    </div>
                                                                                                                }

                                                                                                                <div className="form-group">
                                                                                                                    <label>Time Period (min)</label>
                                                                                                                    <input type="number" className="form-control" min="1" step="1" defaultValue="5" ref={(input) => {this[item.instanceId + "_sellAsset_timePeriod"] = input}} required />
                                                                                                                </div>

                                                                                                                <div className="form-group">
                                                                                                                    <label>Seller Account</label>
                                                                                                                    <select className="form-control" ref={(input) => {this[item.instanceId + "_sellAsset_fromAddress"] = input}} required>
                                                                                                                        {this.props.networks[index].accounts.map((item, index) => {
                                                                                                                            return <option key={item} value={item}>{item}</option>
                                                                                                                        })}
                                                                                                                    </select>
                                                                                                                </div>
                                                                                                        </div>
                                                                                                        <div className="col-lg-6">
                                                                                                            <h4>Asset Buy Details</h4>
                                                                                                                <div className="form-group">
                                                                                                                    <label>Network To Buy From</label>
                                                                                                                    <select className="form-control" onChange={(e) => {this.buyAsset_networkChange(e, item.instanceId)}} ref={(input) => {this[item.instanceId + "_buyAsset_networkId"] = input}} required>
                                                                                                                        {Object.keys(this.props.networks || {}).map((key) => {
                                                                                                                            return <option key={this.props.networks[key].instanceId} value={this.props.networks[key].instanceId}>{this.props.networks[key].name}</option>
                                                                                                                        })}
                                                                                                                    </select>
                                                                                                                </div>

                                                                                                                <div className="form-group">
                                                                                                                    <label>Asset Type</label>
                                                                                                                    <select className="form-control" onChange={(e) => {this.buyAsset_assetTypeChange(e, item.instanceId)}} ref={(input) => {this[item.instanceId + "_buyAsset_assetType"] = input}} required>
                                                                                                                        <option value="bulk">Bulk</option>
                                                                                                                        <option value="solo">Solo</option>
                                                                                                                    </select>
                                                                                                                </div>

                                                                                                                {this.state[item.instanceId + "_buyAsset_assetType_bulk"] &&
                                                                                                                    <div className="form-group">
                                                                                                                        <label>Asset Name</label>
                                                                                                                        <select className="form-control" ref={(input) => {this[item.instanceId + "_buyAsset_assetName"] = input}} required>
                                                                                                                            {this.state[item.instanceId + "_buyAsset_selectedNetwork"] === undefined ? (
                                                                                                                                Object.keys(this.props.networks[0].assetsTypes || {}).map((item) => {
                                                                                                                                    if(this.props.networks[0].assetsTypes[item].type == "bulk") {
                                                                                                                                        return <option key={this.props.networks[0].assetsTypes[item].assetName} value={this.props.networks[0].assetsTypes[item].assetName}>{this.props.networks[0].assetsTypes[item].assetName}</option>
                                                                                                                                    }
                                                                                                                                })
                                                                                                                            ) : (
                                                                                                                                Object.keys(this.props.networks || {}).map((key) => {
                                                                                                                                    if(this.props.networks[key].instanceId === this.state[item.instanceId + "_buyAsset_selectedNetwork"]) {
                                                                                                                                        return Object.keys(this.props.networks[key].assetsTypes || {}).map((item) => {
                                                                                                                                            if(this.props.networks[key].assetsTypes[item].type == "bulk") {
                                                                                                                                                return <option key={this.props.networks[key].assetsTypes[item].assetName} value={this.props.networks[key].assetsTypes[item].assetName}>{this.props.networks[key].assetsTypes[item].assetName}</option>
                                                                                                                                            }
                                                                                                                                        })
                                                                                                                                    }
                                                                                                                                })
                                                                                                                            )}
                                                                                                                        </select>
                                                                                                                    </div>
                                                                                                                }

                                                                                                                {this.state[item.instanceId + "_buyAsset_assetType_solo"] &&
                                                                                                                    <div className="form-group">
                                                                                                                        <label>Asset Name</label>
                                                                                                                        <select className="form-control" ref={(input) => {this[item.instanceId + "_buyAsset_assetName"] = input}} required>
                                                                                                                            {this.state[item.instanceId + "_buyAsset_selectedNetwork"] === undefined ? (
                                                                                                                                Object.keys(this.props.networks[0].assetsTypes || {}).map((item) => {
                                                                                                                                    if(this.props.networks[0].assetsTypes[item].type == "solo") {
                                                                                                                                        return <option key={this.props.networks[0].assetsTypes[item].assetName} value={this.props.networks[0].assetsTypes[item].assetName}>{this.props.networks[0].assetsTypes[item].assetName}</option>
                                                                                                                                    }
                                                                                                                                })
                                                                                                                            ) : (
                                                                                                                                Object.keys(this.props.networks || {}).map((key) => {
                                                                                                                                    if(this.props.networks[key].instanceId === this.state[item.instanceId + "_buyAsset_selectedNetwork"]) {
                                                                                                                                        return Object.keys(this.props.networks[key].assetsTypes || {}).map((item) => {
                                                                                                                                            if(this.props.networks[key].assetsTypes[item].type == "solo") {
                                                                                                                                                return <option key={this.props.networks[key].assetsTypes[item].assetName} value={this.props.networks[key].assetsTypes[item].assetName}>{this.props.networks[key].assetsTypes[item].assetName}</option>
                                                                                                                                            }
                                                                                                                                        })
                                                                                                                                    }
                                                                                                                                })
                                                                                                                            )}
                                                                                                                        </select>
                                                                                                                    </div>
                                                                                                                }

                                                                                                                {(this.state[item.instanceId + "_buyAsset_assetType_bulk"] == undefined && this.state[item.instanceId + "_buyAsset_assetType_solo"] == undefined) &&
                                                                                                                    <div className="form-group">
                                                                                                                        <label>Asset Name</label>
                                                                                                                        <select className="form-control" ref={(input) => {this[item.instanceId + "_buyAsset_assetName"] = input}} required>
                                                                                                                            {this.state[item.instanceId + "_buyAsset_selectedNetwork"] === undefined ? (
                                                                                                                                Object.keys(this.props.networks[0].assetsTypes || {}).map((item) => {
                                                                                                                                    if(this.props.networks[0].assetsTypes[item].type == "bulk") {
                                                                                                                                        return <option key={this.props.networks[0].assetsTypes[item].assetName} value={this.props.networks[0].assetsTypes[item].assetName}>{this.props.networks[0].assetsTypes[item].assetName}</option>
                                                                                                                                    }
                                                                                                                                })
                                                                                                                            ) : (
                                                                                                                                Object.keys(this.props.networks || {}).map((key) => {
                                                                                                                                    if(this.props.networks[key].instanceId === this.state[item.instanceId + "_buyAsset_selectedNetwork"]) {
                                                                                                                                        return Object.keys(this.props.networks[key].assetsTypes || {}).map((item) => {
                                                                                                                                            if(this.props.networks[key].assetsTypes[item].type == "bulk") {
                                                                                                                                                return <option key={this.props.networks[key].assetsTypes[item].assetName} value={this.props.networks[key].assetsTypes[item].assetName}>{this.props.networks[key].assetsTypes[item].assetName}</option>
                                                                                                                                            }
                                                                                                                                        })
                                                                                                                                    }
                                                                                                                                })
                                                                                                                            )}
                                                                                                                        </select>
                                                                                                                    </div>
                                                                                                                }

                                                                                                                {(this.state[item.instanceId + "_buyAsset_assetType_bulk"] == true || this.state[item.instanceId + "_buyAsset_assetType_bulk"] == undefined) &&
                                                                                                                    <div className="form-group">
                                                                                                                        <label>Units</label>
                                                                                                                        <input type="number" className="form-control" ref={(input) => {this[item.instanceId + "_buyAsset_units"] = input}} required />
                                                                                                                    </div>
                                                                                                                }

                                                                                                                {(this.state[item.instanceId + "_buyAsset_assetType_solo"] == true) &&
                                                                                                                    <div className="form-group">
                                                                                                                        <label>Identifier</label>
                                                                                                                        <input type="text" className="form-control" ref={(input) => {this[item.instanceId + "_buyAsset_identifier"] = input}} required />
                                                                                                                    </div>
                                                                                                                }

                                                                                                                <div className="form-group">
                                                                                                                    <label>Buyer Account</label>
                                                                                                                    <input type="text" className="form-control" ref={(input) => {this[item.instanceId + "_buyAsset_toAddress"] = input}} required />
                                                                                                                </div>


                                                                                                                {this.state[item.instanceId + "_placeOrder_formSubmitError"] &&
                                                                                                                    <div className="row m-t-40">
                                                                                                                        <div className="col-md-12">
                                                                                                                            <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                                                                                                <button className="close" data-dismiss="alert"></button>
                                                                                                                                {this.state[item.instanceId + "_placeOrder_formSubmitError"]}
                                                                                                                            </div>
                                                                                                                        </div>
                                                                                                                    </div>
                                                                                                                }
                                                                                                                <p className="pull-right">
                                                                                                                    <LaddaButton
                                                                                                                        loading={this.state[item.instanceId + "_placeOrder_formloading"]}
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
                                                                                            <div className="tab-pane slide-left" id={item.instanceId + "_slide2"}>
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
                                                                                                                    {this.props.orders.map((item1, index) => {
                                                                                                                        if(item1.instanceId == item.instanceId) {
                                                                                                                            return (
                                                                                                                                <tr key={item1.atomicSwapHash}>
                                                                                                                                    <td className="v-align-middle ">
                                                                                                                                        {item1.atomicSwapHash}
                                                                                                                                    </td>
                                                                                                                                    <td className="v-align-middle">
                                                                                                                                        {item1.fromAssetType == "bulk" &&
                                                                                                                                            <span>{item1.fromAssetUnits} {item1.fromAssetName}</span>
                                                                                                                                        }

                                                                                                                                        {item1.fromAssetType == "solo" &&
                                                                                                                                            <span>{item1.fromAssetId} {item1.fromAssetName}</span>
                                                                                                                                        }
                                                                                                                                    </td>
                                                                                                                                    <td className="v-align-middle">
                                                                                                                                        {item1.toAssetType == "bulk" &&
                                                                                                                                            <span>{item1.toAssetUnits} {item1.toAssetName}</span>
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
                                                                                            <div className="tab-pane slide-left" id={item.instanceId + "_slide3"}>
                                                                                                <div className="row">
                                                                                                    <div className="col-lg-12">
                                                                                                        <h4>Fulfill Order</h4>
                                                                                                        <form role="form" onSubmit={(e) => {
                                                                                                                this.fulfillOrder(e, item.instanceId);
                                                                                                            }}>
                                                                                                            <div className="form-group">
                                                                                                                <label>Order ID</label>
                                                                                                                <input type="text" className="form-control" onChange={(e) => {this.fullfillOrder_orderIdChange(e, item.instanceId)}} ref={(input) => {this[item.instanceId + "_fullfill_orderID"] = input}} required />
                                                                                                            </div>

                                                                                                            <div className="form-group">
                                                                                                                <label>Network</label>
                                                                                                                <select className="form-control" onChange={(e) => {this.fullfillOrder_networkChange(e, item.instanceId)}} ref={(input) => {this[item.instanceId + "_fullfillOrder_networkId"] = input}} required>
                                                                                                                    {(this.state[item.instanceId + "_fullOrder_genesisBlockHash"] !== undefined) ? (
                                                                                                                        Object.keys(this.props.networks || {}).map((key) => {
                                                                                                                            if(this.props.networks[key].genesisBlockHash === this.state[item.instanceId + "_fullOrder_genesisBlockHash"]) {
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
                                                                                                                    this[item.instanceId + "_fullOrder_continueAccountLoop"] = true;
                                                                                                                    return "";
                                                                                                                })()}
                                                                                                                <select className="form-control" ref={(input) => {this[item.instanceId + "_fullfill_address"] = input}} required>
                                                                                                                    {(this.state[item.instanceId + "_fullOrder_genesisBlockHash"] !== undefined && this.state[item.instanceId + "_fullfillOrder_selectedNetwork"] === undefined) ? (
                                                                                                                        Object.keys(this.props.networks || {}).map((key) => {
                                                                                                                            if(this.props.networks[key].genesisBlockHash === this.state[item.instanceId + "_fullOrder_genesisBlockHash"] && this[item.instanceId + "_fullOrder_continueAccountLoop"] === true) {
                                                                                                                                this[item.instanceId + "_fullOrder_continueAccountLoop"] = false;
                                                                                                                                return this.props.networks[key].accounts.map((item, index) => {
                                                                                                                                    return <option key={item} value={item}>{item}</option>
                                                                                                                                })
                                                                                                                            }
                                                                                                                        })
                                                                                                                    ) : (
                                                                                                                        ""
                                                                                                                    )}

                                                                                                                    {(this.state[item.instanceId + "_fullOrder_genesisBlockHash"] !== undefined && this.state[item.instanceId + "_fullfillOrder_selectedNetwork"] !== undefined) ? (
                                                                                                                        Object.keys(this.props.networks || {}).map((key) => {
                                                                                                                            if(this.state[item.instanceId + "_fullfillOrder_selectedNetwork"] === this.props.networks[key].instanceId) {
                                                                                                                                return this.props.networks[key].accounts.map((item, index) => {
                                                                                                                                    return <option key={item} value={item}>{item}</option>
                                                                                                                                })
                                                                                                                            }
                                                                                                                        })
                                                                                                                    ) : (
                                                                                                                        ""
                                                                                                                    )}
                                                                                                                </select>
                                                                                                            </div>

                                                                                                            {this.state[item.instanceId + "_fullfill_formSubmitError"] &&
                                                                                                                <div className="row m-t-30">
                                                                                                                    <div className="col-md-12">
                                                                                                                        <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                                                                                            <button className="close" data-dismiss="alert"></button>
                                                                                                                            {this.state[item.instanceId + "_fullfill_formSubmitError"]}
                                                                                                                        </div>
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            }
                                                                                                            <p className="pull-right">
                                                                                                                <LaddaButton
                                                                                                                    loading={this.state[item.instanceId + "_fullfill_formloading"]}
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
                                                                                            <div className="tab-pane slide-left" id={item.instanceId + "_slide4"}>
                                                                                                <div className="row">
                                                                                                    <div className="col-lg-12">
                                                                                                        <h4>Cancel Order</h4>
                                                                                                        <form role="form" onSubmit={(e) => {
                                                                                                                this.cancelOrder(e, item.instanceId);
                                                                                                            }}>
                                                                                                            <div className="form-group">
                                                                                                                <label>Order ID</label>
                                                                                                                <input type="text" className="form-control" ref={(input) => {this[item.instanceId + "_cancel_orderID"] = input}} required />
                                                                                                            </div>
                                                                                                            <div className="form-group">
                                                                                                                <label>Account</label>
                                                                                                                <select className="form-control" ref={(input) => {this[item.instanceId + "_cancel_address"] = input}} required>
                                                                                                                    {this.props.networks[index].accounts.map((item, index) => {
                                                                                                                        return <option key={item} value={item}>{item}</option>
                                                                                                                    })}
                                                                                                                </select>
                                                                                                            </div>
                                                                                                            {this.state[item.instanceId + "_cancel_formSubmitError"] &&
                                                                                                                <div className="row m-t-30">
                                                                                                                    <div className="col-md-12">
                                                                                                                        <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                                                                                            <button className="close" data-dismiss="alert"></button>
                                                                                                                            {this.state[item.instanceId + "_cancel_formSubmitError"]}
                                                                                                                        </div>
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            }
                                                                                                            <p className="pull-right">
                                                                                                                <LaddaButton
                                                                                                                    loading={this.state[item.instanceId + "_cancel_formloading"]}
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
        orders: Orders.find({}).fetch(),
        subscriptions: [Meteor.subscribe("networks", {
            onReady: function (){
        		if(Networks.find({}).fetch().length > 0) {
        			ordersSubscription = Meteor.subscribe("orders", Networks.find({}).fetch()[0].instanceId)
        		}
        	}
        })]
    }
})(withRouter(AssetsManagement))
