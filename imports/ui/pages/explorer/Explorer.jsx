import React, {Component} from "react";
import {withTracker} from "meteor/react-meteor-data";
import {Networks} from "../../../collections/networks/networks.js"
import helpers from "../../../modules/helpers"
import ReactHtmlParser, { processNodes, convertNodeToElement, htmlparser2 } from "react-html-parser";
import {withRouter} from 'react-router-dom'
var abiDecoder = require('abi-decoder');
import {Link} from "react-router-dom";
import Config from '../../../modules/config/client'
import smartContracts from "../../../modules/smart-contracts"

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
            totalBlocksScanned: 0,
            addLatestBlocksTimer: null,
            refreshTxpoolTimer: null,
            refreshConfigTimer: null,
            latestTxns: [],
            diskSize: 0,
            totalTransactions: 0
        }

        this.addLatestBlocks = this.addLatestBlocks.bind(this)
        this.loadMoreBlocks = this.loadMoreBlocks.bind(this)
        this.refreshTxpool = this.refreshTxpool.bind(this)
        this.refreshConfig = this.refreshConfig.bind(this)
        this.fetchBlockOrTxn = this.fetchBlockOrTxn.bind(this)
        this.refreshLatestTxns = this.refreshLatestTxns.bind(this)
    }

    componentDidMount() {
        this.setState({
            addLatestBlocksTimer: setTimeout(this.addLatestBlocks, 500),
            refreshTxpoolTimer: setTimeout(this.refreshTxpool, 500),
            refreshConfigTimer: setTimeout(this.refreshConfig, 500),
            refreshLatestTxnsTimer: setTimeout(this.refreshLatestTxns, 500)
        })
    }

    componentWillUnmount() {
        this.props.subscriptions.forEach((s) =>{
            s.stop();
        });

        clearTimeout(this.state.addLatestBlocksTimer);
        clearTimeout(this.state.refreshTxpoolTimer);
        clearTimeout(this.state.refreshConfigTimer);
        clearTimeout(this.state.refreshLatestTxnsTimer);
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
            totalBlocksScanned: 0,
            latestTxns: []
        })
    }

    nodeStatusIcon() {
        if(this.props.network.length === 1) {
            if(this.props.network[0].status === "running") {
                return (<i className="fa fa-circle text-success fs-11"></i>)
            } else if (this.props.network[0].status === "down") {
                return (<i className="fa fa-circle text-danger fs-11"></i>)
            } else {
                return (<i className="fa fa-circle text-complete fs-11"></i>)
            }
        }
    }

    refreshConfig() {
        let rpc = null;
        let status = null;

        let username = null ;
        let password = null; 

        if(this.props.network.length === 1) {
            username = this.props.network[0].instanceId
            password = this.props.network[0]["api-password"]
            status = this.props.network[0].status
        }

        if(status == "running") {
            let url = `https://${Config.workerNodeDomainName(this.props.network[0].locationCode)}/api/node/${this.props.network[0].instanceId}/utility/nodeInfo`;
            HTTP.get(url, {
                headers: {
                    'Authorization': "Basic " + (new Buffer(`${username}:${password}`).toString("base64"))
                }
            }, (err, res) => {
                if(!err) {
                    this.setState({
                        totalSmartContracts: res.data.totalSmartContracts,
                        diskSize: res.data.diskSize ? res.data.diskSize : 0,
                        totalBlocksScanned: res.data.blockToScan ? (res.data.blockToScan - 1) : 0,
                        totalTransactions: res.data.totalTransactions ? res.data.totalTransactions : 0
                    }, () => {
                        this.setState({
                            refreshConfigTimer: setTimeout(this.refreshConfig, 500)
                        })
                    });
                } else {
                    this.setState({
                        refreshConfigTimer: setTimeout(this.refreshConfig, 500)
                    })
                }
            })
        } else {
            this.setState({
                refreshConfigTimer: setTimeout(this.refreshConfig, 500)
            })
        }
    }

    refreshTxpool() {
        let rpc = null;
        let status = null;

        let username = null ;
        let password = null; 

        if(this.props.network.length === 1) {
            rpc = `https://${this.props.workerNodeDomainName(this.props.network[0].locationCode)}/api/node/${this.props.network[0].instanceId}/jsonrpc`
            username = this.props.network[0].instanceId
            password = this.props.network[0]["api-password"]
            status = this.props.network[0].status
        }

        if(status == "running") {
            let web3 = new Web3(new Web3.providers.HttpProvider(rpc, 0, username, password));
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
                                this.setState({
                                    refreshTxpoolTimer: setTimeout(this.refreshTxpool, 500)
                                })
                            })

                        } else {
                            this.setState({
                                refreshTxpoolTimer: setTimeout(this.refreshTxpool, 500)
                            })
                        }

                    })
                } else {
                    this.setState({
                        refreshTxpoolTimer: setTimeout(this.refreshTxpool, 500)
                    })
                }
            })
        } else {
            this.setState({
                refreshTxpoolTimer: setTimeout(this.refreshTxpool, 500)
            })
        }
    }

    refreshLatestTxns() {
        let rpc = null;
        let status = null;
        let username = null ;
        let password = null; 

        if(this.props.network.length === 1) {
            username = this.props.network[0].instanceId
            password = this.props.network[0]["api-password"]
            status = this.props.network[0].status
        }

        if(status == "running") {
            let url = `https://${Config.workerNodeDomainName(this.props.network[0].locationCode)}/api/node/${this.props.network[0].instanceId}/transactions/last100`;
            HTTP.get(url, {
                headers: {
                    'Authorization': "Basic " + (new Buffer(`${username}:${password}`).toString("base64"))
                }
            }, (err, res) => {
                if(!err) {
                    this.setState({
                        latestTxns: res.data.reverse()
                    }, () => {
                        this.setState({
                            refreshLatestTxnsTimer: setTimeout(this.refreshLatestTxns, 500)
                        })
                    });
                }
            })
        } else {
            this.setState({
                refreshLatestTxnsTimer: setTimeout(this.refreshLatestTxns, 500)
            })
        }
    }

    addLatestBlocks() {
        let rpc = null;
        let status = null;
        let username = null ;
        let password = null; 

        if(this.props.network.length === 1) {
            rpc = `https://${this.props.workerNodeDomainName(this.props.network[0].locationCode)}/api/node/${this.props.network[0].instanceId}/jsonrpc`
            username = this.props.network[0].instanceId
            password = this.props.network[0]["api-password"]

            status = this.props.network[0].status
        }

        if(status == "running") {
            let web3 = new Web3(new Web3.providers.HttpProvider(rpc, 0, username, password));
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
                                    this.setState({
                                        addLatestBlocksTimer: setTimeout(this.addLatestBlocks, 500)
                                    })
                                })
                            } else {
                                this.setState({
                                    addLatestBlocksTimer: setTimeout(this.addLatestBlocks, 500)
                                })
                            }
                        })
                    } else {
                        this.setState({
                            addLatestBlocksTimer: setTimeout(this.addLatestBlocks, 500)
                        })
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
                            this.setState({
                                addLatestBlocksTimer: setTimeout(this.addLatestBlocks, 500)
                            })
                        })
                    } else {
                        this.setState({
                            addLatestBlocksTimer: setTimeout(this.addLatestBlocks, 500)
                        })
                    }
                })
            }
        } else {
            this.setState({
                addLatestBlocksTimer: setTimeout(this.addLatestBlocks, 500)
            })
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
            let username = null ;
            let password = null; 

            rpc = `https://${this.props.workerNodeDomainName(this.props.network[0].locationCode)}/api/node/${this.props.network[0].instanceId}/jsonrpc`
            username = this.props.network[0].instanceId
            password = this.props.network[0]["api-password"]
            status = this.props.network[0].status

            let web3 = new Web3(new Web3.providers.HttpProvider(rpc, 0, username, password));

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
        let atomicSwapContractAddress = null;
        let assetsContractAddress = null;
        let username = null ;
        let password = null; 
        let atomicSwapContractAddress = null;
        let assetsContractAddress = null;
        let streamsContractAddress = null;

        rpc = `https://${this.props.workerNodeDomainName(this.props.network[0].locationCode)}/api/node/${this.props.network[0].instanceId}/jsonrpc`
        username = this.props.network[0].instanceId
        password = this.props.network[0]["api-password"]
        status = this.props.network[0].status
        atomicSwapContractAddress = this.props.network[0].atomicSwapContractAddress;
        assetsContractAddress = this.props.network[0].assetsContractAddress;
        streamsContractAddress = this.props.network[0].streamsContractAddress;

        if(status == "running") {
            let web3 = new Web3(new Web3.providers.HttpProvider(rpc, 0, username, password));

            if(action === "block") {
                web3.eth.getBlock(value, (error, result) => {
                    if(!error && result != null) {
                        this.setState({
                            blockOrTxnOutput: JSON.stringify(result, undefined, 4)
                        })
                    }
                })
            } else {
                let url = `https://${Config.workerNodeDomainName(this.props.network[0].locationCode)}/api/node/${this.props.network[0].instanceId}/transactions/audit?hash=${value}`;
                HTTP.get(url, {
                    headers: {
                        'Authorization': "Basic " + (new Buffer(`${username}:${password}`).toString("base64"))
                    }
                }, (err, res) => {
                    if(!err) {
                        this.setState({
                            blockOrTxnOutput: JSON.stringify(res.data, undefined, 4)
                        })
                    } else {
                        this.setState({
                            blockOrTxnOutput: JSON.stringify({
                                "message": "Unable to Audit Txn"
                            }, undefined, 4)
                        })
                    }
                })
            }
        }
    }

	render(){
        let nodeStatus = null;
        nodeStatus = this.nodeStatusIcon()

		return (
            <div className="content explorer sm-gutter">
                <div className="container-fluid container-fixed-lg m-t-20 p-l-25 p-r-25 p-t-0 p-b-25 sm-padding-10">
                    <div className="row">
                        <div className="col-lg-8 col-sm-12">
                            <div className="row">
                                <div className="col-lg-12 m-b-10">
                                    <Link to={"/app/networks/" + this.props.match.params.id}> Control Panel <i className="fa fa-angle-right"></i></Link> Explorer
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-lg-4">
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
                                                        <i className="fa fa-caret-up m-l-10"></i> {this.state.totalPending}
                                                        </span>
                                                    </div>
                                                    <div className="pull-left m-l-20 small">
                                                        <span>Queue</span>
                                                        <span className=" text-danger font-montserrat">
                                                        <i className="fa fa-caret-down m-l-10"></i> {this.state.totalQueued}
                                                        </span>
                                                    </div>
                                                    <div className="clearfix"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-4">
                                    <div className="widget-9 card no-border bg-success no-margin widget-loader-bar">
                                        <div className="full-height d-flex flex-column">
                                            <div className="card-header ">
                                                <div className="card-title text-black">
                                                    <span className="font-montserrat fs-11 all-caps text-white">Smart Contracts <i
                                                        className="fa fa-chevron-right"></i>
                                                    </span>
                                                </div>
                                                <div className="card-controls">
                                                    <ul>
                                                        <li><a href="#" className="card-refresh " style={{"color": "white"}} data-toggle="refresh"><i
                                                            className="fa fa-file-o text-white"></i></a>
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
                                <div className="col-lg-4">
                                    <div className="widget-9 card no-border bg-primary no-margin widget-loader-bar">
                                        <div className="full-height d-flex flex-column">
                                            <div className="card-header ">
                                                <div className="card-title text-black">
                                                    <span className="font-montserrat fs-11 all-caps text-white">Size of Blockchain <i
                                                        className="fa fa-chevron-right"></i>
                                                    </span>
                                                </div>
                                                <div className="card-controls">
                                                    <ul>
                                                        <li><a href="#" className="card-refresh" data-toggle="refresh"><i
                                                            className="card-icon card-icon-refresh text-white"></i></a>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                            <div className="p-l-20">
                                                <h3 className="no-margin p-b-30 text-white ">{helpers.bytesToSize(this.state.diskSize, 2)}</h3>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-6 m-t-10">
                                    <div className="card no-border no-margin details">
                                        <hr className="no-margin" />
                                        <div className="">
                                            <form role="form">
                                                <div className="form-group form-group-default input-group m-b-0">
                                                    <div className="form-input-group">
                                                        <label>Enter Block Number or Txn Hash to Audit</label>
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
                                <div className="col-lg-6 m-t-10">
                                    <div className="widget-9  widget-11-2 card no-border card-condensed no-margin widget-loader-circle align-self-stretch details">
                                        <div className="padding-25">
                                            <div className="pull-left">
                                                <h2 className="text-success no-margin">Latest Txns</h2>
                                                <p className="no-margin">Descending Order</p>
                                            </div>
                                            <h3 className="pull-right semi-bold"><sup>
                                                <small className="semi-bold">#</small>
                                                </sup> {this.state.totalTransactions}
                                            </h3>
                                            <div className="clearfix"></div>
                                        </div>
                                        <div className="auto-overflow widget-11-2-table-2">
                                            <table className="table table-condensed table-hover">
                                                <tbody>
                                                    {this.state.latestTxns.map((item, index) => {
                                                        return (
                                                            <tr key={item.txnHash}>
                                                                <td className="font-montserrat all-caps fs-12 break-word">{item.txnHash}</td>
                                                                <td className="text-right b-r b-dashed b-grey w-0">
                                                                </td>
                                                                <td className="w-25">
                                                                    <span className="font-montserrat fs-18">{helpers.firstLetterCapital(item.type)}</span>
                                                                </td>
                                                            </tr>
                                                        )
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-4">
                            <div className="row">
                                <div className="col-lg-12 m-b-30">
                                </div>
                            </div>
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
                                                        <td className="font-montserrat all-caps fs-12 w-50">Block #{item.number}</td>
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

export default withTracker((props) => {
    return {
        network: Networks.find({instanceId: props.match.params.id, active: true}).fetch(),
        subscriptions: [Meteor.subscribe("networks", {
        	onReady: function (){
        		if(Networks.find({instanceId: props.match.params.id, active: true}).fetch().length !== 1) {
        			props.history.push("/app/networks");
        		}
        	}
        })],
        workerNodeDomainName: Config.workerNodeDomainName
    }
})(withRouter(Explorer))