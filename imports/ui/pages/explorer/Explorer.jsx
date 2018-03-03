import React, {Component} from "react";
import {withTracker} from "meteor/react-meteor-data";
import {Networks} from "../../../collections/networks/networks.js"
import {Utilities} from "../../../collections/utilities/utilities.js"
import helpers from "../../../modules/helpers"
import ReactHtmlParser, { processNodes, convertNodeToElement, htmlparser2 } from "react-html-parser";
import {withRouter} from 'react-router-dom'
import Web3 from "web3";

import "./Explorer.scss"

class Explorer extends Component {
    constructor() {
        super()
        this.state = {
            selectedNetwork: null,
            latestBlock: null,
            oldestBlock: null,
            blocks: [],
            totalPoolTxns: 0,
            totalPending: 0,
            totalQueued: 0,
            totalAccounts: 0,
            blockOrTxnOutput: '',
            totalSmartContracts: 0,
            totalBlocksScanned: 0
        }

        this.addLatestBlocks = this.addLatestBlocks.bind(this)
        this.loadMoreBlocks = this.loadMoreBlocks.bind(this)
        this.refreshTxpool = this.refreshTxpool.bind(this)
        this.refreshTotalSmartContracts = this.refreshTotalSmartContracts.bind(this)
        this.fetchBlockOrTxn = this.fetchBlockOrTxn.bind(this)
        this.refreshTotalBlocksScanned = this.refreshTotalBlocksScanned.bind(this)
    }

    componentDidMount() {
        setTimeout(this.addLatestBlocks, 2000);
        setTimeout(this.refreshTxpool, 2000);
        setTimeout(this.refreshTotalSmartContracts, 2000);
        setTimeout(this.refreshTotalBlocksScanned, 2000);
    }

    componentWillUnmount() {
        this.props.subscriptions.forEach((s) =>{
            s.stop();
        });
    }

    selectNetwork(e) {
        this.setState({
            selectedNetwork: e.target.value,
            latestBlock: null,
            oldestBlock: null,
            blocks: [],
            totalPoolTxns: 0,
            totalPending: 0,
            totalQueued: 0,
            totalAccounts: 0,
            blockOrTxnOutput: '',
            totalSmartContracts: 0,
            totalBlocksScanned: 0
        })
    }

    nodeStatusIcon(instanceId) {
        for(let count = 0; count < this.props.networks.length; count++) {
            if(instanceId === this.props.networks[count].instanceId) {
                if(this.props.networks[count].status === "running") {
                    return (<i className="fa fa-circle text-success fs-11"></i>)
                } else if (this.props.networks[count].status === "down") {
                    return (<i className="fa fa-circle text-danger fs-11"></i>)
                } else {
                    return (<i className="fa fa-circle text-complete fs-11"></i>)
                }
            }
        }
    }

    refreshTotalSmartContracts() {
        if(this.state.selectedNetwork === null && this.props.networks.length > 0 && this.props.workerNodeIP.length === 1) {
            if(this.props.networks[0].status === "running") {
                this.setState({
                    totalSmartContracts: (this.props.networks[0].totalSmartContracts ? this.props.networks[0].totalSmartContracts : 0)
                }, () => {
                    setTimeout(this.refreshTotalSmartContracts, 100)
                })
            } else {
                setTimeout(this.refreshTotalSmartContracts, 100)
            }

        } else if (this.state.selectedNetwork !== null && this.props.networks.length > 0 && this.props.workerNodeIP.length === 1) {
            for(let count = 0; count < this.props.networks.length; count++) {
                if(this.state.selectedNetwork === this.props.networks[count].instanceId) {
                    if(this.props.networks[count].status === "running") {
                        this.setState({
                            totalSmartContracts: (this.props.networks[count].totalSmartContracts ? this.props.networks[count].totalSmartContracts : 0)
                        }, () => {
                            setTimeout(this.refreshTotalSmartContracts, 100)
                        })
                        break
                    } else {
                        setTimeout(this.refreshTotalSmartContracts, 100)
                        break
                    }
                }
            }
        }
    }

