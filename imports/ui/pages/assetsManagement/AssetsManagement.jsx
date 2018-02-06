import React, {Component} from "react";
import {withTracker} from "meteor/react-meteor-data";
import {Networks} from "../../../collections/networks/networks.js"
import helpers from "../../../modules/helpers"
import ReactHtmlParser, { processNodes, convertNodeToElement, htmlparser2 } from "react-html-parser";
import {withRouter} from 'react-router-dom'
import LaddaButton, { S, SLIDE_UP } from "react-ladda";
import notifications from "../../../modules/notifications"

import "./AssetsManagement.scss"

class AssetsManagement extends Component {

    constructor() {
        super()
        this.state = {}
    }

    componentWillUnmount() {
        this.props.subscriptions.forEach((s) =>{
            s.stop();
        });
    }

    issueBulkAsset(e, instanceId) {
        e.preventDefault();

        this.setState({
            [instanceId + "_addBulkAsset_formSubmitError"]: '',
            [instanceId + "_addBulkAsset_formloading"]: true
        });

        console.log(
            this[instanceId + "_addBulkAsset_assetName"].value,
            this[instanceId + "_addBulkAsset_fromAddress"].value,
            this[instanceId + "_addBulkAsset_toAddress"].value,
            this[instanceId + "_addBulkAsset_units"].value
        )
    }

    issueSoloAsset(e, instanceId) {
        e.preventDefault();

        this.setState({
            [instanceId + "_addSoloAsset_formSubmitError"]: '',
            [instanceId + "_addSoloAsset_formloading"]: true
        });

        console.log(
            this[instanceId + "_addSoloAsset_assetName"].value,
            this[instanceId + "_addSoloAsset_fromAddress"].value,
            this[instanceId + "_addSoloAsset_toAddress"].value,
            this[instanceId + "_addSoloAsset_identifier"].value
        )
    }

    transferBulkAssets(e, instanceId) {
        e.preventDefault();

        this.setState({
            [instanceId + "_transferBulkAsset_formSubmitError"]: '',
            [instanceId + "_transferBulkAsset_formloading"]: true
        });

        console.log(
            this[instanceId + "_transferBulkAsset_assetName"].value,
            this[instanceId + "_transferBulkAsset_fromAddress"].value,
            this[instanceId + "_transferBulkAsset_toAddress"].value,
            this[instanceId + "_transferBulkAsset_units"].value
        )
    }

    transferSoloAsset(e, instanceId) {
        e.preventDefault();

        this.setState({
            [instanceId + "_transferSoloAsset_formSubmitError"]: '',
            [instanceId + "_transferSoloAsset_formloading"]: true
        });

        console.log(
            this[instanceId + "_transferSoloAsset_assetName"].value,
            this[instanceId + "_transferSoloAsset_fromAddress"].value,
            this[instanceId + "_transferSoloAsset_toAddress"].value,
            this[instanceId + "_transferSoloAsset_identifier"].value
        )
    }

    getBulkAssetBalance(e, instanceId) {
        e.preventDefault();

        this.setState({
            [instanceId + "_getInfoBulkAsset_formloading"]: true,
            [instanceId + "_getInfoBulkAsset_formSubmitError"]: ''
        });

        console.log(
            this[instanceId + "_getInfoBulkAsset_assetName"].value,
            this[instanceId + "_getInfoBulkAsset_address"].value,
        )
    }

    getSoloAssetInfo(e, instanceId) {
        e.preventDefault();

        this.setState({
            [instanceId + "_getInfoSoloAsset_formloading"]: true,
            [instanceId + "_getInfoSoloAsset_formSubmitError"]: ''
        });

        console.log(
            this[instanceId + "_getInfoSoloAsset_assetName"].value,
            this[instanceId + "_getInfoSoloAsset_identifier"].value,
        )
    }

    addUpdateSoloAssetInfo(e, instanceId) {
        e.preventDefault();

        this.setState({
            [instanceId + "_updateSoloAssetInfo_formloading"]: true,
            [instanceId + "_updateSoloAssetInfo_formSubmitError"]: ''
        });

        console.log(
            this[instanceId + "_updateSoloAssetInfo_assetName"].value,
            this[instanceId + "_updateSoloAssetInfo_fromAddress"].value,
            this[instanceId + "_updateSoloAssetInfo_identifier"].value,
            this[instanceId + "_updateSoloAssetInfo_key"].value,
            this[instanceId + "_updateSoloAssetInfo_value"].value
        )
    }

