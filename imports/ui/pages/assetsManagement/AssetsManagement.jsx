import React, {Component} from "react";
import {withTracker} from "meteor/react-meteor-data";
import {Networks} from "../../../collections/networks/networks.js"
import helpers from "../../../modules/helpers"
import ReactHtmlParser, { processNodes, convertNodeToElement, htmlparser2 } from "react-html-parser";
import {withRouter} from 'react-router-dom'
import LaddaButton, { S, SLIDE_UP } from "react-ladda";
import notifications from "../../../modules/notifications"
var CodeMirror = require('react-codemirror');
import {AssetTypes} from "../../../collections/assetTypes/assetTypes.js"
import {Link} from "react-router-dom"
import {BCAccounts} from "../../../collections/bcAccounts/bcAccounts.js"

import "./AssetsManagement.scss"
import "/node_modules/codemirror/lib/codemirror.css"
import "/node_modules/codemirror/theme/mdn-like.css"
import "/node_modules/codemirror/theme/ttcn.css"
import "/node_modules/codemirror/mode/javascript/javascript.js"

class AssetsManagement extends Component {

    constructor() {
        super()
        this.state = {
            defaultJSONQuery: JSON.stringify(JSON.parse('{"assetName":"license","uniqueIdentifier":"1234","company":"blockcluster"}'), undefined, 4)
        }
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

        Meteor.call(
            "issueBulkAssets",
            instanceId,
            this[instanceId + "_addBulkAsset_assetName"].value,
            this[instanceId + "_addBulkAsset_fromAddress"].value,
            this[instanceId + "_addBulkAsset_toAddress"].value,
            this[instanceId + "_addBulkAsset_units"].value,
            (error) => {
                if(error) {
                    this.setState({
                        [instanceId + "_addBulkAsset_formSubmitError"]: error.reason,
                        [instanceId + "_addBulkAsset_formloading"]: false
                    });
                } else {
                    this.setState({
                        [instanceId + "_addBulkAsset_formSubmitError"]: '',
                        [instanceId + "_addBulkAsset_formloading"]: false
                    });

                    notifications.success("Transaction sent");
                }
            }
        )
    }

    issueSoloAsset(e, instanceId) {
        e.preventDefault();

        Meteor.call(
            "issueSoloAsset",
            instanceId,
            this[instanceId + "_addSoloAsset_assetName"].value,
            this[instanceId + "_addSoloAsset_fromAddress"].value,
            this[instanceId + "_addSoloAsset_toAddress"].value,
            this[instanceId + "_addSoloAsset_identifier"].value,
            (error) => {
                if(error) {
                    this.setState({
                        [instanceId + "_addSoloAsset_formSubmitError"]: error.reason,
                        [instanceId + "_addSoloAsset_formloading"]: false
                    });
                } else {
                    this.setState({
                        [instanceId + "_addSoloAsset_formSubmitError"]: "",
                        [instanceId + "_addSoloAsset_formloading"]: false
                    });

                    notifications.success("Transaction sent");
                }
            }
        )
    }

    transferBulkAssets(e, instanceId) {
        e.preventDefault();

        this.setState({
            [instanceId + "_transferBulkAsset_formSubmitError"]: '',
            [instanceId + "_transferBulkAsset_formloading"]: true
        });

        Meteor.call(
            "transferBulkAssets",
            instanceId,
            this[instanceId + "_transferBulkAsset_assetName"].value,
            this[instanceId + "_transferBulkAsset_fromAddress"].value,
            this[instanceId + "_transferBulkAsset_toAddress"].value,
            this[instanceId + "_transferBulkAsset_units"].value,
            (error) => {
                if(error) {
                    this.setState({
                        [instanceId + "_transferBulkAsset_formSubmitError"]: error.reason,
                        [instanceId + "_transferBulkAsset_formloading"]: false
                    });
                } else {
                    this.setState({
                        [instanceId + "_transferBulkAsset_formSubmitError"]: '',
                        [instanceId + "_transferBulkAsset_formloading"]: false
                    });

                    notifications.success("Transaction sent");
                }
            }
        )
    }

    transferSoloAsset(e, instanceId) {
        e.preventDefault();

        this.setState({
            [instanceId + "_transferSoloAsset_formSubmitError"]: '',
            [instanceId + "_transferSoloAsset_formloading"]: true
        });

        Meteor.call(
            "transferSoloAsset",
            instanceId,
            this[instanceId + "_transferSoloAsset_assetName"].value,
            this[instanceId + "_transferSoloAsset_fromAddress"].value,
            this[instanceId + "_transferSoloAsset_toAddress"].value,
            this[instanceId + "_transferSoloAsset_identifier"].value,
            (error) => {
                if(error) {
                    this.setState({
                        [instanceId + "_transferSoloAsset_formSubmitError"]: error.reason,
                        [instanceId + "_transferSoloAsset_formloading"]: false
                    });
                } else {
                    this.setState({
                        [instanceId + "_transferSoloAsset_formSubmitError"]: '',
                        [instanceId + "_transferSoloAsset_formloading"]: false
                    });

                    notifications.success("Transaction sent");
                }
            }
        )
    }

