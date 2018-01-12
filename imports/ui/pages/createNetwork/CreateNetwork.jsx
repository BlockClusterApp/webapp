import React, {Component} from "react";
import LaddaButton, { S, SLIDE_UP } from "react-ladda";
import { withRouter } from 'react-router-dom'
import notifications from "../../../modules/notifications"

class CreateNetwork extends Component {
    constructor() {
        super()
        
        this.state = { 
            formSubmitError: ""
        };
    }

    onSubmit = (e) => {
        e.preventDefault()

        this.setState({
            formSubmitError: ''
        });

        Meteor.call("createNetwork", this.networkName.value, (error) => {
            if(!error) {
                this.setState({
                    formSubmitError: ''
                });

                this.props.history.push("/app");
                notifications.success("Initializing node")
            } else {
                this.setState({
                    formSubmitError: error.reason,
                })
            }
        });
    }   

	render(){
		return (
            <div className="content ">
                <div className="m-t-20 container-fluid container-fixed-lg bg-white">
                    <div className="row">
                        <div className="col-md-5">
                            <div className="card card-transparent">
                                <div className="card-header ">
                                    <div className="card-title">Create Network
                                    </div>
                                </div>
                                <div className="card-block">
                                    <h3>
                                        Create Your Own Quorum Network Using IBFT Consensus
                                    </h3>
                                    <p>This is a private network you will be creating. Technically it will create a single node network.</p>
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
                                                    <div className="form-group form-group-default ">
                                                        <label>Node Type</label>
                                                        <input type="text" className="form-control" name="firstName" required disabled value="Validator" />
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
                                        
                                        <button type="submit" className="btn btn-success"><i className="fa fa-plus-circle" aria-hidden="true"></i>&nbsp;&nbsp;Create</button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
		)
	}
}

export default withRouter(CreateNetwork)