    closeSoloAsset(e, instanceId) {
        e.preventDefault();

        this.setState({
            [instanceId + "_closeAsset_formloading"]: true,
            [instanceId + "_closeAsset_formSubmitError"]: ''
        });

        console.log(
            this[instanceId + "_closeAsset_assetName"].value,
            this[instanceId + "_closeAsset_fromAddress"].value,
            this[instanceId + "_closeAsset_identifier"].value
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
                                    <div className="card-title">Assets Events
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
                                                                                                <a href="#" className="active" data-toggle="tab" data-target="#slide1"><span>Issue Assets</span></a>
                                                                                            </li>
                                                                                            <li className="nav-item">
                                                                                                <a href="#" data-toggle="tab" data-target="#slide2"><span>Transfer Assets</span></a>
                                                                                            </li>
                                                                                            <li className="nav-item">
                                                                                                <a href="#" data-toggle="tab" data-target="#slide3"><span>Get Asset Info</span></a>
                                                                                            </li>
                                                                                            <li className="nav-item">
                                                                                                <a href="#" data-toggle="tab" data-target="#slide4"><span>Add/Update Solo Asset Info</span></a>
                                                                                            </li>
                                                                                            <li className="nav-item">
                                                                                                <a href="#" data-toggle="tab" data-target="#slide5"><span>Close Solo Asset</span></a>
                                                                                            </li>
                                                                                        </ul>
                                                                                        <div className="tab-content p-l-0 p-r-0">
                                                                                            <div className="tab-pane slide-left active" id="slide1">
                                                                                                <div className="row column-seperation">
                                                                                                    <div className="col-lg-6">
                                                                                                        <h4>Issue Bulk Assets</h4>
                                                                                                        <form role="form" onSubmit={(e) => {
                                                                                                                this.issueBulkAsset(e, item.instanceId);
                                                                                                            }}>
                                                                                                            <div className="form-group">
                                                                                                                <label>Asset Name</label>
                                                                                                                <select className="form-control" ref={(input) => {this[item.instanceId + "_addBulkAsset_assetName"] = input}} required>
                                                                                                                    {this.props.networks[index].assetsTypes.map((item, index) => {
                                                                                                                        if(item.type == "bulk") {
                                                                                                                            return <option key={item.assetName} value={item.assetName}>{item.assetName}</option>
                                                                                                                        }
                                                                                                                    })}
                                                                                                                </select>
                                                                                                            </div>
                                                                                                            <div className="form-group">
                                                                                                                <label>From Account</label>
                                                                                                                <select className="form-control" ref={(input) => {this[item.instanceId + "_addBulkAsset_fromAddress"] = input}} required>
                                                                                                                    {this.props.networks[index].accounts.map((item, index) => {
                                                                                                                        return <option key={item} value={item}>{item}</option>
                                                                                                                    })}
                                                                                                                </select>
                                                                                                            </div>
                                                                                                            <div className="form-group">
                                                                                                                <label>To Account</label>
                                                                                                                <input type="text" className="form-control" ref={(input) => {this[item.instanceId + "_addBulkAsset_toAddress"] = input}} required />
                                                                                                            </div>
                                                                                                            <div className="form-group">
                                                                                                                <label>Units</label>
                                                                                                                <input type="number" className="form-control" ref={(input) => {this[item.instanceId + "_addBulkAsset_units"] = input}} required />
                                                                                                            </div>
                                                                                                            {this.state[item.instanceId + "_addBulkAsset_formSubmitError"] &&
                                                                                                                <div className="row m-t-30">
                                                                                                                    <div className="col-md-12">
                                                                                                                        <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                                                                                            <button className="close" data-dismiss="alert"></button>
                                                                                                                            {this.state[item.instanceId + "_addBulkAsset_formSubmitError"]}
                                                                                                                        </div>
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            }
                                                                                                            <p className="pull-right">
                                                                                                                <LaddaButton
                                                                                                                    loading={this.state[item.instanceId + "_addBulkAsset_formloading"]}
                                                                                                                    data-size={S}
                                                                                                                    data-style={SLIDE_UP}
                                                                                                                    data-spinner-size={30}
                                                                                                                    data-spinner-lines={12}
                                                                                                                    className="btn btn-success m-t-10"
                                                                                                                    type="submit"
                                                                                                                >
                                                                                                                    <i className="fa fa-plus" aria-hidden="true"></i>&nbsp;&nbsp;Issue Asset
                                                                                                                </LaddaButton>
                                                                                                            </p>
                                                                                                        </form>
                                                                                                    </div>
                                                                                                    <div className="col-lg-6">
                                                                                                        <h4>Issue Solo Asset</h4>
                                                                                                        <form role="form" onSubmit={(e) => {
                                                                                                                this.issueSoloAsset(e, item.instanceId);
                                                                                                            }}>
                                                                                                            <div className="form-group">
                                                                                                                <label>Asset Name</label>
                                                                                                                <select className="form-control" ref={(input) => {this[item.instanceId + "_addSoloAsset_assetName"] = input}} required>
                                                                                                                    {this.props.networks[index].assetsTypes.map((item, index) => {
                                                                                                                        if(item.type == "solo") {
                                                                                                                            return <option key={item.assetName} value={item.assetName}>{item.assetName}</option>
                                                                                                                        }
                                                                                                                    })}
                                                                                                                </select>
                                                                                                            </div>
                                                                                                            <div className="form-group">
                                                                                                                <label>From Account</label>
                                                                                                                <select className="form-control" ref={(input) => {this[item.instanceId + "_addSoloAsset_fromAddress"] = input}} required>
                                                                                                                    {this.props.networks[index].accounts.map((item, index) => {
                                                                                                                        return <option key={item} value={item}>{item}</option>
                                                                                                                    })}
                                                                                                                </select>
                                                                                                            </div>
                                                                                                            <div className="form-group">
                                                                                                                <label>To Account</label>
                                                                                                                <input type="text" className="form-control" ref={(input) => {this[item.instanceId + "_addSoloAsset_toAddress"] = input}} required />
                                                                                                            </div>
                                                                                                            <div className="form-group">
                                                                                                                <label>Identifier</label>
                                                                                                                <input type="text" className="form-control" ref={(input) => {this[item.instanceId + "_addSoloAsset_identifier"] = input}} required />
                                                                                                            </div>
                                                                                                            {this.state[item.instanceId + "_addSoloAsset_formSubmitError"] &&
                                                                                                                <div className="row m-t-30">
                                                                                                                    <div className="col-md-12">
                                                                                                                        <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                                                                                            <button className="close" data-dismiss="alert"></button>
                                                                                                                            {this.state[item.instanceId + "_addBulkAsset_formSubmitError"]}
                                                                                                                        </div>
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            }
                                                                                                            <p className="pull-right">
                                                                                                                <LaddaButton
                                                                                                                    loading={this.state[item.instanceId + "_addSoloAsset_formloading"]}
                                                                                                                    data-size={S}
                                                                                                                    data-style={SLIDE_UP}
                                                                                                                    data-spinner-size={30}
                                                                                                                    data-spinner-lines={12}
                                                                                                                    className="btn btn-success m-t-10"
                                                                                                                    type="submit"
                                                                                                                >
                                                                                                                    <i className="fa fa-plus" aria-hidden="true"></i>&nbsp;&nbsp;Issue Asset
                                                                                                                </LaddaButton>
                                                                                                            </p>
                                                                                                        </form>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                            <div className="tab-pane slide-left" id="slide2">
                                                                                                <div className="row">
                                                                                                    <div className="col-lg-6">
                                                                                                        <h4>Transfer Bulk Assets</h4>
                                                                                                        <form role="form" onSubmit={(e) => {
                                                                                                                this.transferBulkAssets(e, item.instanceId);
                                                                                                            }}>
                                                                                                            <div className="form-group">
                                                                                                                <label>Asset Name</label>
                                                                                                                <select className="form-control" ref={(input) => {this[item.instanceId + "_transferBulkAsset_assetName"] = input}} required>
                                                                                                                    {this.props.networks[index].assetsTypes.map((item, index) => {
                                                                                                                        if(item.type == "bulk") {
                                                                                                                            return <option key={item.assetName} value={item.assetName}>{item.assetName}</option>
                                                                                                                        }
                                                                                                                    })}
                                                                                                                </select>
                                                                                                            </div>
                                                                                                            <div className="form-group">
                                                                                                                <label>From Account</label>
                                                                                                                <select className="form-control" ref={(input) => {this[item.instanceId + "_transferBulkAsset_fromAddress"] = input}} required>
                                                                                                                    {this.props.networks[index].accounts.map((item, index) => {
                                                                                                                        return <option key={item} value={item}>{item}</option>
                                                                                                                    })}
                                                                                                                </select>
                                                                                                            </div>
                                                                                                            <div className="form-group">
                                                                                                                <label>To Account</label>
                                                                                                                <input type="text" className="form-control" ref={(input) => {this[item.instanceId + "_transferBulkAsset_toAddress"] = input}} required />
                                                                                                            </div>
                                                                                                            <div className="form-group">
                                                                                                                <label>Units</label>
                                                                                                                <input type="number" className="form-control" ref={(input) => {this[item.instanceId + "_transferBulkAsset_units"] = input}} required />
                                                                                                            </div>
                                                                                                            {this.state[item.instanceId + "_transferBulkAsset_formSubmitError"] &&
                                                                                                                <div className="row m-t-30">
                                                                                                                    <div className="col-md-12">
                                                                                                                        <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                                                                                            <button className="close" data-dismiss="alert"></button>
                                                                                                                            {this.state[item.instanceId + "_transferBulkAsset_formSubmitError"]}
                                                                                                                        </div>
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            }
                                                                                                            <p className="pull-right">
                                                                                                                <LaddaButton
                                                                                                                    loading={this.state[item.instanceId + "_transferBulkAsset_formloading"]}
                                                                                                                    data-size={S}
                                                                                                                    data-style={SLIDE_UP}
                                                                                                                    data-spinner-size={30}
                                                                                                                    data-spinner-lines={12}
                                                                                                                    className="btn btn-success m-t-10"
                                                                                                                    type="submit"
                                                                                                                >
                                                                                                                    <i className="fa fa-exchange" aria-hidden="true"></i>&nbsp;&nbsp;Transfer Asset
                                                                                                                </LaddaButton>
                                                                                                            </p>
                                                                                                        </form>
                                                                                                    </div>
                                                                                                    <div className="col-lg-6">
                                                                                                        <h4>Transfer Solo Asset</h4>
                                                                                                        <form role="form" onSubmit={(e) => {
                                                                                                                this.transferSoloAsset(e, item.instanceId);
                                                                                                            }}>
                                                                                                            <div className="form-group">
                                                                                                                <label>Asset Name</label>
                                                                                                                <select className="form-control" ref={(input) => {this[item.instanceId + "_transferSoloAsset_assetName"] = input}} required>
                                                                                                                    {this.props.networks[index].assetsTypes.map((item, index) => {
                                                                                                                        if(item.type == "solo") {
                                                                                                                            return <option key={item.assetName} value={item.assetName}>{item.assetName}</option>
                                                                                                                        }
                                                                                                                    })}
                                                                                                                </select>
                                                                                                            </div>
                                                                                                            <div className="form-group">
                                                                                                                <label>From Account</label>
                                                                                                                <select className="form-control" ref={(input) => {this[item.instanceId + "_transferSoloAsset_fromAddress"] = input}} required>
                                                                                                                    {this.props.networks[index].accounts.map((item, index) => {
                                                                                                                        return <option key={item} value={item}>{item}</option>
                                                                                                                    })}
                                                                                                                </select>
                                                                                                            </div>
                                                                                                            <div className="form-group">
                                                                                                                <label>To Account</label>
                                                                                                                <input type="text" className="form-control" ref={(input) => {this[item.instanceId + "_transferSoloAsset_toAddress"] = input}} required />
                                                                                                            </div>
                                                                                                            <div className="form-group">
                                                                                                                <label>Identifier</label>
                                                                                                                <input type="text" className="form-control" ref={(input) => {this[item.instanceId + "_transferSoloAsset_identifier"] = input}} required />
                                                                                                            </div>
                                                                                                            {this.state[item.instanceId + "_transferSoloAsset_formSubmitError"] &&
                                                                                                                <div className="row m-t-30">
                                                                                                                    <div className="col-md-12">
                                                                                                                        <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                                                                                            <button className="close" data-dismiss="alert"></button>
                                                                                                                            {this.state[item.instanceId + "_transferSoloAsset_formSubmitError"]}
                                                                                                                        </div>
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            }
                                                                                                            <p className="pull-right">
                                                                                                                <LaddaButton
                                                                                                                    loading={this.state[item.instanceId + "_transferSoloAsset_formloading"]}
                                                                                                                    data-size={S}
                                                                                                                    data-style={SLIDE_UP}
                                                                                                                    data-spinner-size={30}
                                                                                                                    data-spinner-lines={12}
                                                                                                                    className="btn btn-success m-t-10"
                                                                                                                    type="submit"
                                                                                                                >
                                                                                                                    <i className="fa fa-exchange" aria-hidden="true"></i>&nbsp;&nbsp;Issue Asset
                                                                                                                </LaddaButton>
                                                                                                            </p>
                                                                                                        </form>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                            <div className="tab-pane slide-left" id="slide3">
                                                                                                <div className="row">
                                                                                                    <div className="col-lg-6">
                                                                                                        <h4>Get Bulk Asset Balance</h4>
                                                                                                        <form role="form" onSubmit={(e) => {
                                                                                                                this.getBulkAssetBalance(e, item.instanceId);
                                                                                                            }}>
                                                                                                            <div className="form-group">
                                                                                                                <label>Asset Name</label>
                                                                                                                <select className="form-control" ref={(input) => {this[item.instanceId + "_getInfoBulkAsset_assetName"] = input}} required>
                                                                                                                    {this.props.networks[index].assetsTypes.map((item, index) => {
                                                                                                                        if(item.type == "bulk") {
                                                                                                                            return <option key={item.assetName} value={item.assetName}>{item.assetName}</option>
                                                                                                                        }
                                                                                                                    })}
                                                                                                                </select>
                                                                                                            </div>
                                                                                                            <div className="form-group">
                                                                                                                <label>Account</label>
                                                                                                                <select className="form-control" ref={(input) => {this[item.instanceId + "_getInfoBulkAsset_address"] = input}} required>
                                                                                                                    {this.props.networks[index].accounts.map((item, index) => {
                                                                                                                        return <option key={item} value={item}>{item}</option>
                                                                                                                    })}
                                                                                                                </select>
                                                                                                            </div>
                                                                                                            {this.state[item.instanceId + "_getInfoBulkAsset_formSubmitError"] &&
                                                                                                                <div className="row m-t-30">
                                                                                                                    <div className="col-md-12">
                                                                                                                        <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                                                                                            <button className="close" data-dismiss="alert"></button>
                                                                                                                            {this.state[item.instanceId + "_getInfoBulkAsset_formSubmitError"]}
                                                                                                                        </div>
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            }
                                                                                                            <p className="pull-right">
                                                                                                                <LaddaButton
                                                                                                                    loading={this.state[item.instanceId + "_getInfoBulkAsset_formloading"]}
                                                                                                                    data-size={S}
                                                                                                                    data-style={SLIDE_UP}
                                                                                                                    data-spinner-size={30}
                                                                                                                    data-spinner-lines={12}
                                                                                                                    className="btn btn-success m-t-10"
                                                                                                                    type="submit"
                                                                                                                >
                                                                                                                    <i className="fa fa-balance-scale" aria-hidden="true"></i>&nbsp;&nbsp;Get Balance
                                                                                                                </LaddaButton>
                                                                                                            </p>
                                                                                                        </form>
                                                                                                    </div>
                                                                                                    <div className="col-lg-6">
                                                                                                        <h4>Get Solo Asset Info</h4>
                                                                                                        <form role="form" onSubmit={(e) => {
                                                                                                                this.getSoloAssetInfo(e, item.instanceId);
                                                                                                            }}>
                                                                                                            <div className="form-group">
                                                                                                                <label>Asset Name</label>
                                                                                                                <select className="form-control" ref={(input) => {this[item.instanceId + "_getInfoSoloAsset_assetName"] = input}} required>
                                                                                                                    {this.props.networks[index].assetsTypes.map((item, index) => {
                                                                                                                        if(item.type == "solo") {
                                                                                                                            return <option key={item.assetName} value={item.assetName}>{item.assetName}</option>
                                                                                                                        }
                                                                                                                    })}
                                                                                                                </select>
                                                                                                            </div>
                                                                                                            <div className="form-group">
                                                                                                                <label>Identifier</label>
                                                                                                                <input type="text" className="form-control" ref={(input) => {this[item.instanceId + "_getInfoSoloAsset_identifier"] = input}} required />
                                                                                                            </div>
                                                                                                            {this.state[item.instanceId + "_getInfoSoloAsset_formSubmitError"] &&
                                                                                                                <div className="row m-t-30">
                                                                                                                    <div className="col-md-12">
                                                                                                                        <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                                                                                            <button className="close" data-dismiss="alert"></button>
                                                                                                                            {this.state[item.instanceId + "_getInfoSoloAsset_formSubmitError"]}
                                                                                                                        </div>
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            }
                                                                                                            <p className="pull-right">
                                                                                                                <LaddaButton
                                                                                                                    loading={this.state[item.instanceId + "_getInfoSoloAsset_formloading"]}
                                                                                                                    data-size={S}
                                                                                                                    data-style={SLIDE_UP}
                                                                                                                    data-spinner-size={30}
                                                                                                                    data-spinner-lines={12}
                                                                                                                    className="btn btn-success m-t-10"
                                                                                                                    type="submit"
                                                                                                                >
                                                                                                                    <i className="fa fa-info" aria-hidden="true"></i>&nbsp;&nbsp;Get Info
                                                                                                                </LaddaButton>
                                                                                                            </p>
                                                                                                        </form>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                            <div className="tab-pane slide-left" id="slide4">
                                                                                                <div className="row">
                                                                                                    <div className="col-lg-12">
                                                                                                        <h4>Add/Update Meta Data</h4>
                                                                                                        <form role="form" onSubmit={(e) => {
                                                                                                                this.addUpdateSoloAssetInfo(e, item.instanceId);
                                                                                                            }}>
                                                                                                            <div className="form-group">
                                                                                                                <label>Asset Name</label>
                                                                                                                <select className="form-control" ref={(input) => {this[item.instanceId + "_updateSoloAssetInfo_assetName"] = input}} required>
                                                                                                                    {this.props.networks[index].assetsTypes.map((item, index) => {
                                                                                                                        if(item.type == "solo") {
                                                                                                                            return <option key={item.assetName} value={item.assetName}>{item.assetName}</option>
                                                                                                                        }
                                                                                                                    })}
                                                                                                                </select>
                                                                                                            </div>
                                                                                                            <div className="form-group">
                                                                                                                <label>From Account</label>
                                                                                                                <select className="form-control" ref={(input) => {this[item.instanceId + "_updateSoloAssetInfo_fromAddress"] = input}} required>
                                                                                                                    {this.props.networks[index].accounts.map((item, index) => {
                                                                                                                        return <option key={item} value={item}>{item}</option>
                                                                                                                    })}
                                                                                                                </select>
                                                                                                            </div>
                                                                                                            <div className="form-group">
                                                                                                                <label>Identifier</label>
                                                                                                                <input type="text" className="form-control" ref={(input) => {this[item.instanceId + "_updateSoloAssetInfo_identifier"] = input}} required />
                                                                                                            </div>
                                                                                                            <div className="form-group">
                                                                                                                <label>Key</label>
                                                                                                                <input type="text" className="form-control" ref={(input) => {this[item.instanceId + "_updateSoloAssetInfo_key"] = input}} required />
                                                                                                            </div>
                                                                                                            <div className="form-group">
                                                                                                                <label>Value</label>
                                                                                                                <input type="text" className="form-control" ref={(input) => {this[item.instanceId + "_updateSoloAssetInfo_value"] = input}} required />
                                                                                                            </div>
                                                                                                            {this.state[item.instanceId + "_updateSoloAssetInfo_formSubmitError"] &&
                                                                                                                <div className="row m-t-30">
                                                                                                                    <div className="col-md-12">
                                                                                                                        <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                                                                                            <button className="close" data-dismiss="alert"></button>
                                                                                                                            {this.state[item.instanceId + "_updateSoloAssetInfo_formSubmitError"]}
                                                                                                                        </div>
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            }
                                                                                                            <p className="pull-right">
                                                                                                                <LaddaButton
                                                                                                                    loading={this.state[item.instanceId + "_updateSoloAssetInfo_formloading"]}
                                                                                                                    data-size={S}
                                                                                                                    data-style={SLIDE_UP}
                                                                                                                    data-spinner-size={30}
                                                                                                                    data-spinner-lines={12}
                                                                                                                    className="btn btn-success m-t-10"
                                                                                                                    type="submit"
                                                                                                                >
                                                                                                                    <i className="fa fa-wrench" aria-hidden="true"></i>&nbsp;&nbsp;Update
                                                                                                                </LaddaButton>
                                                                                                            </p>
                                                                                                        </form>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                            <div className="tab-pane slide-left" id="slide5">
                                                                                                <div className="row">
                                                                                                    <div className="col-lg-12">
                                                                                                        <h4>Close Asset</h4>
                                                                                                        <form role="form" onSubmit={(e) => {
                                                                                                                this.closeSoloAsset(e, item.instanceId);
                                                                                                            }}>
                                                                                                            <div className="form-group">
                                                                                                                <label>Asset Name</label>
                                                                                                                <select className="form-control" ref={(input) => {this[item.instanceId + "_closeAsset_assetName"] = input}} required>
                                                                                                                    {this.props.networks[index].assetsTypes.map((item, index) => {
                                                                                                                        if(item.type == "solo") {
                                                                                                                            return <option key={item.assetName} value={item.assetName}>{item.assetName}</option>
                                                                                                                        }
                                                                                                                    })}
                                                                                                                </select>
                                                                                                            </div>
                                                                                                            <div className="form-group">
                                                                                                                <label>From Account</label>
                                                                                                                <select className="form-control" ref={(input) => {this[item.instanceId + "_closeAsset_fromAddress"] = input}} required>
                                                                                                                    {this.props.networks[index].accounts.map((item, index) => {
                                                                                                                        return <option key={item} value={item}>{item}</option>
                                                                                                                    })}
                                                                                                                </select>
                                                                                                            </div>
                                                                                                            <div className="form-group">
                                                                                                                <label>Identifier</label>
                                                                                                                <input type="text" className="form-control" ref={(input) => {this[item.instanceId + "_closeAsset_identifier"] = input}} required />
                                                                                                            </div>
                                                                                                            {this.state[item.instanceId + "_closeAsset_formSubmitError"] &&
                                                                                                                <div className="row m-t-30">
                                                                                                                    <div className="col-md-12">
                                                                                                                        <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                                                                                            <button className="close" data-dismiss="alert"></button>
                                                                                                                            {this.state[item.instanceId + "_closeAsset_formSubmitError"]}
                                                                                                                        </div>
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            }
                                                                                                            <p className="pull-right">
                                                                                                                <LaddaButton
                                                                                                                    loading={this.state[item.instanceId + "_closeAsset_formloading"]}
                                                                                                                    data-size={S}
                                                                                                                    data-style={SLIDE_UP}
                                                                                                                    data-spinner-size={30}
                                                                                                                    data-spinner-lines={12}
                                                                                                                    className="btn btn-success m-t-10"
                                                                                                                    type="submit"
                                                                                                                >
                                                                                                                    <i className="fa fa-times-circle" aria-hidden="true"></i>&nbsp;&nbsp;Close
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
        subscriptions: [Meteor.subscribe("networks")]
    }
})(withRouter(AssetsManagement))
