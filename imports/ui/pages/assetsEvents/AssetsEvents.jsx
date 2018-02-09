import React, {Component} from "react";
import {withTracker} from "meteor/react-meteor-data";
import {Networks} from "../../../collections/networks/networks.js"
import helpers from "../../../modules/helpers"
import ReactHtmlParser, { processNodes, convertNodeToElement, htmlparser2 } from "react-html-parser";
import {withRouter} from 'react-router-dom'
import LaddaButton, { S, SLIDE_UP } from "react-ladda";
import notifications from "../../../modules/notifications"

import "./AssetsEvents.scss"

class AssetsEvents extends Component {

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
            <div className="assets content">
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
                                                                                                <a href="#" className="active" data-toggle="tab" data-target={"#" + item.instanceId + "_slide1"}><span>Assets Issed Events</span></a>
                                                                                            </li>
                                                                                            <li className="nav-item">
                                                                                                <a href="#" data-toggle="tab" data-target={"#" + item.instanceId + "_slide2"}><span>Assets Transferred Events</span></a>
                                                                                            </li>
                                                                                            <li className="nav-item">
                                                                                                <a href="#" data-toggle="tab" data-target={"#" + item.instanceId + "_slide3"}><span>Solo Assets events</span></a>
                                                                                            </li>
                                                                                        </ul>
                                                                                        <div className="tab-content p-l-0 p-r-0">
                                                                                            <div className="tab-pane slide-left active" id={item.instanceId + "_slide1"}>
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
                                                                                            <div className="tab-pane slide-left" id={item.instanceId + "_slide2"}>
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
                                                                                            <div className="tab-pane slide-left" id={item.instanceId + "_slide3"}>
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
})(withRouter(AssetsEvents))