    refreshTotalBlocksScanned() {
        if(this.state.selectedNetwork === null && this.props.networks.length > 0 && this.props.workerNodeIP.length === 1) {
            if(this.props.networks[0].status === "running") {
                this.setState({
                    totalBlocksScanned: (this.props.networks[0].blockToScan ? (this.props.networks[0].blockToScan - 1) : 0)
                }, () => {
                    setTimeout(this.refreshTotalBlocksScanned, 100)
                })
            } else {
                setTimeout(this.refreshTotalBlocksScanned, 100)
            }

        } else if (this.state.selectedNetwork !== null && this.props.networks.length > 0 && this.props.workerNodeIP.length === 1) {
            for(let count = 0; count < this.props.networks.length; count++) {
                if(this.state.selectedNetwork === this.props.networks[count].instanceId) {
                    if(this.props.networks[count].status === "running") {
                        this.setState({
                            totalBlocksScanned: (this.props.networks[count].blockToScan ? (this.props.networks[count].blockToScan - 1) : 0)
                        }, () => {
                            setTimeout(this.refreshTotalBlocksScanned, 100)
                        })
                        break
                    } else {
                        setTimeout(this.refreshTotalBlocksScanned, 100)
                        break;
                    }

                }
            }
        }
    }

    refreshTxpool() {
        let rpc = null;
        let status = null;
        if(this.state.selectedNetwork === null && this.props.networks.length > 0 && this.props.workerNodeIP.length === 1) {
            rpc = "http://" + this.props.workerNodeIP[0].value + ":" + this.props.networks[0].rpcNodePort
            status = this.props.networks[0].status
        } else if (this.state.selectedNetwork !== null && this.props.networks.length > 0 && this.props.workerNodeIP.length === 1) {
            for(let count = 0; count < this.props.networks.length; count++) {
                if(this.state.selectedNetwork === this.props.networks[count].instanceId) {
                    rpc = "http://" + this.props.workerNodeIP[0].value + ":" + this.props.networks[count].rpcNodePort
                    status = this.props.networks[count].status
                    break
                }
            }
        }

        if(status == "running") {
            let web3 = new Web3(new Web3.providers.HttpProvider(rpc));
            web3.eth.getBlockNumber((error, result) => {
                if(!error) {
                    web3.currentProvider.sendAsync({
                        method: "txpool_content",
                        params: [],
                        jsonrpc: "2.0",
                        id: new Date().getTime()
                    }, (error, result) => {
                        if(!error) {
                            let totalPending = 0;
                            for(let account in result.result.pending) {
                                for(let txn in result.result.pending[account]) {
                                    totalPending++;
                                }
                            }

                            let totalQueued = 0;
                            for(let account in result.result.queued) {
                                for(let txn in result.result.queued[account]) {
                                    totalQueued++;
                                }
                            }

                            this.setState({
                                totalPoolTxns: totalQueued + totalPending,
                                totalPending: totalPending,
                                totalQueued: totalQueued
                            }, () => {
                                setTimeout(this.refreshTxpool, 500)
                            })

                        } else {
                            setTimeout(this.refreshTxpool, 500);
                        }

                    })
                } else {
                    setTimeout(this.refreshTxpool, 500);
                }
            })
        } else {
            setTimeout(this.refreshTxpool, 500)
        }
    }

