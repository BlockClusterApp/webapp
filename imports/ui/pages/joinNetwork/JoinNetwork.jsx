import React, {Component} from "react";
import LaddaButton, { S, SLIDE_UP } from "react-ladda";
import { withRouter } from 'react-router-dom'

import "./JoinNetwork.scss"

class JoinNetwork extends Component {
    constructor() {
        super()
        
        this.state = { 
            formSubmitError: "",
            totalENodes: [""],
            totalConstellationNodes: [""]
        };
    }

    onENodeChange = (index, event) => {
        this.state.totalENodes[index] = event.target.value;
        this.setState({
            totalENodes: this.state.totalENodes
        })
    }

    addENodeURL = (e) => {
        e.preventDefault()
        this.state.totalENodes[this.state.totalENodes.length] = "";
        this.setState({
            totalENodes: this.state.totalENodes
        })
    }

    deleteENodeURL = (index) => {
        if(this.state.totalENodes.length > 1) {
            this.state.totalENodes.splice(index, 1);
            this.setState({
                totalENodes: this.state.totalENodes
            })
        }
    }

    onConstellationChange = (index, event) => {
        this.state.totalConstellationNodes[index] = event.target.value;
        this.setState({
            totalConstellationNodes: this.state.totalConstellationNodes
        })
    }

    addConstellationURL = (e) => {
        e.preventDefault()
        this.state.totalConstellationNodes[this.state.totalConstellationNodes.length] = "";
        this.setState({
            totalConstellationNodes: this.state.totalConstellationNodes
        })
    }

    deleteConstellationURL = (index) => {
        if(this.state.totalConstellationNodes.length > 1) {
            this.state.totalConstellationNodes.splice(index, 1);
            this.setState({
                totalConstellationNodes: this.state.totalConstellationNodes
            })
        }
    }

    onSubmit = (e) => {
        e.preventDefault()

        let file = this.genesisFile.files[0];
        let reader = new FileReader();
        reader.readAsText(file, "UTF-8");
        reader.onload = (evt) => {
            var fileContent = evt.target.result;

            this.setState({
                formSubmitError: ''
            });

            Meteor.call("joinNetwork", this.networkName.value, this.nodeType.value, fileContent, this.state.totalENodes, this.state.totalConstellationNodes, (error) => {
                if(!error) {
                    this.setState({
                        formSubmitError: ''
                    });

                    this.props.history.push("/app");

                    $("body").pgNotification({
                        style: "circle",
                        message: "Initializing node",
                        position: "bottom-right",
                        timeout: 5000,
                        type: "success",
                        thumbnail: '<img width="40" height="40" style="display: inline-block;" src="/assets/img/icons/profile.png" alt="">'
                    }).show();
                } else {
                    this.setState({
                        formSubmitError: error.reason,
                    })
                }
            });
        }

        reader.onerror = () => {
            this.setState({
                formSubmitError: 'An error occured while reading genesis file content'
            });
        }
    }   

