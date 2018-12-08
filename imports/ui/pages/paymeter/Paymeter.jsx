import React, { Component } from "react";
import LaddaButton, { S, SLIDE_UP } from "react-ladda";
import { withTracker } from "meteor/react-meteor-data";
import { withRouter } from "react-router-dom";
import notifications from "../../../modules/notifications";
import { Link } from "react-router-dom";
import Config from "../../../modules/config/client";
import { Wallets } from "../../../collections/wallets/wallets.js";
import helpers from "../../../modules/helpers";
import LoadingIcon from "../../components/LoadingIcon/LoadingIcon.jsx";

import "./Paymeter.scss";

class PaymeterComponent extends Component {
  constructor() {
    super();

    this.state = {
      firstBox: 'create-wallet',
      secondBox: ''
    };
  }

  componentWillUnmount() {
    this.props.subscriptions.forEach(s => {
      s.stop();
    });
  }

  createETHWallet = (e) => {
    e.preventDefault()

    this.setState({
      "createETHWalletLoading": true
    })

    Meteor.call("createWallet", "ETH", this.refs.ethWalletName.value, this.refs.ethWalletNetwork.value, {password: this.refs.ethWalletPassword.value}, (err, r) => {
      if(!err && r) {
        notifications.success("Wallet Created");
      } else {
        notifications.error("An error occured while creating wallet");
      }

      this.setState({
        "createETHWalletLoading": false
      })
    })
  }

  createERC20Wallet = (e) => {
    e.preventDefault();

    this.setState({
      "createERC20WalletLoading": true
    })

    Meteor.call("createWallet", "ERC20", this.refs.erc20WalletName.value, this.refs.erc20WalletNetwork.value, {
      contractAddress: this.refs.erc20ContractAddress.value,
      tokenSymbol: this.refs.erc20Symbol.value,
      password: this.refs.erc20WalletPassword.value
    }, (err, r) => {
      if(!err && r) {
        notifications.success("Wallet Created");
      } else {
        notifications.error("An error occured while creating wallet");
      }

      this.setState({
        "createERC20WalletLoading": false
      })
    })
  }

  getBalance() {
    return 1;
  }