    addLatestBlocks() {
        let rpc = null;
        let status = null;
        if(this.state.selectedNetwork === null && this.props.networks.length > 0 && this.props.workerNodeIP.length === 1) {
            rpc = "http://" + this.props.workerNodeIP[0].value + ":" + this.props.networks[0].rpcNodePort
            status = this.props.networks[0].status
        } else if (this.state.selectedNetwork !== null && this.props.networks.length > 0 && this.props.workerNodeIP.length === 1) {
            for(let count = 0; count < this.props.networks.length; count++) {
                if(this.state.selectedNetwork === this.props.networks[count].instanceId) {
                    rpc = "http://" + this.props.workerNodeIP[0].value + ":" + this.props.networks[count].rpcNodePort
                    status = this.props.networks[count].status
                    break
                }
            }
        }

        if(status == "running") {
            let web3 = new Web3(new Web3.providers.HttpProvider(rpc));
            if(this.state.latestBlock === null && this.state.oldestBlock === null) {
                web3.eth.getBlockNumber((error, result) => {
                    if(!error) {
                        let latestBlockNumber = result
                        web3.eth.getBlock(latestBlockNumber, (error, result) => {
                            if (!error) {
                                let latestBlock = result
                                this.setState({
                                    latestBlock: latestBlockNumber,
                                    oldestBlock: latestBlockNumber,
                                    blocks: [latestBlock]
                                }, () => {
                                    setTimeout(this.addLatestBlocks, 500);
                                })
                            } else {
                                setTimeout(this.addLatestBlocks, 500);
                            }
                        })
                    } else {
                        setTimeout(this.addLatestBlocks, 500);
                    }
                })
            } else {
                web3.eth.getBlock(this.state.latestBlock + 1, (error, result) => {
                    if (!error && result !== null) {
                        this.state.blocks.unshift(result)
                        this.setState({
                            latestBlock: this.state.latestBlock + 1,
                            blocks: this.state.blocks
                        }, () => {
                            setTimeout(this.addLatestBlocks, 500);
                        })
                    } else {
                        setTimeout(this.addLatestBlocks, 500);
                    }
                })
            }
        } else {
            setTimeout(this.addLatestBlocks, 500);
        }
    }

    async loadMoreBlocks(e) {
        e.preventDefault();

        if(this.state.oldestBlock != null) {
            let blocksToFetch = [];

            for(let count = this.state.oldestBlock - 1; count >= this.state.oldestBlock - 10; count--) {
                blocksToFetch.push(count)
            }

            let rpc = null;
            let status = null;

            if(this.state.selectedNetwork === null && this.props.networks.length > 0 && this.props.workerNodeIP.length === 1) {
                rpc = "http://" + this.props.workerNodeIP[0].value + ":" + this.props.networks[0].rpcNodePort
                status = this.props.networks[0].status
            } else if (this.state.selectedNetwork !== null && this.props.networks.length > 0 && this.props.workerNodeIP.length === 1) {
                for(let count = 0; count < this.props.networks.length; count++) {
                    if(this.state.selectedNetwork === this.props.networks[count].instanceId) {
                        rpc = "http://" + this.props.workerNodeIP[0].value + ":" + this.props.networks[count].rpcNodePort
                        status = this.props.networks[count].status
                        break
                    }
                }
            }

            let web3 = new Web3(new Web3.providers.HttpProvider(rpc));

            fetchBlock = (blockNumber) => {
                return new Promise((resolve, reject) => {
                    web3.eth.getBlock(blockNumber, (error, result) => {
                        if (!error && result !== null) {
                            this.state.blocks.push(result)
                            this.setState({
                                blocks: this.state.blocks,
                                oldestBlock: blockNumber
                            }, () => {
                                resolve()
                            })
                        } else {
                            reject()
                        }
                    })
                });
            }


            if(status === "running") {
                let setState = this.setState;
                let state = this.state

                for(var count = 0; count < blocksToFetch.length; count++) {
                    try {
                        let x = await fetchBlock(blocksToFetch[count]);
                    } catch(e) {
                        break;
                    }
                }
            }
        }
    }