    getBulkAssetBalance(e, instanceId) {
        e.preventDefault();

        this.setState({
            [instanceId + "_getInfoBulkAsset_formloading"]: true,
            [instanceId + "_getInfoBulkAsset_formSubmitError"]: ""
        });

        Meteor.call(
            "getBulkAssetBalance",
            instanceId,
            this[instanceId + "_getInfoBulkAsset_assetName"].value,
            this[instanceId + "_getInfoBulkAsset_address"].value,
            (error, units) => {
                if(error) {
                    this.setState({
                        [instanceId + "_getInfoBulkAsset_formloading"]: false,
                        [instanceId + "_getInfoBulkAsset_formSubmitError"]: error.reason
                    });
                } else {
                    this.setState({
                        [instanceId + "_getInfoBulkAsset_formloading"]: false,
                        [instanceId + "_getInfoBulkAsset_formSubmitError"]: '',
                        bulkAssetBalance: units
                    });

                    $('#modalSlideLeft_bulkAssetBalance').modal('show')
                }
            }
        )
    }

    getSoloAssetInfo(e, instanceId) {
        e.preventDefault();

        this.setState({
            [instanceId + "_getInfoSoloAsset_formloading"]: true,
            [instanceId + "_getInfoSoloAsset_formSubmitError"]: ""
        });

        Meteor.call(
            "getSoloAssetInfo",
            instanceId,
            this[instanceId + "_getInfoSoloAsset_assetName"].value,
            this[instanceId + "_getInfoSoloAsset_identifier"].value,
            (error, data) => {
                if(error) {
                    this.setState({
                        [instanceId + "_getInfoSoloAsset_formloading"]: false,
                        [instanceId + "_getInfoSoloAsset_formSubmitError"]: error.reason
                    });
                } else {
                    data.details["identifier"] = this[instanceId + "_getInfoSoloAsset_identifier"].value;
                    this.setState({
                        [instanceId + "_getInfoSoloAsset_formloading"]: false,
                        [instanceId + "_getInfoBulkAsset_formSubmitError"]: '',
                        data: data
                    });
                    $('#modalSlideLeft_soloAssetInfo').modal('show')
                }
            }
        )
    }

    addUpdateSoloAssetInfo(e, instanceId) {
        e.preventDefault();

        this.setState({
            [instanceId + "_updateSoloAssetInfo_formloading"]: true,
            [instanceId + "_updateSoloAssetInfo_formSubmitError"]: ''
        });

        Meteor.call(
            "addUpdateSoloAssetInfo",
            instanceId,
            this[instanceId + "_updateSoloAssetInfo_assetName"].value,
            this[instanceId + "_updateSoloAssetInfo_fromAddress"].value,
            this[instanceId + "_updateSoloAssetInfo_identifier"].value,
            this[instanceId + "_updateSoloAssetInfo_key"].value,
            this[instanceId + "_updateSoloAssetInfo_value"].value,
            (error) => {
                if(error) {
                    this.setState({
                        [instanceId + "_updateSoloAssetInfo_formloading"]: false,
                        [instanceId + "_updateSoloAssetInfo_formSubmitError"]: error.reason
                    });
                } else {
                    this.setState({
                        [instanceId + "_updateSoloAssetInfo_formloading"]: false,
                        [instanceId + "_updateSoloAssetInfo_formSubmitError"]: ""
                    });

                    notifications.success("Transaction sent");
                }
            }
        )
    }

    closeSoloAsset(e, instanceId) {
        e.preventDefault();

        this.setState({
            [instanceId + "_closeAsset_formloading"]: true,
            [instanceId + "_closeAsset_formSubmitError"]: ''
        });

        Meteor.call(
            "closeAsset",
            instanceId,
            this[instanceId + "_closeAsset_assetName"].value,
            this[instanceId + "_closeAsset_fromAddress"].value,
            this[instanceId + "_closeAsset_identifier"].value,
            (error) => {
                if(error) {
                    this.setState({
                        [instanceId + "_closeAsset_formloading"]: false,
                        [instanceId + "_closeAsset_formSubmitError"]: error.reason
                    });
                } else {
                    this.setState({
                        [instanceId + "_closeAsset_formloading"]: false,
                        [instanceId + "_closeAsset_formSubmitError"]: ''
                    });

                    notifications.success("Transaction sent");
                }
            }
        )
    }

    updateQuery(newCode, property) {
        this[property] = newCode;
    }