  render() {
    console.log(this.props.wallets)
    return (
      <div className="content full-height paymeter" style={{"paddingBottom": "0px"}}>
        <style>{"\
                .footer{\
                  display:none;\
                }\
              "}
        </style>
        <div className="full-height">
        <nav className="secondary-sidebar light" style={{"backgroundColor": "#f0f0f0"}}>
            <div className=" m-b-30 m-l-30 m-r-30 hidden-sm-down">
              <a onClick={() => {this.setState({firstBox: 'create-wallet', secondBox: ''})}} href="javascript:void(0);" className="btn btn-primary btn-block btn-compose">Create New Wallet</a>
            </div>
            <p className="menu-title">BROWSE</p>
            <ul className="main-menu">
              <li className="">
                <a href="javascript:void(0);" onClick={() => {this.setState({firstBox: 'eth-wallets', secondBox: ''})}}>
                  <span className="title"><i className="fa fa-chain-broken"></i> ETH Wallets</span>
                  <span className="badge pull-right">{this.props.totalETHWallets}</span>
                </a>
              </li>
              <li>
                <a href="javascript:void(0);" onClick={() => {this.setState({firstBox: 'erc20-wallets', secondBox: ''})}}>
                  <span className="title"><i className="fa fa-code"></i> ERC20 Wallets</span>
                  <span className="badge pull-right">{this.props.totalERC20Wallets}</span>
                </a>
              </li>
            </ul>
            <p className="menu-title m-t-20 all-caps">Others</p>
            <ul className="main-menu">
              <li className="">
                <a href="javascript:void(0);">
                  <span className="title"><i className="fa fa-credit-card"></i> Billing</span>
                </a>
              </li>
              <li>
                <a href="javascript:void(0);">
                  <span className="title"><i className="fa fa-sliders"></i> Settings</span>
                </a>
              </li>
            </ul>
          </nav>
          <div className="inner-content full-height">
            <div className="split-view">
              <div className="split-list">
                <div data-email="list" className=" boreded no-top-border">
                  {this.state.firstBox === 'create-wallet' && 
                    <div style={{"padding": "20px"}}>
                      <div className="btn-group btn-group-justified row w-100 create-wallet-btn">
                        <div className="btn-group col-12 p-0">
                          <button type="button" className="btn btn-default w-100" onClick={() => {this.setState({firstBox: 'create-wallet', secondBox: 'create-eth-wallet'})}}>
                            <span className="p-t-5 p-b-5">
                                <i className="fa fa-plus fs-15"></i>
                            </span>
                            <br />
                            <span className="fs-11 font-montserrat text-uppercase">Ethereum</span>
                          </button>
                        </div>
                      </div>
                      <div className="btn-group btn-group-justified row w-100 create-wallet-btn">
                        <div className="btn-group col-12 p-0">
                          <button type="button" className="btn btn-default w-100" onClick={() => {this.setState({firstBox: 'create-wallet', secondBox: 'create-erc20-wallet'})}}>
                            <span className="p-t-5 p-b-5">
                                <i className="fa fa-plus fs-15"></i>
                            </span>
                            <br />
                            <span className="fs-11 font-montserrat text-uppercase">ERC20</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  }

                  {this.state.firstBox === 'eth-wallets' && 
                      <div>
                        {this.props.wallets.map(wallet => {
                            return (
                              <div key={wallet._id} className="wallet-list-item">
                                {wallet.coinType === 'ETH' &&
                                  <div data-index="0" className="company-stat-box m-t-15 active padding-20 wallet-box-bg">
                                    <div>
                                      <p className="company-name pull-left text-uppercase bold no-margin">
                                        {wallet.network === 'testnet' &&
                                          <span className="fa fa-circle text-warning fs-11"></span>
                                        }

                                        {wallet.network === 'mainnet' &&
                                          <span className="fa fa-circle text-success fs-11"></span>
                                        }

                                        &nbsp;{wallet.walletName}
                                      </p>
                                      <small className="hint-text m-l-10">{wallet._id}</small>
                                      <div className="clearfix"></div>
                                    </div>
                                    <div className="m-t-10">
                                      <p className="pull-left small hint-text no-margin p-t-5">{helpers.timeConverter(wallet.createdAt / 1000)}</p>
                                      <div className="pull-right">
                                        <p className="small hint-text no-margin inline">{/*ICO Coin Symbol*/}</p>
                                        <span className=" label label-info p-t-5 m-l-5 p-b-5 inline fs-12">{wallet.balance} ETH</span>
                                      </div>
                                      <div className="clearfix"></div>
                                    </div>
                                  </div>
                                }
                              </div>
                            )
                        })}
                      </div>
                    }

                    {this.state.firstBox === 'erc20-wallets' && 
                      <div>
                        {this.props.wallets.map(wallet => {
                            return (
                              <div key={wallet._id} className="wallet-list-item">
                                {wallet.coinType === 'ERC20' &&
                                  <div data-index="0" className="company-stat-box m-t-15 active padding-20 wallet-box-bg">
                                    <div>
                                      <p className="company-name pull-left text-uppercase bold no-margin">
                                        {wallet.network === 'testnet' &&
                                          <span className="fa fa-circle text-warning fs-11"></span>
                                        }

                                        {wallet.network === 'mainnet' &&
                                          <span className="fa fa-circle text-success fs-11"></span>
                                        }

                                        &nbsp;{wallet.walletName}
                                      </p>
                                      <small className="hint-text m-l-10">{wallet._id}</small>
                                      <div className="clearfix"></div>
                                    </div>
                                    <div className="m-t-10">
                                      <p className="pull-left small hint-text no-margin p-t-5">{helpers.timeConverter(wallet.createdAt / 1000)}</p>
                                      <div className="pull-right">
                                        <p className="small hint-text no-margin inline">{/*ICO Coin Symbol*/}</p>
                                        <span className=" label label-info p-t-5 m-l-5 p-b-5 inline fs-12">{wallet.balance} {wallet.tokenSymbol}</span>
                                      </div>
                                      <div className="clearfix"></div>
                                    </div>
                                  </div>
                                }
                              </div>
                            )
                        })}
                      </div>
                    }
                </div>
              </div>
              <div data-email="opened" className="split-details">
                {this.state.secondBox === '' && 
                  <div className="no-result">
                    <h1>Build Wallets using Paymeter</h1>
                  </div>
                }

                {this.state.secondBox === 'create-eth-wallet' &&
                  <div className="card card-default full-height" style={{"marginBottom": "0px", "borderTop": "0px"}}>
                    <div className="card-block" >
                      <h5>
                        Create New Ethereum Wallet
                      </h5>
                      <form className="" role="form" onSubmit={(e) => {this.createETHWallet(e)}}>
                        <div className="form-group form-group-default required ">
                          <label>Wallet Name</label>
                          <input type="text" className="form-control" required ref="ethWalletName" />
                        </div>
                        <div className="form-group form-group-default required ">
                          <label>Password</label>
                          <input type="password" className="form-control" required ref="ethWalletPassword" />
                        </div>
                        <div className="form-group form-group-default required ">
                          <label>Network</label>
                          <select className="form-control" ref="ethWalletNetwork">
                            <option value={"testnet"} key={"testnet"}>Kovan</option>
                            <option value={"mainnet"} key={"mainnet"}>Mainnet</option>
                          </select>
                        </div>
                        <LaddaButton
                          loading={this.state.createETHWalletLoading}
                          data-size={S}
                          data-style={SLIDE_UP}
                          data-spinner-size={30}
                          data-spinner-lines={12}
                          className="btn btn-complete btn-cons m-t-10"
                          type="submit"
                        >
                          <i className="fa fa-plus" aria-hidden="true" />
                          &nbsp;&nbsp;Create
                        </LaddaButton>
                      </form>
                    </div>
                  </div>
                }

                {this.state.secondBox === 'create-erc20-wallet' &&
                  <div className="card card-default full-height" style={{"marginBottom": "0px", "borderTop": "0px"}}>
                    <div className="card-block" >
                      <h5>
                        Create New Ethereum Wallet
                      </h5>
                      <form className="" role="form" onSubmit={(e) => {this.createERC20Wallet(e)}}>
                        <div className="form-group form-group-default required ">
                          <label>Wallet Name</label>
                          <input type="text" className="form-control" required ref="erc20WalletName" />
                        </div>
                        <div className="form-group form-group-default required ">
                          <label>ERC20 Contract Address</label>
                          <input type="text" className="form-control" required ref="erc20ContractAddress" />
                        </div>
                        <div className="form-group form-group-default required ">
                          <label>Token Symbol</label>
                          <input type="text" className="form-control" required ref="erc20Symbol" />
                        </div>
                        <div className="form-group form-group-default required ">
                          <label>Password</label>
                          <input type="password" className="form-control" required ref="erc20WalletPassword" />
                        </div>
                        <div className="form-group form-group-default required ">
                          <label>Network</label>
                          <select className="form-control" ref="erc20WalletNetwork">
                            <option value={"testnet"} key={"testnet"}>Kovan</option>
                            <option value={"mainnet"} key={"mainnet"}>Mainnet</option>
                          </select>
                        </div>
                        <LaddaButton
                          loading={this.state.createERC20WalletLoading}
                          data-size={S}
                          data-style={SLIDE_UP}
                          data-spinner-size={30}
                          data-spinner-lines={12}
                          className="btn btn-complete btn-cons m-t-10"
                          type="submit"
                        >
                          <i className="fa fa-plus" aria-hidden="true" />
                          &nbsp;&nbsp;Create
                        </LaddaButton>
                      </form>
                    </div>
                  </div>
                }
                
              </div>
              <div className="compose-wrapper hidden-md-up">
                <a className="compose-email text-info pull-right m-r-10 m-t-10" href="email_compose.html"><i className="fa fa-pencil-square-o"></i></a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withTracker(props => {
  return {
    workerNodeIP: Config.workerNodeIP,
    workerNodeDomainName: Config.workerNodeDomainName,
    wallets: Wallets.find({}).fetch(),
    totalETHWallets: Wallets.find({coinType: "ETH"}).count(),
    totalERC20Wallets: Wallets.find({coinType: "ERC20"}).count(),
    subscriptions: [Meteor.subscribe("wallets")]
  };
})(withRouter(PaymeterComponent));
