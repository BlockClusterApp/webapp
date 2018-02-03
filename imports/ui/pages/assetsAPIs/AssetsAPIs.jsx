import React, {Component} from "react";
import {withTracker} from "meteor/react-meteor-data";
import {Networks} from "../../../collections/networks/networks.js"
import helpers from "../../../modules/helpers"
import ReactHtmlParser, { processNodes, convertNodeToElement, htmlparser2 } from "react-html-parser";
import {withRouter} from 'react-router-dom'
import LaddaButton, { S, SLIDE_UP } from "react-ladda";
import notifications from "../../../modules/notifications"

import "./AssetsAPIs.scss"

class AssetsAPIs extends Component {

    constructor() {
        super()
        this.state = {}
    }

    componentWillUnmount() {
        this.props.subscriptions.forEach((s) =>{
            s.stop();
        });
    }

	render(){
		return (
            <div className="assetsAPIs content">
                <div className="m-t-20 container-fluid container-fixed-lg bg-white">
                    <div className="row dashboard">
                        <div className="col-lg-12">
                            <div className="card card-transparent">
                                <div className="card-header ">
                                    <div className="card-title">Assets APIs
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
                                                                                    <div className="card-group horizontal" id={item.instanceId + "_accordion"} role="tablist" aria-multiselectable="true">
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
})(withRouter(AssetsAPIs))
