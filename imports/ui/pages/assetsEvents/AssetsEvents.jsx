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

    assetTypeCreatedEvent(e, instanceId) {
        e.preventDefault();

        this.setState({
            [instanceId + "_assetTypeCreatedEvents_formloading"]: true,
            [instanceId + "_assetTypeCreatedEvents_formSubmitError"]: ""
        });

        Meteor.call("updateAssetTypeCreatedNotifyURL", instanceId, this[instanceId + "_assetTypeCreatedEvents"].value, (error) => {
            if(error) {
                this.setState({
                    [instanceId + "_assetTypeCreatedEvents_formloading"]: false,
                    [instanceId + "_assetTypeCreatedEvents_formSubmitError"]: "An error occured. Please try again."
                });
            } else {
                this.setState({
                    [instanceId + "_assetTypeCreatedEvents_formloading"]: false,
                    [instanceId + "_assetTypeCreatedEvents_formSubmitError"]: ""
                });

                notifications.success("Updated successfully");
            }
        })
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
                                <div className="card-block">
                                        {this.props.network.length !== 0 &&
                                            <div>
                                                {this.props.network[0].assetsContractAddress === '' &&
                                                    <div>
                                                        Please deploy smart contract
                                                    </div>
                                                }
                                                {(this.props.network[0].assetsContractAddress !== undefined && this.props.network[0].assetsContractAddress !== '') &&

                                                    <div className="card card-transparent">
                                                        <ul className="nav nav-tabs nav-tabs-fillup" data-init-reponsive-tabs="dropdownfx">
                                                            <li className="nav-item">
                                                                <a href="#" className="active" data-toggle="tab" data-target={"#" + this.props.network[0].instanceId + "_slide0"}><span>Asset Type Created Events</span></a>
                                                            </li>
                                                            <li className="nav-item">
                                                                <a href="#" data-toggle="tab" data-target={"#" + this.props.network[0].instanceId + "_slide1"}><span>Assets Issed Events</span></a>
                                                            </li>
                                                            <li className="nav-item">
                                                                <a href="#" data-toggle="tab" data-target={"#" + this.props.network[0].instanceId + "_slide2"}><span>Assets Transferred Events</span></a>
                                                            </li>
                                                            <li className="nav-item">
                                                                <a href="#" data-toggle="tab" data-target={"#" + this.props.network[0].instanceId + "_slide3"}><span>Solo Assets events</span></a>
                                                            </li>
                                                        </ul>
                                                        <div className="tab-content p-l-0 p-r-0">
                                                            <div className="tab-pane slide-left active" id={this.props.network[0].instanceId + "_slide0"}>
                                                                <form role="form" onSubmit={(e) => {
                                                                        this.assetTypeCreatedEvent(e, this.props.network[0].instanceId);
                                                                    }}>
                                                                    <div className="form-group">
                                                                        <label>Asset Type Created Notification URL</label>
                                                                        <span className="help"> e.g. GET "?assetType=bulk&assetName=usd"</span>
                                                                        <input type="text" placeholder="http://domain.com/assetTypeCreated" className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_assetTypeCreatedEvents"] = input}} />
                                                                    </div>
                                                                    {this.state[this.props.network[0].instanceId + "_assetTypeCreatedEvents_formSubmitError"] &&
                                                                        <div className="row m-t-30">
                                                                            <div className="col-md-12">
                                                                                <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                                                    <button className="close" data-dismiss="alert"></button>
                                                                                    {this.state[this.props.network[0].instanceId + "_assetTypeCreatedEvents_formSubmitError"]}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    }
                                                                    <p className="pull-right">
                                                                        <LaddaButton
                                                                            loading={this.state[this.props.network[0].instanceId + "_assetTypeCreatedEvents_formloading"]}
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
                                                            <div className="tab-pane slide-left" id={this.props.network[0].instanceId + "_slide1"}>
                                                                <div className="row column-seperation">
                                                                    <div className="col-lg-12 p-l-0 p-r-0">
                                                                        <form role="form">
                                                                            <div className="form-group">
                                                                                <label>Bulk Assets Issued Notification URL</label>
                                                                                <span className="help"> e.g. GET "?assetName=usd&units=1212&to=0x841..."</span>
                                                                                <input type="text" placeholder="http://domain.com/bulkAssetIssued" className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_updateAssetsIssuedEvents_bulkAssetsIssued"] = input}} />
                                                                            </div>
                                                                            <div className="form-group">
                                                                                <label>Solo Asset Issued Notification URL</label>
                                                                                <span className="help"> e.g. GET "?assetName=license&identifier=l231&to=0x841..."</span>
                                                                                <input type="text" placeholder="http://domain.com/soloAssetIssued" className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_updateAssetsIssuedEvents_soloAssetsIssued"] = input}} />
                                                                            </div>
                                                                            {this.state[this.props.network[0].instanceId + "_updateAssetsIssuedEvents_formSubmitError"] &&
                                                                                <div className="row m-t-30">
                                                                                    <div className="col-md-12">
                                                                                        <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                                                            <button className="close" data-dismiss="alert"></button>
                                                                                            {this.state[this.props.network[0].instanceId + "_updateAssetsIssuedEvents_formSubmitError"]}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            }
                                                                            <p className="pull-right">
                                                                                <LaddaButton
                                                                                    loading={this.state[this.props.network[0].instanceId + "_updateAssetsIssuedEvents_formloading"]}
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
                                                            <div className="tab-pane slide-left" id={this.props.network[0].instanceId + "_slide2"}>
                                                                <div className="row">
                                                                    <div className="col-lg-12 p-l-0 p-r-0">
                                                                        <form role="form">
                                                                            <div className="form-group">
                                                                                <label className="m-b-0">Bulk Assets Transferred Notification URL</label>
                                                                                <span className="help"> e.g. GET "?assetName=usd&units=1212&to=0x841...&from=0x841...&fromBalance=12&toBalance=233"</span>
                                                                                <input type="text" placeholder="http://domain.com/bulkAssetIssued" className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_updateAssetsTransferredEvents_bulkAssetsTransferred"] = input}} />
                                                                            </div>
                                                                            <div className="form-group">
                                                                                <label className="m-b-0">Solo Asset Transferred Notification URL</label>
                                                                                <span className="help"> e.g. GET "?assetName=license&identifier=l2362&to=0x841...&from=0x841..."</span>
                                                                                <input type="text" placeholder="http://domain.com/soloAssetIssued" className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_updateAssetsTransferredEvents_soloAssetTransferred"] = input}} />
                                                                            </div>
                                                                            {this.state[this.props.network[0].instanceId + "_updateAssetsIssuedEvents_formSubmitError"] &&
                                                                                <div className="row m-t-30">
                                                                                    <div className="col-md-12">
                                                                                        <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                                                            <button className="close" data-dismiss="alert"></button>
                                                                                            {this.state[this.props.network[0].instanceId + "_updateAssetsIssuedEvents_formSubmitError"]}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            }
                                                                            <p className="pull-right">
                                                                                <LaddaButton
                                                                                    loading={this.state[this.props.network[0].instanceId + "_updateAssetsTransferredEvents_formloading"]}
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
                                                            <div className="tab-pane slide-left" id={this.props.network[0].instanceId + "_slide3"}>
                                                                <div className="row">
                                                                    <div className="col-lg-12 p-l-0 p-r-0">
                                                                        <form role="form">
                                                                            <div className="form-group">
                                                                                <label className="m-b-0">Solo Asset's Meta Data Added or Updated Notification URL</label>
                                                                                <span className="help"> e.g. GET "?assetName=license&identifier=l2362&key=status&value=pending"</span>
                                                                                <input type="text" placeholder="http://domain.com/bulkAssetIssued" className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_updateSoloAssetsEvents_addOrUpdateMetaData"] = input}} />
                                                                            </div>
                                                                            <div className="form-group">
                                                                                <label className="">Solo Asset Closed Notification URL</label>
                                                                                <span className="help"> e.g. GET "?assetName=license&identifier=l2362"</span>
                                                                                <input type="text" placeholder="http://domain.com/soloAssetIssued" className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_updateSoloAssetsEvents_closed"] = input}} />
                                                                            </div>
                                                                            {this.state[this.props.network[0].instanceId + "_updateSoloAssetsEvents_formSubmitError"] &&
                                                                                <div className="row m-t-30">
                                                                                    <div className="col-md-12">
                                                                                        <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                                                            <button className="close" data-dismiss="alert"></button>
                                                                                            {this.state[this.props.network[0].instanceId + "_updateSoloAssetsEvents_formSubmitError"]}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            }
                                                                            <p className="pull-right">
                                                                                <LaddaButton
                                                                                    loading={this.state[this.props.network[0].instanceId + "_updateSoloAssetsEvents_formloading"]}
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
        network: Networks.find({_id: props.match.params.id}).fetch(),
        subscriptions: [Meteor.subscribe("networks", {
        	onReady: function (){
        		if(Networks.find({_id: props.match.params.id}).fetch().length !== 1) {
        			props.history.push("/app/networks");
        		}
        	}
        }), Meteor.subscribe("utilities")]
    }
})(withRouter(AssetsEvents))