    querySoloAssets(e, instanceId) {
        e.preventDefault();

        this.setState({
            [instanceId + "_querySoloAssets_formloading"]: true,
            [instanceId + "_querySoloAssets_formSubmitError"]: ''
        });

        Meteor.call(
            "searchSoloAssets",
            instanceId,
            (this[instanceId + "_querySoloAssets_query"] ? this[instanceId + "_querySoloAssets_query"] : JSON.stringify(JSON.parse('{"assetName":"license","uniqueIdentifier":"1234","company":"blockcluster"}'))),
            (error, result) => {
                if(error) {
                    this.setState({
                        [instanceId + "_querySoloAssets_formloading"]: false,
                        [instanceId + "_querySoloAssets_formSubmitError"]: error.reason
                    });
                } else {
                    this.setState({
                        [instanceId + "_querySoloAssets_formloading"]: false,
                        [instanceId + "_querySoloAssets_formSubmitError"]: '',
                        [instanceId + "_querySoloAssets_queryResult"]: JSON.stringify(result, undefined, 4)
                    });
                }
            }
        )
    }

    subscribeAsset(e, instanceId) {
        e.preventDefault();

        this.setState({
            [instanceId + "_subscribeAsset_formloading"]: true,
            [instanceId + "_subscribeAsset_formSubmitError"]: ''
        });

        Meteor.call("subscribeAssetType", instanceId, this[instanceId + "_subscribeAsset_name"].value, (error) => {
            if(!error) {
                this.setState({
                    [instanceId + "_subscribeAsset_formloading"]: false,
                    [instanceId + "_subscribeAsset_formSubmitError"]: ''
                });

                notifications.success("Subscribed")
            } else {
                this.setState({
                    [instanceId + "_subscribeAsset_formloading"]: false,
                    [instanceId + "_subscribeAsset_formSubmitError"]: error.reason
                })
            }
        });
    }

    unsubscribeAsset = (e, instanceId) => {
        e.preventDefault();

        this.setState({
            [instanceId + "_unsubscribeAsset_formloading"]: true,
            [instanceId + "_subscribeAsset_formSubmitError"]: ''
        });

        Meteor.call("unsubscribeAssetType", instanceId, this[instanceId + "_subscribeAsset_name"].value, (error) => {
            if(!error) {
                this.setState({
                    [instanceId + "_unsubscribeAsset_formloading"]: false,
                    [instanceId + "_subscribeAsset_formSubmitError"]: ''
                });

                notifications.success("Unsubscribed")
            } else {
                this.setState({
                    [instanceId + "_unsubscribeAsset_formloading"]: false,
                    [instanceId + "_subscribeAsset_formSubmitError"]: error.reason
                })
            }
        });
    }

