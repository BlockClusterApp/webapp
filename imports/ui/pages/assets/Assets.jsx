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

    createAssetType = (e, _id) => {
        e.preventDefault();

        this.setState({
            createAssetType_formSubmitError: '',
            createAssetType_formloading: true
        });

        Meteor.call("createAssetType", _id, this[_id + "_createAssetType_assetName"].value, this[_id + "_createAssetType_assetType"].value, this[_id + "_createAssetType_assetIssuer"].value, (error) => {
            if(!error) {
                this.setState({
                    [_id + "_createAssetType_formloading"]: false,
                    [_id + "_createAssetType_formSubmitError"]: ''
                });

                notifications.success("Transaction sent")
            } else {
                this.setState({
                    [_id + "_createAssetType_formloading"]: false,
                    [_id + "_createAssetType_formSubmitError"]: error.reason
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
            <div className="content">
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
                                                                                    <div className="card-group horizontal" id={item._id + "_accordion"} role="tablist" aria-multiselectable="true">
                                                                                        <div className="card card-default m-b-0">
                                                                                            <div className="card-header " role="tab" id={item._id + "_headingOne"}>
                                                                                                <h4 className="card-title">
                                                                                                    <a data-toggle="collapse" data-parent={"#" + item._id + "_accordion"} href={"#" + item._id + "_collapseOne"} aria-expanded="true" aria-controls={item._id + "_collapseOne"}>
                                                                                                    Add Asset Type
                                                                                                    </a>
                                                                                                </h4>
                                                                                            </div>
                                                                                            <div id={item._id + "_collapseOne"} className="collapse show" role="tabcard" aria-labelledby={item._id + "_headingOne"}>
                                                                                                <div className="card-block" onSubmit={(e) => {
                                                                                                        this.createAssetType(e, item._id);
                                                                                                    }}>
                                                                                                    <form role="form">
                                                                                                        <div className="form-group">
                                                                                                            <label>Asset Name</label>
                                                                                                            <span className="help"> e.g. "License"</span>
                                                                                                            <input type="text" className="form-control" required ref={(input) => {this[item._id + "_createAssetType_assetName"] = input}} />
                                                                                                        </div>
                                                                                                        <div className="form-group">
                                                                                                            <label>Asset Type</label>
                                                                                                            <span className="help"> e.g. "Bulk"</span>
                                                                                                            <select className="form-control" required ref={(input) => {this[item._id + "_createAssetType_assetType"] = input}}>
                                                                                                                <option key="bulk" value="bulk">Bulk</option>
                                                                                                                <option key="solo" value="solo">Solo</option>
                                                                                                            </select>
                                                                                                        </div>
                                                                                                        <div className="form-group">
                                                                                                            <label>Issuing Address</label>
                                                                                                            <span className="help"> e.g. "0x84eddb1..."</span>
                                                                                                            <select className="form-control" required ref={(input) => {this[item._id + "_createAssetType_assetIssuer"] = input}}>
                                                                                                                {item.accounts.map((address, addressIndex) => {
                                											                                        return (
                                                                                                                        <option key={addressIndex}>{address}</option>
                                											                                        )
                                											                                    })}
                                                                                                            </select>
                                                                                                        </div>
                                                                                                        {this.state[item._id + "_createAssetType_formSubmitError"] &&
                                                                                                            <div className="row m-t-30">
                                                                                                                <div className="col-md-12">
                                                                                                                    <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                                                                                        <button className="close" data-dismiss="alert"></button>
                                                                                                                        {this.state[item._id + "_createAssetType_formSubmitError"]}
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        }
                                                                                                        <LaddaButton
                                                                                                            loading={this.state[item._id + "_createAssetType_formloading"]}
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
                                                                                            <div className="card-header " role="tab" id={item._id + "_headingTwo"}>
                                                                                                <h4 className="card-title">
                                                                                                    <a className="collapsed" data-toggle="collapse" data-parent={"#" + item._id + "_accordion"} href={"#" + item._id + "_collapseTwo"} aria-expanded="false" aria-controls={item._id + "_collapseTwo"}>
                                                                                                    Issue Assets
                                                                                                    </a>
                                                                                                </h4>
                                                                                            </div>
                                                                                            <div id={item._id + "_collapseTwo"} className="collapse" role="tabcard" aria-labelledby={item._id + "_headingTwo"}>
                                                                                                <div className="card-block">
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="card card-default m-b-0">
                                                                                            <div className="card-header " role="tab" id={item._id + "_headingThree"}>
                                                                                                <h4 className="card-title">
                                                                                                    <a className="collapsed" data-toggle="collapse" data-parent={"#" + item._id + "_accordion"} href={"#" + item._id + "_collapseThree"} aria-expanded="false" aria-controls={item._id + "_collapseThree"}>
                                                                                                    Transfer Assets
                                                                                                    </a>
                                                                                                </h4>
                                                                                            </div>
                                                                                            <div id={item._id + "_collapseThree"} className="collapse" role="tabcard" aria-labelledby={item._id + "_headingThree"}>
                                                                                                <div className="card-block">
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="card card-default m-b-0">
                                                                                            <div className="card-header " role="tab" id={item._id + "_headingFour"}>
                                                                                                <h4 className="card-title">
                                                                                                    <a className="collapsed" data-toggle="collapse" data-parent={"#" + item._id + "_accordion"} href={"#" + item._id + "_collapseFour"} aria-expanded="false" aria-controls={item._id + "_collapseFour"}>
                                                                                                    Get Asset Info
                                                                                                    </a>
                                                                                                </h4>
                                                                                            </div>
                                                                                            <div id={item._id + "_collapseFour"} className="collapse" role="tabcard" aria-labelledby={item._id + "_headingFour"}>
                                                                                                <div className="card-block">
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="card card-default m-b-0">
                                                                                            <div className="card-header " role="tab" id={item._id + "_headingFive"}>
                                                                                                <h4 className="card-title">
                                                                                                    <a className="collapsed" data-toggle="collapse" data-parent={"#" + item._id + "_accordion"} href={"#" + item._id + "_collapseFive"} aria-expanded="false" aria-controls={item._id + "_collapseFive"}>
                                                                                                    Add/Update Solo Asset Meta Data
                                                                                                    </a>
                                                                                                </h4>
                                                                                            </div>
                                                                                            <div id={item._id + "_collapseFive"} className="collapse" role="tabcard" aria-labelledby={item._id + "_headingFive"}>
                                                                                                <div className="card-block">
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="card card-default m-b-0">
                                                                                            <div className="card-header " role="tab" id={item._id + "_headingSix"}>
                                                                                                <h4 className="card-title">
                                                                                                    <a className="collapsed" data-toggle="collapse" data-parent={"#" + item._id + "_accordion"} href={"#" + item._id + "_collapseSix"} aria-expanded="false" aria-controls={item._id + "_collapseSix"}>
                                                                                                    Close Solo Asset
                                                                                                    </a>
                                                                                                </h4>
                                                                                            </div>
                                                                                            <div id={item._id + "_collapseSix"} className="collapse" role="tabcard" aria-labelledby={item._id + "_headingSix"}>
                                                                                                <div className="card-block">
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
                                                                                                                <input type="text" placeholder="http://domain.com/bulkAssetIssued" className="form-control" ref={(input) => {this[item._id + "_updateAssetsIssuedEvents_bulkAssetsIssued"] = input}} />
                                                                                                            </div>
                                                                                                            <div className="form-group">
                                                                                                                <label>Solo Asset Issued Notification URL</label>
                                                                                                                <span className="help"> e.g. GET "?assetName=license&identifier=l231&to=0x841..."</span>
                                                                                                                <input type="text" placeholder="http://domain.com/soloAssetIssued" className="form-control" ref={(input) => {this[item._id + "_updateAssetsIssuedEvents_soloAssetsIssued"] = input}} />
                                                                                                            </div>
                                                                                                            {this.state[item._id + "_updateAssetsIssuedEvents_formSubmitError"] &&
                                                                                                                <div className="row m-t-30">
                                                                                                                    <div className="col-md-12">
                                                                                                                        <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                                                                                            <button className="close" data-dismiss="alert"></button>
                                                                                                                            {this.state[item._id + "_updateAssetsIssuedEvents_formSubmitError"]}
                                                                                                                        </div>
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            }
                                                                                                            <p className="pull-right">
                                                                                                                <LaddaButton
                                                                                                                    loading={this.state[item._id + "_updateAssetsIssuedEvents_formloading"]}
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
                                                                                                                <input type="text" placeholder="http://domain.com/bulkAssetIssued" className="form-control" ref={(input) => {this[item._id + "_updateAssetsTransferredEvents_bulkAssetsTransferred"] = input}} />
                                                                                                            </div>
                                                                                                            <div className="form-group">
                                                                                                                <label className="m-b-0">Solo Asset Transferred Notification URL</label>
                                                                                                                <span className="help"> e.g. GET "?assetName=license&identifier=l2362&to=0x841...&from=0x841..."</span>
                                                                                                                <input type="text" placeholder="http://domain.com/soloAssetIssued" className="form-control" ref={(input) => {this[item._id + "_updateAssetsTransferredEvents_soloAssetTransferred"] = input}} />
                                                                                                            </div>
                                                                                                            {this.state[item._id + "_updateAssetsIssuedEvents_formSubmitError"] &&
                                                                                                                <div className="row m-t-30">
                                                                                                                    <div className="col-md-12">
                                                                                                                        <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                                                                                            <button className="close" data-dismiss="alert"></button>
                                                                                                                            {this.state[item._id + "_updateAssetsIssuedEvents_formSubmitError"]}
                                                                                                                        </div>
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            }
                                                                                                            <p className="pull-right">
                                                                                                                <LaddaButton
                                                                                                                    loading={this.state[item._id + "_updateAssetsTransferredEvents_formloading"]}
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
                                                                                                                <input type="text" placeholder="http://domain.com/bulkAssetIssued" className="form-control" ref={(input) => {this[item._id + "_updateSoloAssetsEvents_addOrUpdateMetaData"] = input}} />
                                                                                                            </div>
                                                                                                            <div className="form-group">
                                                                                                                <label className="">Solo Asset Transferred Notification URL</label>
                                                                                                                <span className="help"> e.g. GET "?assetName=license&identifier=l2362"</span>
                                                                                                                <input type="text" placeholder="http://domain.com/soloAssetIssued" className="form-control" ref={(input) => {this[item._id + "_updateSoloAssetsEvents_closed"] = input}} />
                                                                                                            </div>
                                                                                                            {this.state[item._id + "_updateSoloAssetsEvents_formSubmitError"] &&
                                                                                                                <div className="row m-t-30">
                                                                                                                    <div className="col-md-12">
                                                                                                                        <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                                                                                            <button className="close" data-dismiss="alert"></button>
                                                                                                                            {this.state[item._id + "_updateSoloAssetsEvents_formSubmitError"]}
                                                                                                                        </div>
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            }
                                                                                                            <p className="pull-right">
                                                                                                                <LaddaButton
                                                                                                                    loading={this.state[item._id + "_updateSoloAssetsEvents_formloading"]}
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
