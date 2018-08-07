import React, {Component} from "react";
import LaddaButton, { S, SLIDE_UP } from "react-ladda";
import {withTracker} from "meteor/react-meteor-data";
import {withRouter} from 'react-router-dom'
import {Networks} from "../../../collections/networks/networks.js"
import notifications from "../../../modules/notifications"
import LocationSelector from '../../components/Selectors/LocationSelector';
import NetworkConfigSelector from '../../components/Selectors/NetworkConfigSelector.jsx'
import CardVerification from '../billing/components/CardVerification.jsx';

import "./JoinNetwork.scss"

class JoinNetwork extends Component {
    constructor() {
        super()

        this.locationCode = "us-west-2";
        this.state = {
            joinFormSubmitError: "",
            inviteFormSubmitError: "",
            totalENodes: [""],
            showSubmitAlert: false,
            joinLoading: false,
            inviteLoading: false,
            locationCode: "us-west-2"
        };
    }

    componentWillUnmount() {
        this.props.subscriptions.forEach((s) =>{
            s.stop();
        });
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

    componentDidMount(){
      Meteor.call('nodeCount', (err, res) => {
        if(!err){
            this.setState({
              microNodesViolated: res.micro > 2,
              nodeCount: res
            });
        }
      });
    }

    deleteENodeURL = (index) => {
        if(this.state.totalENodes.length > 1) {
            this.state.totalENodes.splice(index, 1);
            this.setState({
                totalENodes: this.state.totalENodes
            })
        }
    }

    onJoinSubmit = (e) => {
        e.preventDefault()
        this.setState({
          showSubmitAlert: true
        });
        // const isVoucherMicro = (this.config.voucher &&  this.config.voucher.networkConfig && this.config.voucher.networkConfig.cpu === 0.5);
        // const isMicro = (this.config && this.config.config && (this.config.config.cpu === 0.5 || this.config.config.name && this.config.config.name.toLowerCase() === 'light')) || isVoucherMicro;
        // if(this.state.nodeCount.micro >= 2 && isMicro){
        //   return this.setState({
        //     formSubmitError: 'You can have at max only 2 micro nodes at a time',
        //   });
        // }


        if(!this.networkName.value){
          return
          this.setState({
            formSubmitError: 'Network name is required'
          });
        }


        if(!(this.config && this.config.voucher)){
          if(!this.state.cardVerified){
            return this.setState({
              showCreditCardAlert: true
            });
          }
        }

        let file = this.genesisFile.files[0];
        let reader = new FileReader();
        reader.readAsText(file, "UTF-8");
        reader.onload = (evt) => {
            var fileContent = evt.target.result;

            this.setState({
                joinFormSubmitError: '',
                joinLoading: true
            });

            Meteor.call("joinNetwork", this.networkName.value, this.nodeType.value, fileContent, this.state.totalENodes, this.state.impulseURL, this.assetsContractAddress.value, this.atomicSwapContractAddress.value, this.streamsContractAddress.value, this.locationCode,  {...this.config}, (error) => {
                if(!error) {
                    this.setState({
                        joinFormSubmitError: '',
                        joinLoading: false
                    });

                    this.props.history.push("/app/networks");
                    notifications.success("Initializing node")
                } else {
                    this.setState({
                        joinFormSubmitError: error.reason,
                        joinLoading: false
                    })
                }
            });
        }

        reader.onerror = () => {
            this.setState({
                joinFormSubmitError: 'An error occured while reading genesis file content'
            });
        }
    }

    onInviteSubmit = (e) => {
        e.preventDefault()

        this.setState({
            inviteFormSubmitError: '',
            inviteLoading: true
        });

        Meteor.call("inviteUserToNetwork", this.networkNameInvite.value, this.nodeTypeInvite.value, this.email.value, (error) => {
            if(!error) {
                this.setState({
                    inviteFormSubmitError: '',
                    inviteLoading: false
                });

                this.props.history.push("/app/networks");
                notifications.success("Invited Successfully")
            } else {
                this.setState({
                    inviteFormSubmitError: error.reason,
                    inviteLoading: false
                })
            }
        });
    }

    locationChangeListener(newLocationCode){
        this.locationCode = newLocationCode;
    }


    cardVerificationListener = (isVerified) => {
      this.setState({
        cardVerified: isVerified
      })
    }


	render(){
		return (
            <div className="content ">
                <div className="m-t-20 container-fluid container-fixed-lg">
                    <div className="row joinNetwork">
                        <div className="card card-borderless card-transparent">
                            <ul className="nav nav-tabs nav-tabs-linetriangle" role="tablist" data-init-reponsive-tabs="dropdownfx">
                                <li className="nav-item">
                                    <a className="active" data-toggle="tab" role="tab" data-target="#join" href="#">Manually Join Network</a>
                                </li>
                                <li className="nav-item">
                                    <a href="#" data-toggle="tab" role="tab" data-target="#invite">Invite User to Network</a>
                                </li>
                            </ul>
                            <div className="tab-content">
                                <div className="tab-pane active" id="join">
                                    <div className="row column-seperation">
                                        <div className="col-lg-5">
                                            <div className="card card-transparent">
                                                <div className="card-header ">
                                                    <div className="card-title">Join Network
                                                    </div>
                                                </div>
                                                <div className="card-block">
                                                    <h3>
                                                        Join a Existing Blockchain Network
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
                                        <div className="col-lg-7">
                                            <div className="card card-transparent">
                                                <div className="card-block">
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
                                                                <div className="col-md-12">
                                                                    <LocationSelector locationChangeListener={this.locationChangeListener.bind(this)} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <br />
                                                        <p>Node Configuration</p>
                                                        <NetworkConfigSelector configChangeListener={(config) => {
                                                          this.config = config;
                                                          this.setState({
                                                            formSubmitError: '',
                                                            showCreditCardAlert: this.state.showSubmitAlert && ((config && config.voucher) ? false : true)
                                                          });
                                                        }} />
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
                                                                <div className="col-md-4">
                                                                    <div className="form-group form-group-default ">
                                                                        <label>Assets Contract Address</label>
                                                                        <input type="text" className="form-control" name="assetsContractAddress" required ref={(input) => {this.assetsContractAddress = input;}} placeholder="0x...." />
                                                                    </div>
                                                                </div>
                                                                <div className="col-md-4">
                                                                    <div className="form-group form-group-default ">
                                                                        <label>Atomic Swap Contract Address</label>
                                                                        <input type="text" className="form-control" name="atomicSwapContractAddress" required ref={(input) => {this.atomicSwapContractAddress = input;}} placeholder="0x...." />
                                                                    </div>
                                                                </div>
                                                                <div className="col-md-4">
                                                                    <div className="form-group form-group-default ">
                                                                        <label>Streams Contract Address</label>
                                                                        <input type="text" className="form-control" name="streamsContractAddress" required ref={(input) => {this.streamsContractAddress = input;}} placeholder="0x...." />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="row clearfix">
                                                                <div className="col-md-12">
                                                                    <div className="form-group form-group-default ">
                                                                        <label>Impulse URL</label>
                                                                        <input type="text" className="form-control" name="impulseURL" required ref={(input) => {this.impulseURL = input;}} placeholder="http://76.45.122.34:3478" />
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
                                                        <p className="m-t-10">Add other nodes enode URLs</p>
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
                                                        <br />
                                                        {this.state.joinFormSubmitError != '' &&
                                                            <div className="row">
                                                                <div className="col-md-12">
                                                                    <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                                        <button className="close" data-dismiss="alert"></button>
                                                                        {this.state.joinFormSubmitError}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        }
                                                        <div className="verificationWrapper" style={{display: this.state.showCreditCardAlert ? 'block' : 'none'}}>
                                                          <CardVerification cardVerificationListener={this.cardVerificationListener}/>
                                                        </div>
                                                        <LaddaButton
                                                            loading={this.state.joinLoading}
                                                            data-size={S}
                                                            disabled={this.config && this.config.voucher ? false : !this.state.cardVerified}
                                                            data-style={SLIDE_UP}
                                                            data-spinner-size={30}
                                                            data-spinner-lines={12}
                                                            className="btn btn-success"
                                                            onClick={this.onJoinSubmit}
                                                            type="submit"
                                                        >
                                                            <i className="fa fa-plus-circle" aria-hidden="true"></i>&nbsp;&nbsp;Join
                                                        </LaddaButton>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="tab-pane " id="invite">
                                    <div className="row">
                                        <div className="col-lg-5">
                                            <div className="card card-transparent">
                                                <div className="card-header ">
                                                    <div className="card-title">Invite to Network
                                                    </div>
                                                </div>
                                                <div className="card-block">
                                                    <h3>
                                                        Invite an user on the platform to join your network
                                                    </h3>
                                                    <p>This is a private network the user will be joining. Technically the user will be a validator or peer.</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-lg-7">
                                            <div className="card card-transparent">
                                                <div className="card-block">
                                                    <form id="form-project" role="form" onSubmit={this.onInviteSubmit} autoComplete="off">
                                                        <p>Basic Information</p>
                                                        <div className="form-group-attached">
                                                            <div className="row clearfix">
                                                                <div className="col-md-6">
                                                                    <div className="form-group form-group-default required">
                                                                        <label>Network name</label>
                                                                        <select className="form-control" ref={(input) => {this.networkNameInvite = input;}}>
                                                                            {this.props.networks.map((item, index) => {
                                                                                return (
                                                                                    <option value={item.instanceId} key={item.instanceId}>{item.name}</option>
                                                                                )
                                                                            })}
                                                                        </select>
                                                                    </div>
                                                                </div>
                                                                <div className="col-md-6">
                                                                    <div className="form-group form-group-default required">
                                                                        <label>Node Type</label>
                                                                        <select className="form-control" ref={(input) => {this.nodeTypeInvite = input;}}>
                                                                            <option value="authority">Validator</option>
                                                                            <option value="peer">Peer</option>
                                                                        </select>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="row clearfix">
                                                                <div className="col-md-12">
                                                                    <div className="form-group form-group-default required">
                                                                        <label>User Email</label>
                                                                        <input ref={(input) => {this.email = input;}} type="email" className="form-control" name="firstName" required placeholder="admin@blockcluster.io" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <br />
                                                        {this.state.inviteFormSubmitError != '' &&
                                                            <div className="row">
                                                                <div className="col-md-12">
                                                                    <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                                                        <button className="close" data-dismiss="alert"></button>
                                                                        {this.state.inviteFormSubmitError}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        }

                                                        <LaddaButton
                                                            loading={this.state.inviteLoading}
                                                            data-size={S}
                                                            data-style={SLIDE_UP}
                                                            data-spinner-size={30}
                                                            data-spinner-lines={12}
                                                            className="btn btn-success"
                                                            type="submit"
                                                        >
                                                            <i className="fa fa-plus-circle" aria-hidden="true"></i>&nbsp;&nbsp;Invite
                                                        </LaddaButton>
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
            </div>
		)
	}
}

export default withTracker(() => {
    return {
        networks: Networks.find({active: true}).fetch(),
        subscriptions: [Meteor.subscribe("networks")]
    }
})(withRouter(JoinNetwork))