    fetchBlockOrTxn(value) {
        let action = null;

        if(value.length === 66) {
            action = "txn"
        } else if(!Number.isNaN(parseInt(value))) {
            action = "block"
        } else {
            return;
        }

        let rpc = null;
        let status = null;
        if(this.state.selectedNetwork === null && this.props.networks.length > 0 && this.props.workerNodeIP.length === 1) {
            rpc = "http://" + this.props.workerNodeIP[0].value + ":" + this.props.networks[0].rpcNodePort
            status = this.props.networks[0].status
        } else if (this.state.selectedNetwork !== null && this.props.networks.length > 0 && this.props.workerNodeIP.length === 1) {
            for(let count = 0; count < this.props.networks.length; count++) {
                if(this.state.selectedNetwork === this.props.networks[count].instanceId) {
                    rpc = "http://" + this.props.workerNodeIP[0].value + ":" + this.props.networks[count].rpcNodePort
                    status = this.props.networks[count].status
                    break
                }
            }
        }

        if(status == "running") {
            let web3 = new Web3(new Web3.providers.HttpProvider(rpc));

            if(action === "block") {
                web3.eth.getBlock(value, (error, result) => {
                    if(!error && result != null) {
                        this.setState({
                            blockOrTxnOutput: JSON.stringify(result, undefined, 4)
                        })
                    }
                })
            } else {
                web3.eth.getTransaction(value, (error, result1) => {
                    if(!error && result1 != null) {
                        web3.eth.getTransactionReceipt(value, (error, result2) => {
                            if(!error && result2 != null) {
                                this.setState({
                                    blockOrTxnOutput: JSON.stringify(Object.assign(result1, result2), undefined, 4)
                                })
                            }
                        })
                    }
                })

            }
        }
    }

