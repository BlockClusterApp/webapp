import React, {Component} from "react";
import {withTracker} from "meteor/react-meteor-data";
import {Networks} from "../../../collections/networks/networks.js"
import helpers from "../../../modules/helpers"
import ReactHtmlParser, { processNodes, convertNodeToElement, htmlparser2 } from "react-html-parser";
import {withRouter} from 'react-router-dom'
import LaddaButton, { S, SLIDE_UP } from "react-ladda";
import notifications from "../../../modules/notifications"

import "./CreateAssetType.scss"

class CreateAssetType extends Component {

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
            <div className="createAssetType content">
                <div className="m-t-20 container-fluid container-fixed-lg bg-white">
                    <div className="row dashboard">
                        <div className="col-lg-12">
                            <div className="card card-transparent">
                                <div className="card-header ">
                                    <div className="card-title">Create Asset Type
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
})(withRouter(CreateAssetType))
