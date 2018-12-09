import React, {Component} from "react";
import {withTracker} from "meteor/react-meteor-data";
import {Networks} from "../../../collections/networks/networks.js"
import helpers from "../../../modules/helpers"
import ReactHtmlParser, { processNodes, convertNodeToElement, htmlparser2 } from "react-html-parser";
import {withRouter} from 'react-router-dom'
import LaddaButton, { S, SLIDE_UP } from "react-ladda";
import notifications from "../../../modules/notifications"
var CodeMirror = require('react-codemirror');
import {Link} from "react-router-dom"
import Config from '../../../modules/config/client'

import "./AssetsSearch.scss"
import "/node_modules/codemirror/lib/codemirror.css"
import "/node_modules/codemirror/theme/mdn-like.css"
import "/node_modules/codemirror/theme/ttcn.css"
import "/node_modules/codemirror/mode/javascript/javascript.js"

class AssetsSearch extends Component {

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

                <div className="m-t-20 container-fluid container-fixed-lg bg-white">
                    <div className="row dashboard">
                        <div className="col-lg-12">
                            <div className="card card-transparent">
                                <div className="card-header ">
                                    <div className="card-title">
                                        <Link to={"/app/networks/" + this.props.match.params.id}> Control Panel <i className="fa fa-angle-right"></i></Link> Assets Search
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
                                                        <div className="row">
                                                            <div className="col-xl-6">
                                                                <h4>Query Solo Assets</h4>
                                                                <form role="form" onSubmit={(e) => {
                                                                        this.querySoloAssets(e, this.props.network[0].instanceId);
                                                                    }}>
                                                                    <div className="form-group">
                                                                        <label>JSON Query</label>
                                                                        <CodeMirror value={this.state.defaultJSONQuery} onChange={(newCode) => {this.updateQuery(newCode, this.props.network[0].instanceId + "_querySoloAssets_query")}} options={{readOnly: false, autofocus: true, indentUnit: 4, theme: "ttcn", mode: {name: "javascript", json: true}}} required />
                                                                    </div>
                                                                    {this.state[this.props.network[0].instanceId + "_querySoloAssets_formSubmitError"] &&
                                                                        <div className="row m-t-30">
                                                                            <div className="col-md-12">
                                                                                <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                                                    <button className="close" data-dismiss="alert"></button>
                                                                                    {this.state[this.props.network[0].instanceId + "_querySoloAssets_formSubmitError"]}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    }
                                                                    <p className="pull-right">
                                                                        <LaddaButton
                                                                            loading={this.state[this.props.network[0].instanceId + "_querySoloAssets_formloading"]}
                                                                            data-size={S}
                                                                            data-style={SLIDE_UP}
                                                                            data-spinner-size={30}
                                                                            data-spinner-lines={12}
                                                                            className="btn btn-success m-t-10"
                                                                            type="submit"
                                                                        >
                                                                            <i className="fa fa-search" aria-hidden="true"></i>&nbsp;&nbsp;Search
                                                                        </LaddaButton>
                                                                    </p>
                                                                </form>
                                                            </div>
                                                            <div className="col-xl-6">
                                                                <h4>Query Result</h4>
                                                                <div className="form-group">
                                                                    <label>Array</label>
                                                                    <CodeMirror value={this.state[this.props.network[0].instanceId + "_querySoloAssets_queryResult"]} options={{readOnly: true, autofocus: true, indentUnit: 4, theme: "mdn-like", mode: {name: "javascript", json: true}}} />
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
        subscriptions: [Meteor.subscribe("networks", {
        	onReady: function (){
        		if(Networks.find({instanceId: props.match.params.id, active: true}).fetch().length !== 1) {
        			props.history.push("/app/networks");
        		}
        	}
        })]
    }
})(withRouter(AssetsSearch))
