import React, {Component} from "react";
import {withTracker} from "meteor/react-meteor-data";
import {Networks} from "../../../collections/networks/networks.js"
import helpers from "../../../modules/helpers"
import ReactHtmlParser, { processNodes, convertNodeToElement, htmlparser2 } from "react-html-parser";
import {withRouter} from 'react-router-dom'
var Web3 = require('web3');
var abiDecoder = require('abi-decoder');
import {Link} from "react-router-dom";
import Config from '../../../modules/config/client'

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

    refreshTotalSmartContracts() {
        if(this.props.network.length === 1) {
            this.setState({
                totalSmartContracts: (this.props.network[0].totalSmartContracts ? this.props.network[0].totalSmartContracts : 0)
            }, () => {
                setTimeout(this.refreshTotalSmartContracts, 100)
            })
        } else {
            setTimeout(this.refreshTotalSmartContracts, 1000)
        }

    }

    refreshTotalBlocksScanned() {
        if(this.props.network.length === 1) {
            this.setState({
                totalBlocksScanned: (this.props.network[0].blockToScan ? (this.props.network[0].blockToScan - 1) : 0)
            }, () => {
                setTimeout(this.refreshTotalBlocksScanned, 100)
            })
        } else {
            setTimeout(this.refreshTotalBlocksScanned, 1000)
        }
    }

    refreshTxpool() {
        let rpc = null;
        let status = null;

        if(this.props.network.length === 1) {
            rpc = "https://" + this.props.workerNodeDomainName[0].value + "/node/" + this.props.network[0].instanceId
            username = this.props.network[0].instanceId
            password = this.props.network[0]["jsonRPC-password"]
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
            setTimeout(this.refreshTxpool, 1000)
        }
    }

    addLatestBlocks() {
        let rpc = null;
        let status = null;

        if(this.props.network.length === 1) {
            rpc = "https://" + this.props.workerNodeDomainName[0].value + "/node/" + this.props.network[0].instanceId
            username = this.props.network[0].instanceId
            password = this.props.network[0]["jsonRPC-password"]

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

            rpc = "https://" + this.props.workerNodeDomainName[0].value + "/node/" + this.props.network[0].instanceId
            username = this.props.network[0].instanceId
            password = this.props.network[0]["jsonRPC-password"]
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

        rpc = "https://" + this.props.workerNodeDomainName[0].value + "/node/" + this.props.network[0].instanceId
        username = this.props.network[0].instanceId
        password = this.props.network[0]["jsonRPC-password"]
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
                web3.eth.getTransaction(value, (error, result1) => {
                    if(!error && result1 != null) {
                        web3.eth.getTransactionReceipt(value, (error, result2) => {
                            if(!error && result2 != null) {

                                if(result1.to == atomicSwapContractAddress) {
                                    abiDecoder.addABI([{"constant":true,"inputs":[],"name":"genesisBlockHash","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[{"name":"assetsContractAddress","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"hash","type":"bytes32"}],"name":"assetLocked","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"hash","type":"bytes32"}],"name":"assetUnlocked","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"hash","type":"bytes32"}],"name":"assetClaimed","type":"event"},{"constant":false,"inputs":[{"name":"to","type":"address"},{"name":"hash","type":"bytes32"},{"name":"lockExpiryMin","type":"uint256"},{"name":"assetType","type":"string"},{"name":"assetName","type":"string"},{"name":"assetId","type":"string"},{"name":"assetUnits","type":"int256"},{"name":"otherAssetType","type":"string"},{"name":"otherAssetName","type":"string"},{"name":"otherAssetUnits","type":"int256"},{"name":"otherAssetId","type":"string"},{"name":"otherGenesisBlockHash","type":"bytes32"}],"name":"lock","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"hash","type":"bytes32"}],"name":"unlock","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"hash","type":"bytes32"},{"name":"secret","type":"string"}],"name":"claim","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"secret","type":"string"}],"name":"calculateHash","outputs":[{"name":"hash","type":"bytes32"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"hash","type":"bytes32"}],"name":"atomicSwapDetails","outputs":[{"name":"from","type":"address"},{"name":"to","type":"address"},{"name":"assetType","type":"string"},{"name":"assetName","type":"string"},{"name":"assetUnits","type":"int256"},{"name":"assetId","type":"string"},{"name":"lockPeriod","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"hash","type":"bytes32"}],"name":"atomicSwapOtherChainDetails","outputs":[{"name":"otherAssetType","type":"string"},{"name":"otherAssetName","type":"string"},{"name":"otherAssetUnits","type":"int256"},{"name":"otherAssetId","type":"string"},{"name":"otherGenesisBlockHash","type":"bytes32"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"hash","type":"bytes32"}],"name":"atomicSwapStatus","outputs":[{"name":"status","type":"int256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"hash","type":"bytes32"}],"name":"atomicSwapSecret","outputs":[{"name":"secret","type":"string"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"getGenesisBlockHash","outputs":[{"name":"hash","type":"bytes32"}],"payable":false,"stateMutability":"nonpayable","type":"function"}]);
                                } else if (result1.to == assetsContractAddress) {
                                    abiDecoder.addABI([{"constant":true,"inputs":[],"name":"deployer","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"assetName","type":"string"},{"indexed":false,"name":"uniqueIdentifier","type":"bytes32"},{"indexed":false,"name":"admin","type":"address"},{"indexed":false,"name":"reissuable","type":"bool"},{"indexed":false,"name":"parts","type":"int256"}],"name":"bulkAssetTypeCreated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"assetName","type":"string"},{"indexed":false,"name":"units","type":"int256"},{"indexed":false,"name":"to","type":"address"}],"name":"bulkAssetsIssued","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"assetName","type":"string"},{"indexed":false,"name":"units","type":"int256"},{"indexed":false,"name":"from","type":"address"},{"indexed":false,"name":"to","type":"address"},{"indexed":false,"name":"fromBalance","type":"int256"},{"indexed":false,"name":"toBalance","type":"int256"}],"name":"bulkAssetsTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"assetName","type":"string"},{"indexed":false,"name":"uniqueIdentifier","type":"bytes32"},{"indexed":false,"name":"authorizedIssuer","type":"address"}],"name":"soloAssetTypeCreated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"assetName","type":"string"},{"indexed":false,"name":"uniqueAssetIdentifier","type":"string"},{"indexed":false,"name":"to","type":"address"},{"indexed":false,"name":"issuer","type":"address"}],"name":"soloAssetIssued","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"assetName","type":"string"},{"indexed":false,"name":"uniqueAssetIdentifier","type":"string"},{"indexed":false,"name":"key","type":"string"},{"indexed":false,"name":"value","type":"string"}],"name":"addedOrUpdatedSoloAssetExtraData","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"assetName","type":"string"},{"indexed":false,"name":"uniqueAssetIdentifier","type":"string"},{"indexed":false,"name":"to","type":"address"},{"indexed":false,"name":"from","type":"address"}],"name":"transferredOwnershipOfSoloAsset","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"assetName","type":"string"},{"indexed":false,"name":"uniqueIdentifier","type":"string"}],"name":"closedSoloAsset","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"assetName","type":"string"},{"indexed":false,"name":"issuer","type":"address"}],"name":"issuerAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"assetName","type":"string"},{"indexed":false,"name":"issuer","type":"address"}],"name":"issuerRemoved","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"assetName","type":"string"},{"indexed":false,"name":"viceAdmin","type":"address"}],"name":"viceAdminAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"assetName","type":"string"},{"indexed":false,"name":"viceAdmin","type":"address"}],"name":"viceAdminRemoved","type":"event"},{"constant":false,"inputs":[{"name":"assetName","type":"string"},{"name":"reissuable","type":"bool"},{"name":"parts","type":"int256"}],"name":"createBulkAssetType","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"assetName","type":"string"}],"name":"getBulkAssetTypeIssuer","outputs":[{"name":"issuer","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"assetName","type":"string"}],"name":"getBulkAssetParts","outputs":[{"name":"parts","type":"int256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"assetName","type":"string"},{"name":"units","type":"int256"},{"name":"to","type":"address"}],"name":"issueBulkAsset","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"assetName","type":"string"},{"name":"from","type":"address"}],"name":"getBulkAssetUnits","outputs":[{"name":"units","type":"int256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"assetName","type":"string"},{"name":"to","type":"address"},{"name":"units","type":"int256"}],"name":"transferBulkAssetUnits","outputs":[{"name":"result","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"assetName","type":"string"}],"name":"createSoloAssetType","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"assetName","type":"string"}],"name":"getSoloAssetTypeAdmin","outputs":[{"name":"issuer","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"assetName","type":"string"},{"name":"to","type":"address"},{"name":"uniqueAssetIdentifier","type":"string"}],"name":"issueSoloAsset","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"assetName","type":"string"},{"name":"uniqueAssetIdentifier","type":"string"}],"name":"getSoloAssetOwner","outputs":[{"name":"owner","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"assetName","type":"string"},{"name":"uniqueAssetIdentifier","type":"string"},{"name":"key","type":"string"}],"name":"getSoloAssetExtraData","outputs":[{"name":"value","type":"string"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"assetName","type":"string"},{"name":"uniqueAssetIdentifier","type":"string"},{"name":"key","type":"string"},{"name":"value","type":"string"}],"name":"addOrUpdateSoloAssetExtraData","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"assetName","type":"string"},{"name":"uniqueAssetIdentifier","type":"string"},{"name":"to","type":"address"}],"name":"transferOwnershipOfSoloAsset","outputs":[{"name":"result","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"assetName","type":"string"},{"name":"newIssuer","type":"address"}],"name":"addSoloAssetIssuer","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"assetName","type":"string"},{"name":"issuer","type":"address"}],"name":"removeSoloAssetIssuer","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"assetName","type":"string"},{"name":"issuer","type":"address"}],"name":"canIssueSoloAsset","outputs":[{"name":"canIssue","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"assetName","type":"string"},{"name":"viceAdmin","type":"address"}],"name":"addSoloAssetViceAdmin","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"assetName","type":"string"},{"name":"viceAdmin","type":"address"}],"name":"removeSoloAssetViceAdmin","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"assetName","type":"string"},{"name":"viceAdmin","type":"address"}],"name":"isAddressViceAdmin","outputs":[{"name":"isViceAdmin","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"assetName","type":"string"},{"name":"uniqueAssetIdentifier","type":"string"}],"name":"getSoloAssetDetails","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"assetName","type":"string"},{"name":"uniqueAssetIdentifier","type":"string"}],"name":"closeSoloAsset","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"assetName","type":"string"},{"name":"uniqueAssetIdentifier","type":"string"}],"name":"isSoloAssetClosed","outputs":[{"name":"isClosed","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"assetType","type":"string"},{"name":"assetName","type":"string"},{"name":"assetId","type":"string"},{"name":"assetUnits","type":"int256"},{"name":"spender","type":"address"}],"name":"approve","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"assetType","type":"string"},{"name":"assetName","type":"string"},{"name":"assetId","type":"string"},{"name":"assetUnits","type":"int256"},{"name":"spender","type":"address"},{"name":"from","type":"address"}],"name":"isApproved","outputs":[{"name":"result","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"assetType","type":"string"},{"name":"assetName","type":"string"},{"name":"assetId","type":"string"},{"name":"assetUnits","type":"int256"},{"name":"from","type":"address"},{"name":"to","type":"address"}],"name":"transferAssetFrom","outputs":[{"name":"result","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"}]);
                                } else if (result1.to == streamsContractAddress) {
                                    abiDecoder.addABI([{"constant":true,"inputs":[],"name":"deployer","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"streamName","type":"string"},{"indexed":false,"name":"streamNameHash","type":"bytes32"},{"indexed":false,"name":"timestamp","type":"uint256"},{"indexed":false,"name":"admin","type":"address"}],"name":"created","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"streamName","type":"string"},{"indexed":false,"name":"streamNameHash","type":"bytes32"},{"indexed":false,"name":"key","type":"string"},{"indexed":false,"name":"data","type":"string"},{"indexed":false,"name":"timestamp","type":"uint256"}],"name":"published","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"streamName","type":"string"},{"indexed":false,"name":"publisher","type":"address"}],"name":"publisherAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"streamName","type":"string"},{"indexed":false,"name":"publisher","type":"address"}],"name":"publisherRemoved","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"streamName","type":"string"},{"indexed":false,"name":"viceAdmin","type":"address"}],"name":"viceAdminAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"streamName","type":"string"},{"indexed":false,"name":"viceAdmin","type":"address"}],"name":"viceAdminRemoved","type":"event"},{"constant":false,"inputs":[{"name":"streamName","type":"string"}],"name":"createStream","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"streamName","type":"string"},{"name":"key","type":"string"},{"name":"data","type":"string"}],"name":"publish","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"streamName","type":"string"},{"name":"publisher","type":"address"}],"name":"addPublisher","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"streamName","type":"string"},{"name":"publisher","type":"address"}],"name":"removePublisher","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"streamName","type":"string"},{"name":"publisher","type":"address"}],"name":"canPublish","outputs":[{"name":"canAddressPublish","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"streamName","type":"string"},{"name":"viceAdmin","type":"address"}],"name":"addViceAdmin","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"streamName","type":"string"},{"name":"viceAdmin","type":"address"}],"name":"removeViceAdmin","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"streamName","type":"string"},{"name":"viceAdmin","type":"address"}],"name":"isViceAdmin","outputs":[{"name":"isAddressViceAdmin","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"streamName","type":"string"}],"name":"getStreamAdmin","outputs":[{"name":"admin","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"function"}]);
                                }

                                let decodedData = abiDecoder.decodeMethod(result1.input);
                                if(decodedData !== undefined) {
                                    result1.decodedinput = decodedData
                                }

                                if(result2.logs.length > 0) {
                                    let decodedLogs = abiDecoder.decodeLogs(result2.logs);

                                    if(decodedLogs[0] !== undefined) {
                                        result2.decodedLogs = decodedLogs
                                    }
                                }

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
        nodeStatus = this.nodeStatusIcon()

		return (
            <div className="content explorer sm-gutter">
                <div className="container-fluid container-fixed-lg m-t-20 p-l-25 p-r-25 p-t-0 p-b-25 sm-padding-10">
                    <div className="row">
                        <div className="col-lg-6 col-sm-12">
                            <div className="row">
                                <div className="col-lg-12 m-b-10">
                                    <Link to={"/app/networks/" + this.props.match.params.id}> Control Panel <i className="fa fa-angle-right"></i></Link> Explorer
                                </div>
                            </div>
                            <div className="row">
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

export default withTracker((props) => {
    return {
        network: Networks.find({instanceId: props.match.params.id}).fetch(),
        subscriptions: [Meteor.subscribe("networks", {
        	onReady: function (){
        		if(Networks.find({instanceId: props.match.params.id}).fetch().length !== 1) {
        			props.history.push("/app/networks");
        		}
        	}
        })],
        workerNodeIP: Config.workerNodeIP,
        workerNodeDomainName: Config.workderNodeDomainName
    }
})(withRouter(Explorer))
