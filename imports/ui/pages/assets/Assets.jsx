import React, {Component} from "react";
import {withTracker} from "meteor/react-meteor-data";
import {Networks} from "../../../collections/networks/networks.js"
import helpers from "../../../modules/helpers"
import ReactHtmlParser, { processNodes, convertNodeToElement, htmlparser2 } from "react-html-parser";
import {withRouter} from 'react-router-dom'
import LaddaButton, { S, SLIDE_UP } from "react-ladda";
import notifications from "../../../modules/notifications"

import "./Assets.scss"

class Assets extends Component {

    constructor() {
        super()
        this.state = {}
    }

    createAssetType = (e, instanceId) => {
        e.preventDefault();

        this.setState({
            createAssetType_formSubmitError: '',
            createAssetType_formloading: true
        });
        Meteor.call("createAssetType", instanceId, this[instanceId + "_createAssetType_assetName"].value, this[instanceId + "_createAssetType_assetType"].value, this[instanceId + "_createAssetType_assetIssuer"].value, (error) => {
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

    componentWillUnmount() {
        this.props.subscriptions.forEach((s) =>{
            s.stop();
        });
    }

	render(){
		return (
            <div className="assets content">
                <div className="m-t-20 container-fluid container-fixed-lg bg-white">
                    <div className="row dashboard">
                        <div className="col-lg-12">
                            <div className="card card-transparent">
                                <div className="card-header ">
                                    <div className="card-title">Assets
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
                                                                                <div className="col-lg-5">
                                                                                    <div className="card-group horizontal" id={item.instanceId + "_accordion"} role="tablist" aria-multiselectable="true">
                                                                                        <div className="card card-default m-b-0">
                                                                                            <div className="card-header " role="tab" id={item.instanceId + "_headingOne"}>
                                                                                                <h4 className="card-title">
                                                                                                    <a data-toggle="collapse" data-parent={"#" + item.instanceId + "_accordion"} href={"#" + item.instanceId + "_collapseOne"} aria-expanded="true" aria-controls={item.instanceId + "_collapseOne"}>
                                                                                                    Add Asset Type
                                                                                                    </a>
                                                                                                </h4>
                                                                                            </div>
                                                                                            <div id={item.instanceId + "_collapseOne"} className="collapse show" role="tabcard" aria-labelledby={item.instanceId + "_headingOne"}>
                                                                                                <div className="card-block" onSubmit={(e) => {
                                                                                                        this.createAssetType(e, item.instanceId);
                                                                                                    }}>
                                                                                                    <form role="form">
                                                                                                        <div className="form-group">
                                                                                                            <label>Asset Name</label>
                                                                                                            <span className="help"> e.g. "License"</span>
                                                                                                            <input type="text" className="form-control" required ref={(input) => {this[item.instanceId + "_createAssetType_assetName"] = input}} />
                                                                                                        </div>
                                                                                                        <div className="form-group">
                                                                                                            <label>Asset Type</label>
                                                                                                            <span className="help"> e.g. "Bulk"</span>
                                                                                                            <select className="form-control" required ref={(input) => {this[item.instanceId + "_createAssetType_assetType"] = input}}>
                                                                                                                <option key="bulk" value="bulk">Bulk</option>
                                                                                                                <option key="solo" value="solo">Solo</option>
                                                                                                            </select>
                                                                                                        </div>
                                                                                                        <div className="form-group">
                                                                                                            <label>Issuing Address</label>
                                                                                                            <span className="help"> e.g. "0x84eddb1..."</span>
                                                                                                            <select className="form-control" required ref={(input) => {this[item.instanceId + "_createAssetType_assetIssuer"] = input}}>
                                                                                                                {item.accounts.map((address, addressIndex) => {
                                											                                        return (
                                                                                                                        <option key={addressIndex}>{address}</option>
                                											                                        )
                                											                                    })}
                                                                                                            </select>
                                                                                                        </div>
                                                                                                        {this.state[item.instanceId + "_createAssetType_formSubmitError"] &&
                                                                                                            <div className="row m-t-30">
                                                                                                                <div className="col-md-12">
                                                                                                                    <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                                                                                        <button className="close" data-dismiss="alert"></button>
                                                                                                                        {this.state[item.instanceId + "_createAssetType_formSubmitError"]}
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        }
                                                                                                        <LaddaButton
                                                                                                            loading={this.state[item.instanceId + "_createAssetType_formloading"]}
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
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="card card-default m-b-0">
                                                                                            <div className="card-header " role="tab" id={item.instanceId + "_headingTwo"}>
                                                                                                <h4 className="card-title">
                                                                                                    <a className="collapsed" data-toggle="collapse" data-parent={"#" +  + "_accordion"} href={"#" + item.instanceId + "_collapseTwo"} aria-expanded="false" aria-controls={item.instanceId + "_collapseTwo"}>
                                                                                                    Issue Assets
                                                                                                    </a>
                                                                                                </h4>
                                                                                            </div>
                                                                                            <div id={item.instanceId + "_collapseTwo"} className="collapse" role="tabcard" aria-labelledby={item.instanceId + "_headingTwo"}>
                                                                                                <div className="card-block">
                                                                                                    <p><b>Issue Bulk Assets</b></p>
                                                                                                    <pre>
                                                                                                        <code>
                                                                                                            {`POST /networks/${item.instanceId}/assetType/bulk/issueAsset HTTP/1.1
Host: ${location.host}
Content-Type: application/json

{
	"fromAccount": "0x7076cde14830731cd75b4edb51a8edb17ebb1064",
	"toAccount": "0xee26f465b54eefc096db5f7e7cc538306aebe3ef",
	"units": 1000,
	"assetName": "usd"
}`}
                                                                                                        </code>
                                                                                                    </pre>
                                                                                                    <p><b>Issue Solo Asset</b></p>
                                                                                                    <pre>
                                                                                                        <code>
                                                                                                            {`POST /networks/${item.instanceId}/assetType/solo/issueAsset HTTP/1.1
Host: ${location.host}
Content-Type: application/json

{
	"fromAccount": "0x8d98bf772eea2a85538ecaa1394e8605bb4af3f6",
	"toAccount": "0x8d98bf772eea2a85538ecaa1394e8605bb4af3f6",
	"assetName": "cheques",
	"identifier": "hjsy23asasdd213asdiu2u",
	"data": {
		"accountNumber": "012776118765",
		"bankCode": "66715"
	}
}`}
                                                                                                        </code>
                                                                                                    </pre>
                                                                                                    <small>Change POST request body in above examples according to your's assets information</small>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="card card-default m-b-0">
                                                                                            <div className="card-header " role="tab" id={item.instanceId + "_headingThree"}>
                                                                                                <h4 className="card-title">
                                                                                                    <a className="collapsed" data-toggle="collapse" data-parent={"#" + item.instanceId + "_accordion"} href={"#" + item.instanceId + "_collapseThree"} aria-expanded="false" aria-controls={item.instanceId + "_collapseThree"}>
                                                                                                    Transfer Assets
                                                                                                    </a>
                                                                                                </h4>
                                                                                            </div>
                                                                                            <div id={item.instanceId + "_collapseThree"} className="collapse" role="tabcard" aria-labelledby={item.instanceId + "_headingThree"}>
                                                                                                <div className="card-block">
                                                                                                    <p><b>Transfer Bulk Asset</b></p>
                                                                                                    <pre>
                                                                                                        <code>
                                                                                                            {`POST /networks/${item.instanceId}/assetType/bulk/transferAsset HTTP/1.1
Host: ${location.host}
Content-Type: application/json

{
	"fromAccount": "0x8d98bf772eea2a85538ecaa1394e8605bb4af3f6",
	"toAccount": "0x8d98bf772eea2a85538ecaa1394e8605bb4af490",
	"units": 258,
	"assetName": "usd"
}`}
                                                                                                        </code>
                                                                                                    </pre>
                                                                                                    <p><b>Transfer Solo Asset</b></p>
                                                                                                    <pre>
                                                                                                        <code>
                                                                                                            {`POST /networks/ottpemjr/assetType/solo/transferAsset HTTP/1.1
Host: ${location.host}
Content-Type: application/json

{
	"fromAccount": "0x8d98bf772eea2a85538ecaa1394e8605bb4af3f6",
	"toAccount": "0x8d98bf772eea2a85538ecaa1394e8605bb4af3f9",
	"assetName": "cheques",
	"identifier": "hjsy23asasdd213asdiu2u"
}`}
                                                                                                        </code>
                                                                                                    </pre>
                                                                                                    <small>Change POST request body in above examples according to your's assets information</small>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="card card-default m-b-0">
                                                                                            <div className="card-header " role="tab" id={item.instanceId + "_headingFour"}>
                                                                                                <h4 className="card-title">
                                                                                                    <a className="collapsed" data-toggle="collapse" data-parent={"#" + item.instanceId + "_accordion"} href={"#" + item.instanceId + "_collapseFour"} aria-expanded="false" aria-controls={item.instanceId + "_collapseFour"}>
                                                                                                    Get Asset Info
                                                                                                    </a>
                                                                                                </h4>
                                                                                            </div>
                                                                                            <div id={item.instanceId + "_collapseFour"} className="collapse" role="tabcard" aria-labelledby={item.instanceId + "_headingFour"}>
                                                                                                <div className="card-block">
                                                                                                    <p><b>Get Bulk Asset Balance of an Account</b></p>
                                                                                                    <pre>
                                                                                                        <code>
                                                                                                            {`POST /networks/${item.instanceId}/assetType/bulk/getAssetInfo HTTP/1.1
Host: ${location.host}
Content-Type: application/json

{
	"account": "0x8d98bf772eea2a85538ecaa1394e8605bb4af490",
	"assetName": "usd"
}`}
                                                                                                        </code>
                                                                                                    </pre>
                                                                                                    <p><b>Get Solo Asset Info</b></p>
                                                                                                    <pre>
                                                                                                        <code>
                                                                                                            {`POST /networks/${item.instanceId}/assetType/solo/getAssetInfo HTTP/1.1
Host: ${location.host}
Content-Type: application/json

{
	"identifier": "hjsy23asasdd213asdiu2u",
	"assetName": "cheques",
	"extraData": ["accountNumber", "bankCode"]
}`}
                                                                                                        </code>
                                                                                                    </pre>
                                                                                                    <small>Change POST request body in above examples according to your's assets information</small>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="card card-default m-b-0">
                                                                                            <div className="card-header " role="tab" id={item.instanceId + "_headingFive"}>
                                                                                                <h4 className="card-title">
                                                                                                    <a className="collapsed" data-toggle="collapse" data-parent={"#" + item.instanceId + "_accordion"} href={"#" + item.instanceId + "_collapseFive"} aria-expanded="false" aria-controls={item.instanceId + "_collapseFive"}>
                                                                                                    Add/Update Solo Asset Meta Data
                                                                                                    </a>
                                                                                                </h4>
                                                                                            </div>
                                                                                            <div id={item.instanceId + "_collapseFive"} className="collapse" role="tabcard" aria-labelledby={item.instanceId + "_headingFive"}>
                                                                                                <div className="card-block">
                                                                                                    <pre>
                                                                                                        <code>
                                                                                                            {`POST /networks/${item.instanceId}/addUpdateAssetInfo HTTP/1.1
Host: ${location.host}
Content-Type: application/json

{
	"fromAccount": "0xcb02bb004c82cc7edc90d60d64c752729181e4cd",
	"assetName": "cheques",
	"identifier": "hjsy23asasdd213asdiu2u",
	"key": "accountNumber",
	"value": "23213"
}`}
                                                                                                        </code>
                                                                                                    </pre>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="card card-default m-b-0">
                                                                                            <div className="card-header " role="tab" id={item.instanceId + "_headingSix"}>
                                                                                                <h4 className="card-title">
                                                                                                    <a className="collapsed" data-toggle="collapse" data-parent={"#" + item.instanceId + "_accordion"} href={"#" + item.instanceId + "_collapseSix"} aria-expanded="false" aria-controls={item.instanceId + "_collapseSix"}>
                                                                                                    Close Solo Asset
                                                                                                    </a>
                                                                                                </h4>
                                                                                            </div>
                                                                                            <div id={item.instanceId + "_collapseSix"} className="collapse" role="tabcard" aria-labelledby={item.instanceId + "_headingSix"}>
                                                                                                <div className="card-block">
                                                                                                    <pre>
                                                                                                        <code>
                                                                                                            {`POST /networks/${item.instanceId}/closeAsset HTTP/1.1
Host: ${location.host}
Content-Type: application/json

{
	"fromAccount": "0xcb02bb004c82cc7edc90d60d64c752729181e4cd",
	"assetName": "cheques",
	"identifier": "hjsy23asasdd213asdiu2u"
}`}
                                                                                                        </code>
                                                                                                    </pre>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="col-lg-7">
                                                                                    <div className="table-responsive">
                                                                                        <table className="table table-hover" id="basicTable">
                                                                                            <thead>
                                                                                                <tr>
                                                                                                    <th style={{width: "25%"}}>Asset Name</th>
                                                                                                    <th style={{width: "25%"}}>Asset Type</th>
                                                                                                    <th style={{width: "25%"}}>Total Units</th>
                                                                                                    <th style={{width: "25%"}}>Issuer</th>
                                                                                                </tr>
                                                                                            </thead>
                                                                                            <tbody>
                                                                                                {item.assetsTypes.reverse().map((item, index) => {
                                                                                                    return (
                                                                                                        <tr key={item.uniqueIdentifier}>
                                                                                                            <td className="v-align-middle ">
                                                                                                                {item.assetName}
                                                                                                            </td>
                                                                                                            <td className="v-align-middle">
                                                                                                                {item.type}
                                                                                                            </td>
                                                                                                            <td className="v-align-middle">
                                                                                                                {item.units}
                                                                                                            </td>
                                                                                                            <td className="v-align-middle">
                                                                                                                {item.authorizedIssuer}
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    )
                                                                                                })}
                                                                                            </tbody>
                                                                                        </table>
                                                                                    </div>
                                                                                    <br />
                                                                                    <div className="card card-transparent ">
                                                                                        <ul className="nav nav-tabs nav-tabs-fillup" data-init-reponsive-tabs="dropdownfx">
                                                                                            <li className="nav-item">
                                                                                                <a href="#" className="active" data-toggle="tab" data-target="#slide1"><span>Assets Issed Events</span></a>
                                                                                            </li>
                                                                                            <li className="nav-item">
                                                                                                <a href="#" data-toggle="tab" data-target="#slide2"><span>Assets Transferred Events</span></a>
                                                                                            </li>
                                                                                            <li className="nav-item">
                                                                                                <a href="#" data-toggle="tab" data-target="#slide3"><span>Solo Assets events</span></a>
                                                                                            </li>
                                                                                        </ul>
                                                                                        <div className="tab-content p-l-0 p-r-0">
                                                                                            <div className="tab-pane slide-left active" id="slide1">
                                                                                                <div className="row column-seperation">
                                                                                                    <div className="col-lg-12 p-l-0 p-r-0">
                                                                                                        <form role="form">
                                                                                                            <div className="form-group">
                                                                                                                <label>Bulk Assets Issued Notification URL</label>
                                                                                                                <span className="help"> e.g. GET "?assetName=usd&units=1212&to=0x841..."</span>
                                                                                                                <input type="text" placeholder="http://domain.com/bulkAssetIssued" className="form-control" ref={(input) => {this[item.instanceId + "_updateAssetsIssuedEvents_bulkAssetsIssued"] = input}} />
                                                                                                            </div>
                                                                                                            <div className="form-group">
                                                                                                                <label>Solo Asset Issued Notification URL</label>
                                                                                                                <span className="help"> e.g. GET "?assetName=license&identifier=l231&to=0x841..."</span>
                                                                                                                <input type="text" placeholder="http://domain.com/soloAssetIssued" className="form-control" ref={(input) => {this[item.instanceId + "_updateAssetsIssuedEvents_soloAssetsIssued"] = input}} />
                                                                                                            </div>
                                                                                                            {this.state[item.instanceId + "_updateAssetsIssuedEvents_formSubmitError"] &&
                                                                                                                <div className="row m-t-30">
                                                                                                                    <div className="col-md-12">
                                                                                                                        <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                                                                                            <button className="close" data-dismiss="alert"></button>
                                                                                                                            {this.state[item.instanceId + "_updateAssetsIssuedEvents_formSubmitError"]}
                                                                                                                        </div>
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            }
                                                                                                            <p className="pull-right">
                                                                                                                <LaddaButton
                                                                                                                    loading={this.state[item.instanceId + "_updateAssetsIssuedEvents_formloading"]}
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
                                                                                            <div className="tab-pane slide-left" id="slide2">
                                                                                                <div className="row">
                                                                                                    <div className="col-lg-12 p-l-0 p-r-0">
                                                                                                        <form role="form">
                                                                                                            <div className="form-group">
                                                                                                                <label className="m-b-0">Bulk Assets Transferred Notification URL</label>
                                                                                                                <span className="help"> e.g. GET "?assetName=usd&units=1212&to=0x841...&from=0x841...&fromBalance=12&toBalance=233"</span>
                                                                                                                <input type="text" placeholder="http://domain.com/bulkAssetIssued" className="form-control" ref={(input) => {this[item.instanceId + "_updateAssetsTransferredEvents_bulkAssetsTransferred"] = input}} />
                                                                                                            </div>
                                                                                                            <div className="form-group">
                                                                                                                <label className="m-b-0">Solo Asset Transferred Notification URL</label>
                                                                                                                <span className="help"> e.g. GET "?assetName=license&identifier=l2362&to=0x841...&from=0x841..."</span>
                                                                                                                <input type="text" placeholder="http://domain.com/soloAssetIssued" className="form-control" ref={(input) => {this[item.instanceId + "_updateAssetsTransferredEvents_soloAssetTransferred"] = input}} />
                                                                                                            </div>
                                                                                                            {this.state[item.instanceId + "_updateAssetsIssuedEvents_formSubmitError"] &&
                                                                                                                <div className="row m-t-30">
                                                                                                                    <div className="col-md-12">
                                                                                                                        <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                                                                                            <button className="close" data-dismiss="alert"></button>
                                                                                                                            {this.state[item.instanceId + "_updateAssetsIssuedEvents_formSubmitError"]}
                                                                                                                        </div>
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            }
                                                                                                            <p className="pull-right">
                                                                                                                <LaddaButton
                                                                                                                    loading={this.state[item.instanceId + "_updateAssetsTransferredEvents_formloading"]}
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
                                                                                            <div className="tab-pane slide-left" id="slide3">
                                                                                                <div className="row">
                                                                                                    <div className="col-lg-12 p-l-0 p-r-0">
                                                                                                        <form role="form">
                                                                                                            <div className="form-group">
                                                                                                                <label className="m-b-0">Solo Asset's Meta Data Added or Updated Notification URL</label>
                                                                                                                <span className="help"> e.g. GET "?assetName=license&identifier=l2362&key=status&value=pending"</span>
                                                                                                                <input type="text" placeholder="http://domain.com/bulkAssetIssued" className="form-control" ref={(input) => {this[item.instanceId + "_updateSoloAssetsEvents_addOrUpdateMetaData"] = input}} />
                                                                                                            </div>
                                                                                                            <div className="form-group">
                                                                                                                <label className="">Solo Asset Transferred Notification URL</label>
                                                                                                                <span className="help"> e.g. GET "?assetName=license&identifier=l2362"</span>
                                                                                                                <input type="text" placeholder="http://domain.com/soloAssetIssued" className="form-control" ref={(input) => {this[item.instanceId + "_updateSoloAssetsEvents_closed"] = input}} />
                                                                                                            </div>
                                                                                                            {this.state[item.instanceId + "_updateSoloAssetsEvents_formSubmitError"] &&
                                                                                                                <div className="row m-t-30">
                                                                                                                    <div className="col-md-12">
                                                                                                                        <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                                                                                            <button className="close" data-dismiss="alert"></button>
                                                                                                                            {this.state[item.instanceId + "_updateSoloAssetsEvents_formSubmitError"]}
                                                                                                                        </div>
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            }
                                                                                                            <p className="pull-right">
                                                                                                                <LaddaButton
                                                                                                                    loading={this.state[item.instanceId + "_updateSoloAssetsEvents_formloading"]}
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
})(withRouter(Assets))