	render(){
        let nodeStatus = null;
        if (this.state.selectedNetwork === null && this.props.networks.length > 0) {
            nodeStatus = this.nodeStatusIcon(this.props.networks[0].instanceId)
        } else {
            nodeStatus = this.nodeStatusIcon(this.state.selectedNetwork)
        }

		return (
            <div className="content explorer sm-gutter">
                <div className="container-fluid container-fixed-lg m-t-20 p-l-25 p-r-25 p-t-0 p-b-25 sm-padding-10">
                    <div className="row">
                        <div className="col-lg-6 col-sm-12">
                            <div className="row">
                                <div className="col-lg-12">
                                    <div className="card social-card share  full-width m-b-10 no-border" data-social="item">
                                        <div className="card-header ">
                                            <h5 className="text-primary pull-left fs-12">Select Network </h5>
                                            <div className="pull-right small hint-text">
                                                {nodeStatus}
                                            </div>
                                            <div className="clearfix"></div>
                                        </div>
                                        <div className="card-description m-b-0 p-b-0">
                                            <div className="radio radio-success">
                                                {this.props.networks.map((item, index) => {
                                                    return (
                                                        <span key={index}>
                                                            <input type="radio" value={item.instanceId} name="networkId" id={item.instanceId} checked={(this.state.selectedNetwork === item.instanceId ? true : (this.state.selectedNetwork === null && index === 0 ? true : false))} onChange={(e) => {this.selectNetwork(e)}} />
                                                            <label htmlFor={item.instanceId}>{item.name}</label>
                                                        </span>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-6">
                                    <div className="card no-border bg-white no-margin widget-loader-bar">
                                        <div className="card-header  top-left top-right ">
                                            <div className="card-title text-black hint-text">
                                                <span className="font-montserrat fs-11 all-caps">Transaction Pool <i className="fa fa-chevron-right"></i>
                                                </span>
                                            </div>
                                            <div className="card-controls">
                                                <ul>
                                                    <li className="p-l-10">
                                                        <a data-toggle="refresh" className="card-refresh text-black" href="#">
                                                            <i className="fa fa-spinner"></i>
                                                        </a>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                        <div className="card-block p-t-40">
                                            <div className="row">
                                                <div className="col-sm-12">
                                                    <h4 className="no-margin p-b-5 text-danger semi-bold">{this.state.totalPoolTxns} TXNS</h4>
                                                    <div className="pull-left small">
                                                        <span>Pending</span>
                                                        <span className=" text-success font-montserrat">
                                                        <i className="fa fa-caret-up m-l-10"></i> {this.state.totalPending} Txns
                                                        </span>
                                                    </div>
                                                    <div className="pull-left m-l-20 small">
                                                        <span>Queue</span>
                                                        <span className=" text-danger font-montserrat">
                                                        <i className="fa fa-caret-down m-l-10"></i> {this.state.totalQueued} Txns
                                                        </span>
                                                    </div>
                                                    <div className="clearfix"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-6">
                                    <div className="widget-9 card no-border bg-success no-margin widget-loader-bar">
                                        <div className="full-height d-flex flex-column">
                                            <div className="card-header ">
                                                <div className="card-title text-black">
                                                    <span className="font-montserrat fs-11 all-caps">Smart Contracts IN NETWORK <i
                                                        className="fa fa-chevron-right"></i>
                                                    </span>
                                                </div>
                                                <div className="card-controls">
                                                    <ul>
                                                        <li><a href="#" className="card-refresh text-black" data-toggle="refresh"><i
                                                            className="fa fa-file-o"></i></a>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                            <div className="p-l-20">
                                                <h3 className="no-margin p-b-30 text-white ">{this.state.totalSmartContracts}</h3>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-12 m-t-10">
                                    <div className="card no-border no-margin details">
                                        <hr className="no-margin" />
                                        <div className="">
                                            <form role="form">
                                                <div className="form-group form-group-default input-group m-b-0">
                                                    <div className="form-input-group">
                                                        <label>Enter Block Number or Txn Hash for details</label>
                                                        <input type="email" className="form-control" placeholder="0x...." onChange={(e) => {this.fetchBlockOrTxn(e.target.value)}} />
                                                    </div>
                                                    <div className="input-group-addon p-l-20 p-r-20 search-button">
                                                        <i className="fa fa-search"></i>
                                                    </div>
                                                </div>
                                            </form>
                                        </div>
                                        <div className="padding-15 json-output">
                                            <pre>
                                                {this.state.blockOrTxnOutput}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-6">
                            <div className="widget-11-2 card no-border card-condensed no-margin widget-loader-circle align-self-stretch d-flex flex-column">
                                <div className="card-header top-right">
                                    <div className="card-controls">
                                        <ul>
                                            <li><a data-toggle="refresh" className="portlet-refresh text-black" href="#"><i
                                                className="portlet-icon portlet-icon-refresh"></i></a>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                <div className="padding-25">
                                    <div className="pull-left">
                                        <h2 className="text-success no-margin">Latest Blocks</h2>
                                        <p className="no-margin">Descending Order</p>
                                    </div>
                                    <h3 className="pull-right semi-bold"><sup>
                                        <small className="semi-bold">#</small>
                                        </sup> {this.state.totalBlocksScanned}
                                    </h3>
                                    <div className="clearfix"></div>
                                </div>
                                <div className="auto-overflow widget-11-2-table">
                                    <table className="table table-condensed table-hover">
                                        <tbody>
                                            {this.state.blocks.map((item, index) => {
                                                return (
                                                    <tr key={item.number}>
                                                        <td className="font-montserrat all-caps fs-12 w-50">Block Number #{item.number}</td>
                                                        <td className="text-right hidden-lg">
                                                            <span className="hint-text small">dewdrops</span>
                                                        </td>
                                                        <td className="text-right b-r b-dashed b-grey w-25">
                                                            <span className="hint-text small">{item.transactions.length} Txns</span>
                                                        </td>
                                                        <td className="w-25">
                                                            <span className="font-montserrat fs-18">{item.size} Bytes</span>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="padding-25 mt-auto">
                                    <p className="small no-margin">
                                        <a href="#" onClick={(e) => {this.loadMoreBlocks(e)}}><i className="fa fs-16 fa-arrow-circle-o-down text-success m-r-10"></i></a>
                                        <span className="hint-text ">Show older blocks</span>
                                    </p>
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
        subscriptions: [Meteor.subscribe("networks"), Meteor.subscribe("utilities")],
        workerNodeIP: Utilities.find({"name": "workerNodeIP"}).fetch(),
    }
})(withRouter(Explorer))