	render(){
		return (
            <div className="assetsManagement content">
                <div className="modal fade slide-right" id="modalSlideLeft_bulkAssetBalance" tabIndex="-1" role="dialog" aria-hidden="true">
                    <div className="modal-dialog modal-sm">
                        <div className="modal-content-wrapper">
                            <div className="modal-content">
                                <button type="button" className="close" data-dismiss="modal" aria-hidden="true"><i className="pg-close fs-14"></i>
                                </button>
                                <div className="container-xs-height full-height">
                                    <div className="row-xs-height">
                                        <div className="modal-body col-xs-height col-middle text-center   ">
                                            <h5 className="text-primary ">Balance: <span className="semi-bold">{this.state.bulkAssetBalance}</span></h5>
                                            <br />
                                            <button type="button" className="btn btn-primary btn-block" data-dismiss="modal">Ok</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {this.state.data &&
                    <div className="modal fade slide-right" id="modalSlideLeft_soloAssetInfo" tabIndex="-1" role="dialog" aria-hidden="true">
                        <div className="modal-dialog modal-sm">
                            <div className="modal-content-wrapper">
                                <div className="modal-content">
                                    <button type="button" className="close" data-dismiss="modal" aria-hidden="true"><i className="pg-close fs-14"></i>
                                    </button>
                                    <div className="container-xs-height full-height">
                                        <div className="row-xs-height">
                                            <div className="modal-body col-xs-height col-middle text-center   ">
                                                <h5 className="text-primary ">Asset: <span className="semi-bold">{this.state.data.details.identifier}</span></h5>
                                                <br />
                                                <form role="form" className="modal-assetInfo">
                                                    <div className="form-group-attached" style={{"textAlign":"left"}}>
                                                        <div className="row">
                                                            <div className="col-md-12">
                                                                <div className="form-group form-group-default">
                                                                    <label>Is Closed?</label>
                                                                    <input type="email" className="form-control dark-disabled" readOnly value={this.state.data.details.isClosed} />
                                                                </div>
                                                            </div>
                                                            <div className="col-md-12">
                                                                <div className="form-group form-group-default">
                                                                    <label>Owner</label>
                                                                    <input type="email" className="form-control dark-disabled" readOnly value={this.state.data.details.owner} />
                                                                </div>
                                                            </div>
                                                            {Object.keys(this.state.data.details.extraData).map((key, index) => {
                                                                return (
                                                                    <div key={key} className="col-md-12">
                                                                        {key != '' &&
                                                                            <div className="form-group form-group-default">
                                                                                <label>{key}</label>
                                                                                <input type="email" className="form-control dark-disabled" readOnly value={this.state.data.details.extraData[key]} />
                                                                            </div>
                                                                        }
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                </form>
                                                <br />
                                                <button type="button" className="btn btn-primary btn-block" data-dismiss="modal">Ok</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                }


                {/*<div className="modal fade slide-up disable-scroll" id="modalSlideUp" tabIndex="-1" role="dialog" aria-hidden="false">
                    <div className="modal-dialog ">
                        <div className="modal-content-wrapper">
                            <div className="modal-content">
                                <div className="modal-header clearfix text-left">
                                    <button type="button" className="close" data-dismiss="modal" aria-hidden="true"><i className="pg-close fs-14"></i>
                                    </button>
                                    <h5>Payment <span className="semi-bold">Information</span></h5>
                                    <p className="p-b-10">We need payment information inorder to process your order</p>
                                </div>
                                <div className="modal-body">

                                    <div className="row">
                                        <div className="col-md-8">
                                            <div className="p-t-20 clearfix p-l-10 p-r-10">
                                                <div className="pull-left">
                                                    <p className="bold font-montserrat text-uppercase">TOTAL</p>
                                                </div>
                                                <div className="pull-right">
                                                    <p className="bold font-montserrat text-uppercase">$20.00</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-4 m-t-10 sm-m-t-10">
                                            <button type="button" className="btn btn-primary btn-block m-t-5">Pay Now</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>*/}

                <div className="m-t-20 container-fluid container-fixed-lg bg-white">
                    <div className="row dashboard">
                        <div className="col-lg-12">
                            <div className="card card-transparent">
                                <div className="card-header ">
                                    <div className="card-title">
                                        <Link to={"/app/networks/" + this.props.match.params.id}> Control Panel <i className="fa fa-angle-right"></i></Link> Assets Management
                                    </div>
                                </div>
                                <div className="card-block">
                                    <div className="row">
                                        <div className="col-xl-12">
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

                                                                <ul className="nav nav-tabs nav-tabs-fillup" data-init-reponsive-tabs="dropdownfx">
                                                                    <li className="nav-item">
                                                                        <a href="#" className="active" data-toggle="tab" data-target={"#" + this.props.network[0].instanceId + "_slide1"}><span>Issue Assets</span></a>
                                                                    </li>
                                                                    <li className="nav-item">
                                                                        <a href="#" data-toggle="tab" data-target={"#" + this.props.network[0].instanceId + "_slide2"}><span>Transfer Assets</span></a>
                                                                    </li>
                                                                    <li className="nav-item">
                                                                        <a href="#" data-toggle="tab" data-target={"#" + this.props.network[0].instanceId + "_slide3"}><span>Get Asset Info</span></a>
                                                                    </li>
                                                                    <li className="nav-item">
                                                                        <a href="#" data-toggle="tab" data-target={"#" + this.props.network[0].instanceId + "_slide4"}><span>Add/Update Solo Asset Info</span></a>
                                                                    </li>
                                                                    <li className="nav-item">
                                                                        <a href="#" data-toggle="tab" data-target={"#" + this.props.network[0].instanceId + "_slide5"}><span>Close Solo Asset</span></a>
                                                                    </li>
                                                                    <li className="nav-item">
                                                                        <a href="#" data-toggle="tab" data-target={"#" + this.props.network[0].instanceId + "_slide6"}><span>Subscribe/Unsubscribe</span></a>
                                                                    </li>
                                                                </ul>
                                                                <div className="tab-content p-l-0 p-r-0">
                                                                    <div className="tab-pane slide-left active" id={this.props.network[0].instanceId + "_slide1"}>
                                                                        <div className="row column-seperation">
                                                                            <div className="col-lg-6">
                                                                                <h4>Issue Bulk Assets</h4>
                                                                                <form role="form" onSubmit={(e) => {
                                                                                        this.issueBulkAsset(e, this.props.network[0].instanceId);
                                                                                    }}>
                                                                                    <div className="form-group">
                                                                                        <label>Asset Name</label>
                                                                                        <select className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_addBulkAsset_assetName"] = input}} required>
                                                                                            {this.props.assetTypes.map((item) => {
                                                                                                if(item.type === "bulk") {
                                                                                                    return <option key={item.assetName} value={item.assetName}>{item.assetName}</option>
                                                                                                }
                                                                                            })}
                                                                                        </select>
                                                                                    </div>
                                                                                    <div className="form-group">
                                                                                        <label>From Account</label>
                                                                                        <select className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_addBulkAsset_fromAddress"] = input}} required>
                                                                                            {this.props.accounts.map((item) => {
                                                                                                return <option key={item.address} value={item.address}>{item.address}</option>
                                                                                            })}
                                                                                        </select>
                                                                                    </div>
                                                                                    <div className="form-group">
                                                                                        <label>To Account</label>
                                                                                        <input type="text" className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_addBulkAsset_toAddress"] = input}} required />
                                                                                    </div>
                                                                                    <div className="form-group">
                                                                                        <label>Units</label>
                                                                                        <input type="float" className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_addBulkAsset_units"] = input}} required />
                                                                                    </div>
                                                                                    {this.state[this.props.network[0].instanceId + "_addBulkAsset_formSubmitError"] &&
                                                                                        <div className="row m-t-30">
                                                                                            <div className="col-md-12">
                                                                                                <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                                                                    <button className="close" data-dismiss="alert"></button>
                                                                                                    {this.state[this.props.network[0].instanceId + "_addBulkAsset_formSubmitError"]}
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    }
                                                                                    <p className="pull-right">
                                                                                        <LaddaButton
                                                                                            loading={this.state[this.props.network[0].instanceId + "_addBulkAsset_formloading"]}
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
                                                                                        this.issueSoloAsset(e, this.props.network[0].instanceId);
                                                                                    }}>
                                                                                    <div className="form-group">
                                                                                        <label>Asset Name</label>
                                                                                        <select className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_addSoloAsset_assetName"] = input}} required>
                                                                                            {this.props.assetTypes.map((item) => {
                                                                                                if(item.type === "solo") {
                                                                                                    return <option key={item.assetName} value={item.assetName}>{item.assetName}</option>
                                                                                                }
                                                                                            })}
                                                                                        </select>
                                                                                    </div>
                                                                                    <div className="form-group">
                                                                                        <label>From Account</label>
                                                                                        <select className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_addSoloAsset_fromAddress"] = input}} required>
                                                                                            {this.props.accounts.map((item) => {
                                                                                                return <option key={item.address} value={item.address}>{item.address}</option>
                                                                                            })}
                                                                                        </select>
                                                                                    </div>
                                                                                    <div className="form-group">
                                                                                        <label>To Account</label>
                                                                                        <input type="text" className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_addSoloAsset_toAddress"] = input}} required />
                                                                                    </div>
                                                                                    <div className="form-group">
                                                                                        <label>Identifier</label>
                                                                                        <input type="text" className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_addSoloAsset_identifier"] = input}} required />
                                                                                    </div>
                                                                                    {this.state[this.props.network[0].instanceId + "_addSoloAsset_formSubmitError"] &&
                                                                                        <div className="row m-t-30">
                                                                                            <div className="col-md-12">
                                                                                                <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                                                                    <button className="close" data-dismiss="alert"></button>
                                                                                                    {this.state[this.props.network[0].instanceId + "_addBulkAsset_formSubmitError"]}
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    }
                                                                                    <p className="pull-right">
                                                                                        <LaddaButton
                                                                                            loading={this.state[this.props.network[0].instanceId + "_addSoloAsset_formloading"]}
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
                                                                    <div className="tab-pane slide-left" id={this.props.network[0].instanceId + "_slide2"}>
                                                                        <div className="row">
                                                                            <div className="col-lg-6">
                                                                                <h4>Transfer Bulk Assets</h4>
                                                                                <form role="form" onSubmit={(e) => {
                                                                                        this.transferBulkAssets(e, this.props.network[0].instanceId);
                                                                                    }}>
                                                                                    <div className="form-group">
                                                                                        <label>Asset Name</label>
                                                                                        <select className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_transferBulkAsset_assetName"] = input}} required>
                                                                                            {this.props.assetTypes.map((item) => {
                                                                                                if(item.type === "bulk") {
                                                                                                    return <option key={item.assetName} value={item.assetName}>{item.assetName}</option>
                                                                                                }
                                                                                            })}
                                                                                        </select>
                                                                                    </div>
                                                                                    <div className="form-group">
                                                                                        <label>From Account</label>
                                                                                        <select className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_transferBulkAsset_fromAddress"] = input}} required>
                                                                                            {this.props.accounts.map((item) => {
                                                                                                return <option key={item.address} value={item.address}>{item.address}</option>
                                                                                            })}
                                                                                        </select>
                                                                                    </div>
                                                                                    <div className="form-group">
                                                                                        <label>To Account</label>
                                                                                        <input type="text" className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_transferBulkAsset_toAddress"] = input}} required />
                                                                                    </div>
                                                                                    <div className="form-group">
                                                                                        <label>Units</label>
                                                                                        <input type="float" className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_transferBulkAsset_units"] = input}} required />
                                                                                    </div>
                                                                                    {this.state[this.props.network[0].instanceId + "_transferBulkAsset_formSubmitError"] &&
                                                                                        <div className="row m-t-30">
                                                                                            <div className="col-md-12">
                                                                                                <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                                                                    <button className="close" data-dismiss="alert"></button>
                                                                                                    {this.state[this.props.network[0].instanceId + "_transferBulkAsset_formSubmitError"]}
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    }
                                                                                    <p className="pull-right">
                                                                                        <LaddaButton
                                                                                            loading={this.state[this.props.network[0].instanceId + "_transferBulkAsset_formloading"]}
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
                                                                                        this.transferSoloAsset(e, this.props.network[0].instanceId);
                                                                                    }}>
                                                                                    <div className="form-group">
                                                                                        <label>Asset Name</label>
                                                                                        <select className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_transferSoloAsset_assetName"] = input}} required>
                                                                                            {this.props.assetTypes.map((item) => {
                                                                                                if(item.type === "solo") {
                                                                                                    return <option key={item.assetName} value={item.assetName}>{item.assetName}</option>
                                                                                                }
                                                                                            })}
                                                                                        </select>
                                                                                    </div>
                                                                                    <div className="form-group">
                                                                                        <label>From Account</label>
                                                                                        <select className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_transferSoloAsset_fromAddress"] = input}} required>
                                                                                            {this.props.accounts.map((item) => {
                                                                                                return <option key={item.address} value={item.address}>{item.address}</option>
                                                                                            })}
                                                                                        </select>
                                                                                    </div>
                                                                                    <div className="form-group">
                                                                                        <label>To Account</label>
                                                                                        <input type="text" className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_transferSoloAsset_toAddress"] = input}} required />
                                                                                    </div>
                                                                                    <div className="form-group">
                                                                                        <label>Identifier</label>
                                                                                        <input type="text" className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_transferSoloAsset_identifier"] = input}} required />
                                                                                    </div>
                                                                                    {this.state[this.props.network[0].instanceId + "_transferSoloAsset_formSubmitError"] &&
                                                                                        <div className="row m-t-30">
                                                                                            <div className="col-md-12">
                                                                                                <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                                                                    <button className="close" data-dismiss="alert"></button>
                                                                                                    {this.state[this.props.network[0].instanceId + "_transferSoloAsset_formSubmitError"]}
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    }
                                                                                    <p className="pull-right">
                                                                                        <LaddaButton
                                                                                            loading={this.state[this.props.network[0].instanceId + "_transferSoloAsset_formloading"]}
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
                                                                        </div>
                                                                    </div>
                                                                    <div className="tab-pane slide-left" id={this.props.network[0].instanceId + "_slide3"}>
                                                                        <div className="row">
                                                                            <div className="col-lg-6">
                                                                                <h4>Get Bulk Asset Balance</h4>
                                                                                <form role="form" onSubmit={(e) => {
                                                                                        this.getBulkAssetBalance(e, this.props.network[0].instanceId);
                                                                                    }}>
                                                                                    <div className="form-group">
                                                                                        <label>Asset Name</label>
                                                                                        <select className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_getInfoBulkAsset_assetName"] = input}} required>
                                                                                            {this.props.assetTypes.map((item) => {
                                                                                                if(item.type === "bulk") {
                                                                                                    return <option key={item.assetName} value={item.assetName}>{item.assetName}</option>
                                                                                                }
                                                                                            })}
                                                                                        </select>
                                                                                    </div>
                                                                                    <div className="form-group">
                                                                                        <label>Account</label>
                                                                                        <select className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_getInfoBulkAsset_address"] = input}} required>
                                                                                            {this.props.accounts.map((item) => {
                                                                                                return <option key={item.address} value={item.address}>{item.address}</option>
                                                                                            })}
                                                                                        </select>
                                                                                    </div>
                                                                                    {this.state[this.props.network[0].instanceId + "_getInfoBulkAsset_formSubmitError"] &&
                                                                                        <div className="row m-t-30">
                                                                                            <div className="col-md-12">
                                                                                                <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                                                                    <button className="close" data-dismiss="alert"></button>
                                                                                                    {this.state[this.props.network[0].instanceId + "_getInfoBulkAsset_formSubmitError"]}
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    }
                                                                                    <p className="pull-right">
                                                                                        <LaddaButton
                                                                                            loading={this.state[this.props.network[0].instanceId + "_getInfoBulkAsset_formloading"]}
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
                                                                                        this.getSoloAssetInfo(e, this.props.network[0].instanceId);
                                                                                    }}>
                                                                                    <div className="form-group">
                                                                                        <label>Asset Name</label>
                                                                                        <select className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_getInfoSoloAsset_assetName"] = input}} required>
                                                                                            {this.props.assetTypes.map((item) => {
                                                                                                if(item.type === "solo") {
                                                                                                    return <option key={item.assetName} value={item.assetName}>{item.assetName}</option>
                                                                                                }
                                                                                            })}
                                                                                        </select>
                                                                                    </div>
                                                                                    <div className="form-group">
                                                                                        <label>Identifier</label>
                                                                                        <input type="text" className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_getInfoSoloAsset_identifier"] = input}} required />
                                                                                    </div>
                                                                                    {this.state[this.props.network[0].instanceId + "_getInfoSoloAsset_formSubmitError"] &&
                                                                                        <div className="row m-t-30">
                                                                                            <div className="col-md-12">
                                                                                                <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                                                                    <button className="close" data-dismiss="alert"></button>
                                                                                                    {this.state[this.props.network[0].instanceId + "_getInfoSoloAsset_formSubmitError"]}
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    }
                                                                                    <p className="pull-right">
                                                                                        <LaddaButton
                                                                                            loading={this.state[this.props.network[0].instanceId + "_getInfoSoloAsset_formloading"]}
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
                                                                    <div className="tab-pane slide-left" id={this.props.network[0].instanceId + "_slide4"}>
                                                                        <div className="row">
                                                                            <div className="col-lg-12">
                                                                                <h4>Add/Update Meta Data</h4>
                                                                                <form role="form" onSubmit={(e) => {
                                                                                        this.addUpdateSoloAssetInfo(e, this.props.network[0].instanceId);
                                                                                    }}>
                                                                                    <div className="form-group">
                                                                                        <label>Asset Name</label>
                                                                                        <select className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_updateSoloAssetInfo_assetName"] = input}} required>
                                                                                            {this.props.assetTypes.map((item) => {
                                                                                                if(item.type === "solo") {
                                                                                                    return <option key={item.assetName} value={item.assetName}>{item.assetName}</option>
                                                                                                }
                                                                                            })}
                                                                                        </select>
                                                                                    </div>
                                                                                    <div className="form-group">
                                                                                        <label>From Account</label>
                                                                                        <select className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_updateSoloAssetInfo_fromAddress"] = input}} required>
                                                                                            {this.props.accounts.map((item) => {
                                                                                                return <option key={item.address} value={item.address}>{item.address}</option>
                                                                                            })}
                                                                                        </select>
                                                                                    </div>
                                                                                    <div className="form-group">
                                                                                        <label>Identifier</label>
                                                                                        <input type="text" className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_updateSoloAssetInfo_identifier"] = input}} required />
                                                                                    </div>
                                                                                    <div className="form-group">
                                                                                        <label>Key</label>
                                                                                        <input type="text" className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_updateSoloAssetInfo_key"] = input}} required />
                                                                                    </div>
                                                                                    <div className="form-group">
                                                                                        <label>Value</label>
                                                                                        <input type="text" className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_updateSoloAssetInfo_value"] = input}} required />
                                                                                    </div>
                                                                                    {this.state[this.props.network[0].instanceId + "_updateSoloAssetInfo_formSubmitError"] &&
                                                                                        <div className="row m-t-30">
                                                                                            <div className="col-md-12">
                                                                                                <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                                                                    <button className="close" data-dismiss="alert"></button>
                                                                                                    {this.state[this.props.network[0].instanceId + "_updateSoloAssetInfo_formSubmitError"]}
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    }
                                                                                    <p className="pull-right">
                                                                                        <LaddaButton
                                                                                            loading={this.state[this.props.network[0].instanceId + "_updateSoloAssetInfo_formloading"]}
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
                                                                    <div className="tab-pane slide-left" id={this.props.network[0].instanceId + "_slide5"}>
                                                                        <div className="row">
                                                                            <div className="col-lg-12">
                                                                                <h4>Close Asset</h4>
                                                                                <form role="form" onSubmit={(e) => {
                                                                                        this.closeSoloAsset(e, this.props.network[0].instanceId);
                                                                                    }}>
                                                                                    <div className="form-group">
                                                                                        <label>Asset Name</label>
                                                                                        <select className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_closeAsset_assetName"] = input}} required>
                                                                                            {this.props.assetTypes.map((item) => {
                                                                                                if(item.type === "solo") {
                                                                                                    return <option key={item.assetName} value={item.assetName}>{item.assetName}</option>
                                                                                                }
                                                                                            })}
                                                                                        </select>
                                                                                    </div>
                                                                                    <div className="form-group">
                                                                                        <label>From Account</label>
                                                                                        <select className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_closeAsset_fromAddress"] = input}} required>
                                                                                            {this.props.accounts.map((item) => {
                                                                                                return <option key={item.address} value={item.address}>{item.address}</option>
                                                                                            })}
                                                                                        </select>
                                                                                    </div>
                                                                                    <div className="form-group">
                                                                                        <label>Identifier</label>
                                                                                        <input type="text" className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_closeAsset_identifier"] = input}} required />
                                                                                    </div>
                                                                                    {this.state[this.props.network[0].instanceId + "_closeAsset_formSubmitError"] &&
                                                                                        <div className="row m-t-30">
                                                                                            <div className="col-md-12">
                                                                                                <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                                                                    <button className="close" data-dismiss="alert"></button>
                                                                                                    {this.state[this.props.network[0].instanceId + "_closeAsset_formSubmitError"]}
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    }
                                                                                    <p className="pull-right">
                                                                                        <LaddaButton
                                                                                            loading={this.state[this.props.network[0].instanceId + "_closeAsset_formloading"]}
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
                                                                    <div className="tab-pane slide-left" id={this.props.network[0].instanceId + "_slide6"}>
                                                                        <div className="row">
                                                                            <div className="col-lg-12">
                                                                                <h4>Subscribe or Unsubscribe</h4>
                                                                                <div className="row column-seperation">
                                                                                    <div className="col-lg-6">
                                                                                        <div className="table-responsive">
                                                                                            <table className="table table-hover" id="basicTable">
                                                                                                <thead>
                                                                                                    <tr>
                                                                                                        <th>Subscribed Asset Types</th>
                                                                                                    </tr>
                                                                                                </thead>
                                                                                                <tbody>
                                                                                                    {this.props.assetTypes.map((item) => {
                                                                                                        if(item.subscribed === true) {
                                                                                                            return (
                                                                                                                <tr key={item.assetName}>
                                                                                                                    <td className="v-align-middle ">
                                                                                                                        {item.assetName}
                                                                                                                    </td>
                                                                                                                </tr>
                                                                                                            )
                                                                                                        }
                                                                                                    })}
                                                                                                </tbody>
                                                                                            </table>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="col-lg-6">
                                                                                        <form role="form">
                                                                                            <div className="form-group">
                                                                                                <label>Asset Types Name</label>
                                                                                                <span className="help"> e.g. "License"</span>
                                                                                                <select className="form-control" ref={(input) => {this[this.props.network[0].instanceId + "_subscribeAsset_name"] = input}} required>
                                                                                                    {this.props.assetTypes.map((item) => {
                                                                                                        return <option key={item.assetName} value={item.assetName}>{item.assetName}</option>
                                                                                                    })}
                                                                                                </select>
                                                                                            </div>