	render(){
		return (
            <div className="row joinNetwork">
                <div className="col-md-5">
                    <div className="card card-transparent">
                        <div className="card-header ">
                            <div className="card-title">Join Network
                            </div>
                        </div>
                        <div className="card-block">
                            <h3>
                                Join a Quorum Network that uses IBFT Consensus
                            </h3>
                            <p>This is a private network you will be joining. Technically you will be a validator or peer.</p>
                            <ul>
                                <li><i>Maximum block time</i>: is the maximum time to wait for a new block</li>
                                <li><i>Minimum block time</i>: is the minimum time to wait for a new block</li>
                                <li><i>Block pause time</i>: is the pause time when zero transactions in previous block. values should be larger than minimum block time</li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="col-md-7">
                    <div className="card card-transparent">
                        <div className="card-block">
                            <form id="form-project" role="form" onSubmit={this.onSubmit} autoComplete="off">
                                <p>Basic Information</p>
                                <div className="form-group-attached">
                                    <div className="row clearfix">
                                        <div className="col-md-6">
                                            <div className="form-group form-group-default required">
                                                <label>Network name</label>
                                                <input type="text" className="form-control" name="projectName" required ref={(input) => {this.networkName = input;}}  />
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="form-group form-group-default required">
                                                <label>Node Type</label>
                                                <select className="form-control" ref={(input) => {this.nodeType = input;}}>
                                                    <option value="authority">Validator</option>
                                                    <option value="peer">Peer</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="row clearfix">
                                        <div className="col-md-6">
                                            <div className="form-group form-group-default ">
                                                <label>Constellation</label>
                                                <input type="text" className="form-control" name="firstName" required disabled value="Enabled" />
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="form-group form-group-default ">
                                                <label>Gas Price</label>
                                                <input type="text" className="form-control" name="firstName" required disabled value="0" />
                                            </div>
                                            
                                        </div>
                                    </div>
                                </div>
                                <p className="m-t-10">Advanced Information</p>
                                <div className="form-group-attached">
                                    <div className="row">
                                        <div className="col-md-4">
                                            <div className="form-group form-group-default input-group">
                                                <div className="form-input-group">
                                                    <label>Maximum Block Time</label>
                                                    <input type="text" className="form-control usd" defaultValue="10000" required disabled />
                                                </div>
                                                <div className="input-group-addon">
                                                    MS
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="form-group form-group-default input-group">
                                                <div className="form-input-group">
                                                    <label>Minimum</label>
                                                    <input type="text" className="form-control usd" required defaultValue="1" disabled />
                                                </div>
                                                <div className="input-group-addon">
                                                    S
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="form-group form-group-default input-group">
                                                <div className="form-input-group">
                                                    <label>Pause Time for 0 Txns</label>
                                                    <input type="text" className="form-control usd" required defaultValue="2" disabled />
                                                </div>
                                                <div className="input-group-addon">
                                                    S
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="row clearfix">
                                        <div className="col-md-12">
                                            <div className="form-group form-group-default ">
                                                <label>Genesis Block JSON File</label>
                                                <input type="file" className="form-control file-button" name="firstName" required ref={(input) => {this.genesisFile = input;}} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <p className="m-t-10">Add other Quorum nodes enode URLs</p>
                                <div className="form-group-attached">
                                    {
                                        (() => {
                                            return (
                                                <div className="row">
                                                    {this.state.totalENodes.map((item, index) => {
                                                        return (
                                                            <div className="col-md-12" key={index}>
                                                                <div className="form-group form-group-default input-group">
                                                                    <div className="form-input-group">
                                                                        <label>ENode URL</label>
                                                                        <input type="text" className="form-control usd" required placeholder="enode://pubkey@ip:port" onChange={(event) => {this.onENodeChange(index, event)}} value={item} />
                                                                    </div>
                                                                    <div className="input-group-addon delete-button" onClick={() => {this.deleteENodeURL(index)}}>
                                                                        <i className="fa fa-trash" aria-hidden="true"></i>
                                                                    </div>
                                                                </div>
                                                            </div>               
                                                        )
                                                    })}
                                                    <div className="col-md-12 clearfix">
                                                        <button className="btn btn-complete btn-xs m-t-10 pull-right add-url" onClick={this.addENodeURL}>&nbsp;<i className="fa fa-plus" aria-hidden="true"></i>&nbsp;</button>
                                                    </div>
                                                </div>
                                            )
                                        })()
                                    }
                                </div>
                                <p className="m-t-10">Add other Constellation nodes URLs</p>
                                <div className="form-group-attached">
                                    {
                                        (() => {
                                            return (
                                                <div className="row">
                                                    {this.state.totalConstellationNodes.map((item, index) => {
                                                        return (
                                                            <div className="col-md-12" key={index}>
                                                                <div className="form-group form-group-default input-group">
                                                                    <div className="form-input-group">
                                                                        <label>URL</label>
                                                                        <input type="text" className="form-control usd" required placeholder="ip:port" onChange={(event) => {this.onConstellationChange(index, event)}} value={item} value={item} />
                                                                    </div>
                                                                    <div className="input-group-addon delete-button" onClick={() => {this.deleteConstellationURL(index)}}>
                                                                        <i className="fa fa-trash" aria-hidden="true"></i>
                                                                    </div>
                                                                </div>
                                                            </div>               
                                                        )
                                                    })}
                                                    <div className="col-md-12 clearfix">
                                                        <button className="btn btn-complete btn-xs m-t-10 pull-right add-url" onClick={this.addConstellationURL}>&nbsp;<i className="fa fa-plus" aria-hidden="true"></i>&nbsp;</button>
                                                    </div>
                                                </div>
                                            )
                                        })()
                                    }
                                </div>
                                <br />
                                {this.state.formSubmitError != '' &&
                                    <div className="row">
                                        <div className="col-md-12">
                                            <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                <button className="close" data-dismiss="alert"></button>
                                                {this.state.formSubmitError}
                                            </div>
                                        </div>
                                    </div>
                                }
                                
                                <button className="btn btn-success"><i className="fa fa-plus-circle" aria-hidden="true"></i>&nbsp;&nbsp;Create</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
		)
	}
}

export default withRouter(JoinNetwork)