                                                                                            {this.state[this.props.network[0].instanceId + "_subscribeAsset_formSubmitError"] &&
                                                                                                <div className="row m-t-30">
                                                                                                    <div className="col-md-12">
                                                                                                        <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                                                                            <button className="close" data-dismiss="alert"></button>
                                                                                                            {this.state[this.props.network[0].instanceId + "_subscribeAsset_formSubmitError"]}
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>
                                                                                            }
                                                                                            <LaddaButton
                                                                                                loading={this.state[this.props.network[0].instanceId + "_subscribeAsset_formloading"]}
                                                                                                data-size={S}
                                                                                                data-style={SLIDE_UP}
                                                                                                data-spinner-size={30}
                                                                                                data-spinner-lines={12}
                                                                                                className="btn btn-success m-t-10"
                                                                                                type="button"
                                                                                                onClick={(e) => {
                                                                                                    this.subscribeAsset(e, this.props.network[0].instanceId);
                                                                                                }}
                                                                                            >
                                                                                                <i className="fa fa-download" aria-hidden="true"></i>&nbsp;&nbsp;Subscribe
                                                                                            </LaddaButton>
                                                                                            &nbsp;&nbsp;
                                                                                            <LaddaButton
                                                                                                loading={this.state[this.props.network[0].instanceId + "_unsubscribeAsset_formloading"]}
                                                                                                data-size={S}
                                                                                                data-style={SLIDE_UP}
                                                                                                data-spinner-size={30}
                                                                                                data-spinner-lines={12}
                                                                                                className="btn btn-success m-t-10"
                                                                                                type="button"
                                                                                                onClick={(e) => {
                                                                                                    this.unsubscribeAsset(e, this.props.network[0].instanceId);
                                                                                                }}
                                                                                            >
                                                                                                <i className="fa fa-ban" aria-hidden="true"></i>&nbsp;&nbsp;Unsubscribe
                                                                                            </LaddaButton>
                                                                                        </form>
                                                                                    </div>
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
                </div>
            </div>
		)
	}
}

export default withTracker((props) => {
    return {
        network: Networks.find({instanceId: props.match.params.id}).fetch(),
        assetTypes: AssetTypes.find({instanceId: props.match.params.id}).fetch(),
        accounts: BCAccounts.find({instanceId: props.match.params.id}).fetch(),
        subscriptions: [Meteor.subscribe("networks", {
        	onReady: function (){
        		if(Networks.find({instanceId: props.match.params.id}).fetch().length !== 1) {
        			props.history.push("/app/networks");
        		}
        	}
        }), Meteor.subscribe("assetTypes", props.match.params.id), Meteor.subscribe("bcAccounts", props.match.params.id)]
    }
})(withRouter(AssetsManagement))
