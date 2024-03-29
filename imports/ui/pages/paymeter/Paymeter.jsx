import React, { Component } from 'react';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter } from 'react-router-dom';
import notifications from '../../../modules/notifications';
import Config from '../../../modules/config/client';
import { Wallets } from '../../../collections/wallets/wallets.js';
import helpers from '../../../modules/helpers';
let QRCode = require('qrcode.react');
import ReactHtmlParser, { processNodes, convertNodeToElement, htmlparser2 } from 'react-html-parser';
import WebHook from '../../../collections/webhooks';
import { Paymeter } from '../../../collections/paymeter/paymeter.js';
import PaymeterPricing from '../../../collections/pricing/paymeter';
import moment from 'moment';

import './Paymeter.scss';

class PaymeterComponent extends Component {
  constructor() {
    super();

    this.state = {
      firstBox: 'create-wallet',
      secondBox: '',
      secondBoxData: '',
      transferEthFeeChecked: true,
      transferErc20FeeChecked: true,
    };
  }

  componentWillUnmount() {
    this.props.subscriptions.forEach(s => {
      s.stop();
    });
  }

  handleTransferEthFee() {
    this.setState({
      transferEthFeeChecked: !this.state.transferEthFeeChecked,
    });
  }

  handleTransferErc20Fee() {
    this.setState({
      transferErc20FeeChecked: !this.state.transferErc20FeeChecked,
    });
  }

  createETHWallet = e => {
    e.preventDefault();

    this.setState({
      createETHWalletLoading: true,
    });
    Meteor.call(
      'createWallet',
      'ETH',
      this.refs.ethWalletName.value,
      this.refs.ethWalletNetwork.value,
      {
        password: this.refs.ethWalletPassword.value,
      },
      (error, r) => {
        console.log(error, r);
        if (!error && r) {
          notifications.success('Wallet Created');
        } else {
          notifications.error(error.reason);
        }

        this.setState({
          createETHWalletLoading: false,
        });
      }
    );
  };

  refreshBalance = walletId => {
    Meteor.call('refreshBalance', walletId, err => {
      if (!err) {
        notifications.success('Wallet refreshed');
      } else {
        notifications.error('An error occured');
      }
    });
  };

  transferETH = (e, walletId) => {
    e.preventDefault();

    this.setState({
      transferEthLoading: true,
    });

    Meteor.call(
      'transferWallet',
      walletId,
      this.refs.transferEthAddress.value,
      this.refs.transferEthAmount.value,
      {
        password: this.refs.transferEthPassword.value,
        sendExactAmount: !this.refs.transferEthFee.checked,
      },
      (error, txnHash) => {
        if (error) {
          notifications.error(error.reason);
        } else {
          notifications.success('Transaction Sent');
        }

        this.setState({
          transferEthLoading: false,
        });
      }
    );
  };

  applyPromotionalCode = () => {
    this.setState({
      applyPromotionalCodeLoading: true,
    });
    Meteor.call('applyVoucherCode', { userId: Meteor.userId(), type: 'paymeter', code: this.promotionalCode.value }, (err, res) => {
      this.setState({
        applyPromotionalCodeLoading: false,
      });
      if (err) {
        return notifications.error(err.reason);
      }
      return notifications.success('Applied successfully');
    });
  };

  transferERC20 = (e, walletId) => {
    e.preventDefault();

    this.setState({
      transferErc20Loading: true,
    });

    Meteor.call(
      'transferWallet',
      walletId,
      this.refs.transferErc20Address.value,
      this.refs.transferErc20Amount.value,
      {
        feeWalletId: walletId === this.refs.erc20FeeWallet.value ? null : this.refs.erc20FeeWallet.value,
        password: this.refs.transferErc20Password.value,
        feeWalletPassword: this.refs.transferErc20FeePassword.value,
        feeCollectWalletId: this.refs.erc20FeeCollectWallet.value === '' ? null : this.refs.erc20FeeCollectWallet.value,
        tokenValueInEth: this.refs.erc20FeeCollectPrice.value,
        sendExactAmount: !this.refs.transferErc20Fee.checked,
      },
      (error, txnHash) => {
        if (error) {
          notifications.error(error.reason);
        } else {
          notifications.success('Transaction Sent');
        }

        this.setState({
          transferErc20Loading: false,
        });
      }
    );
  };

  createERC20Wallet = e => {
    e.preventDefault();

    this.setState({
      createERC20WalletLoading: true,
    });

    Meteor.call(
      'createWallet',
      'ERC20',
      this.refs.erc20WalletName.value,
      this.refs.erc20WalletNetwork.value,
      {
        contractAddress: this.refs.erc20ContractAddress.value,
        tokenSymbol: this.refs.erc20Symbol.value,
        password: this.refs.erc20Password.value,
      },
      (err, r) => {
        if (!err && r) {
          notifications.success('Wallet Created');
        } else {
          notifications.error('An error occured while creating wallet');
        }

        this.setState({
          createERC20WalletLoading: false,
        });
      }
    );
  };

  updateURL = e => {
    e.preventDefault();

    this.setState({
      ['_notifications_formloading']: true,
      ['_notifications_formSubmitError']: '',
    });

    Meteor.call('updateCallbackURLPayment', this.refs._notifications_paymeterUrl.value, error => {
      if (!error) {
        this.setState({
          ['_notifications_formloading']: false,
          ['_notifications_formSubmitError']: '',
        });

        notifications.success('URL Updated');
      } else {
        this.setState({
          ['_notifications_formloading']: false,
          ['_notifications_formSubmitError']: error.reason,
        });
      }
    });
  };

  activate = _ => {
    this.setState({
      ['_activate_loading']: true,
    });

    Meteor.call('subscribePaymeter', e => {
      if (e) {
        notifications.error(e.reason);
      } else {
        notifications.success('Subscription Successful');
      }

      this.setState({
        ['_activate_loading']: false,
      });
    });
  };

  deactivate = _ => {
    this.setState({
      ['_activate_loading']: true,
    });

    Meteor.call('unsubscribePaymeter', e => {
      if (e) {
        notifications.error(e.reason);
      } else {
        notifications.success('Unsubscription Successful');
      }

      this.setState({
        ['_activate_loading']: false,
      });
    });
  };

  render() {
    let wallet = null;
    if (this.state.secondBox === 'eth-wallet-management') {
      wallet = Wallets.findOne({
        _id: this.state.secondBoxData.walletId,
      });
    }

    if (this.state.secondBox === 'erc20-wallet-management') {
      wallet = Wallets.findOne({
        _id: this.state.secondBoxData.walletId,
      });
    }

    let notifyURL = '';

    if (this.props.paymeterUserData) {
      notifyURL = this.props.paymeterUserData.notifyURL || '';
    }

    return (
      <div className="content full-height paymeter" style={{ paddingBottom: '0px' }}>
        <style>{'\
                .footer{\
                  display:none;\
                }\
              '}</style>
        <div className="full-height">
          <nav className="secondary-sidebar light" style={{ backgroundColor: '#f0f0f0' }}>
            <div className=" m-b-30 m-l-30 m-r-30 hidden-sm-down">
              <a
                onClick={() => {
                  this.setState({ firstBox: 'create-wallet', secondBox: '' });
                }}
                href="javascript:void(0);"
                className="btn btn-primary btn-block btn-compose"
              >
                Create New Wallet
              </a>
            </div>
            <p className="menu-title">BROWSE</p>
            <ul className="main-menu">
              <li className="">
                <a
                  href="javascript:void(0);"
                  onClick={() => {
                    this.setState({ firstBox: 'eth-wallets', secondBox: '' });
                  }}
                >
                  <span className="title">
                    <i className="fa fa-chain-broken" /> ETH Wallets
                  </span>
                  <span className="badge pull-right">{this.props.totalETHWallets}</span>
                </a>
              </li>
              <li>
                <a
                  href="javascript:void(0);"
                  onClick={() => {
                    this.setState({ firstBox: 'erc20-wallets', secondBox: '' });
                  }}
                >
                  <span className="title">
                    <i className="fa fa-code" /> ERC20 Wallets
                  </span>
                  <span className="badge pull-right">{this.props.totalERC20Wallets}</span>
                </a>
              </li>
            </ul>
            <p className="menu-title m-t-20 all-caps">Others</p>
            <ul className="main-menu">
              <li>
                <a
                  href="javascript:void(0);"
                  onClick={() => {
                    this.setState({ firstBox: 'settings-list', secondBox: '' });
                  }}
                >
                  <span className="title">
                    <i className="fa fa-sliders" /> Settings
                  </span>
                </a>
              </li>
            </ul>
          </nav>
          <div className="inner-content full-height">
            <div className="split-view">
              <div className="split-list">
                <div data-email="list" className=" boreded no-top-border">
                  {this.state.firstBox === 'settings-list' && (
                    <div style={{ padding: '20px' }}>
                      <div className="btn-group btn-group-justified row w-100 create-wallet-btn">
                        <div className="btn-group col-12 p-0">
                          <button
                            type="button"
                            className="btn btn-default w-100"
                            onClick={() => {
                              this.setState({ firstBox: 'settings-list', secondBox: 'notifications' });
                            }}
                          >
                            <span className="p-t-5 p-b-5">
                              <i className="fa fa-bell fs-15" />
                            </span>
                            <br />
                            <span className="fs-11 font-montserrat text-uppercase">Notifications</span>
                          </button>
                        </div>
                      </div>
                      <div className="btn-group btn-group-justified row w-100 create-wallet-btn">
                        <div className="btn-group col-12 p-0">
                          <button
                            type="button"
                            className="btn btn-default w-100"
                            onClick={() => {
                              this.setState({ firstBox: 'settings-list', secondBox: 'activate' });
                            }}
                          >
                            <span className="p-t-5 p-b-5">
                              <i className="fa fa-shopping-cart fs-15" />
                            </span>
                            <br />
                            <span className="fs-11 font-montserrat text-uppercase">Activate/Deactivate</span>
                          </button>
                        </div>
                      </div>
                      <div className="btn-group btn-group-justified row w-100 create-wallet-btn">
                        <div className="btn-group col-12 p-0">
                          <button
                            type="button"
                            className="btn btn-default w-100"
                            onClick={() => {
                              this.setState({ firstBox: 'settings-list', secondBox: 'vouchers' });
                            }}
                          >
                            <span className="p-t-5 p-b-5">
                              <i className="fa fa-shopping-cart fs-15" />
                            </span>
                            <br />
                            <span className="fs-11 font-montserrat text-uppercase">Vouchers</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {this.state.firstBox === 'create-wallet' && (
                    <div style={{ padding: '20px' }}>
                      <div className="btn-group btn-group-justified row w-100 create-wallet-btn">
                        <div className="btn-group col-12 p-0">
                          <button
                            type="button"
                            className="btn btn-default w-100"
                            onClick={() => {
                              this.setState({ firstBox: 'create-wallet', secondBox: 'create-eth-wallet' });
                            }}
                          >
                            <span className="p-t-5 p-b-5">
                              <i className="fa fa-plus fs-15" />
                            </span>
                            <br />
                            <span className="fs-11 font-montserrat text-uppercase">Ethereum</span>
                          </button>
                        </div>
                      </div>
                      <div className="btn-group btn-group-justified row w-100 create-wallet-btn">
                        <div className="btn-group col-12 p-0">
                          <button
                            type="button"
                            className="btn btn-default w-100"
                            onClick={() => {
                              this.setState({ firstBox: 'create-wallet', secondBox: 'create-erc20-wallet' });
                            }}
                          >
                            <span className="p-t-5 p-b-5">
                              <i className="fa fa-plus fs-15" />
                            </span>
                            <br />
                            <span className="fs-11 font-montserrat text-uppercase">ERC20</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {this.state.firstBox === 'eth-wallets' && (
                    <div>
                      {this.props.wallets.map(wallet => {
                        return (
                          <div
                            key={wallet._id}
                            className="wallet-list-item"
                            onClick={() => {
                              this.setState({
                                secondBox: 'eth-wallet-management',
                                secondBoxData: {
                                  walletId: wallet._id,
                                },
                              });
                            }}
                          >
                            {wallet.coinType === 'ETH' && (
                              <div
                                data-index="0"
                                className={`company-stat-box m-t-15 active padding-20 wallet-box-bg ${
                                  this.state.secondBoxData && this.state.secondBoxData.walletId === wallet._id ? 'wallet-box-bg-selected' : ''
                                }`}
                              >
                                <div>
                                  <p className="company-name pull-left text-uppercase bold no-margin">
                                    {wallet.network === 'testnet' && <span className="fa fa-circle text-warning fs-11" />}
                                    {wallet.network === 'mainnet' && <span className="fa fa-circle text-success fs-11" />}
                                    &nbsp;{wallet.walletName}
                                  </p>
                                  <small className="hint-text m-l-10">{wallet._id}</small>
                                  <div className="clearfix" />
                                </div>
                                <div className="m-t-10">
                                  <p className="pull-left small hint-text no-margin p-t-5">{helpers.timeConverter(wallet.createdAt / 1000)}</p>
                                  <div className="pull-right">
                                    <p className="small hint-text no-margin inline">{/*ICO Coin Symbol*/}</p>
                                    <span className=" label label-info p-t-5 m-l-5 p-b-5 inline fs-12">{wallet.confirmedBalance || '0'} ETH</span>
                                  </div>
                                  <div className="clearfix" />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {this.state.firstBox === 'erc20-wallets' && (
                    <div>
                      {this.props.wallets.map(wallet => {
                        return (
                          <div
                            key={wallet._id}
                            className="wallet-list-item"
                            onClick={() => {
                              this.setState({
                                secondBox: 'erc20-wallet-management',
                                secondBoxData: {
                                  walletId: wallet._id,
                                },
                              });
                            }}
                          >
                            {wallet.coinType === 'ERC20' && (
                              <div
                                data-index="0"
                                className={`company-stat-box m-t-15 active padding-20 wallet-box-bg ${
                                  this.state.secondBoxData && this.state.secondBoxData.walletId === wallet._id ? 'wallet-box-bg-selected' : ''
                                }`}
                              >
                                <div>
                                  <p className="company-name pull-left text-uppercase bold no-margin">
                                    {wallet.network === 'testnet' && <span className="fa fa-circle text-warning fs-11" />}
                                    {wallet.network === 'mainnet' && <span className="fa fa-circle text-success fs-11" />}
                                    &nbsp;{wallet.walletName}
                                  </p>
                                  <small className="hint-text m-l-10">{wallet._id}</small>
                                  <div className="clearfix" />
                                </div>
                                <div className="m-t-10">
                                  <p className="pull-left small hint-text no-margin p-t-5">{helpers.timeConverter(wallet.createdAt / 1000)}</p>
                                  <div className="pull-right">
                                    <p className="small hint-text no-margin inline">{/*ICO Coin Symbol*/}</p>
                                    <span className=" label label-info p-t-5 m-l-5 p-b-5 inline fs-12">
                                      {wallet.confirmedBalance || '0'} {wallet.tokenSymbol}
                                    </span>
                                  </div>
                                  <div className="clearfix" />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <div data-email="opened" className="split-details p-t-20 p-l-20 p-r-20">
                {this.state.secondBox === '' && (
                  <div className="no-result">
                    <h1>Build Wallets using Paymeter</h1>
                  </div>
                )}

                {this.state.secondBox === 'notifications' && (
                  <div className="card card-default" style={{ marginBottom: '0px', borderTop: '0px' }}>
                    <div className="card-block">
                      <form
                        role="form"
                        onSubmit={e => {
                          this.updateURL(e);
                        }}
                      >
                        {this.props.user && (
                          <div className="form-group form-group-default required ">
                            <label>Paymeter Notifications Webhook URL</label>
                            <input
                              placeholder="https://example.com/wallet"
                              type="text"
                              defaultValue={notifyURL}
                              className="form-control"
                              required
                              ref="_notifications_paymeterUrl"
                            />
                          </div>
                        )}

                        {this.state['_notifications_formSubmitError'] && (
                          <div className="row m-t-30">
                            <div className="col-md-12">
                              <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                <button className="close" data-dismiss="alert" />
                                {this.state['_notifications_formSubmitError']}
                              </div>
                            </div>
                          </div>
                        )}

                        <LaddaButton
                          loading={this.state['_notifications_formloading']}
                          data-size={S}
                          data-style={SLIDE_UP}
                          data-spinner-size={30}
                          data-spinner-lines={12}
                          className="btn btn-complete  btn-cons m-t-10"
                          type="submit"
                        >
                          <i className="fa fa-upload" aria-hidden="true" />
                          &nbsp;&nbsp;Update
                        </LaddaButton>
                      </form>
                    </div>
                  </div>
                )}

                {this.state.secondBox === 'activate' && (
                  <div className="card card-default" style={{ marginBottom: '0px', borderTop: '0px' }}>
                    <div className="card-block">
                      <div>
                        <div className="tab-pane padding-20 sm-no-padding active slide-left" id="tab1">
                          <div className="row row-same-height">
                            <div className="col-lg-12 sm-b-b">
                              <div className="padding-30 sm-padding-5 sm-m-t-15">
                                <i className="fa fa fa-cube fa-2x hint-text" />
                                <h2>Wallet-as-a-Service</h2>
                                <p>Paymeter let's you integrate ETH and any ERC20 Token Wallets securly in your Crypto based app.</p>
                                <p className="small hint-text">
                                  Note that we don't store the plain private keys of your wallets. The private keys are encrypted with wallet's password which you solely own
                                </p>
                                <div>
                                  <div>
                                    {this.props.paymeterUserData ? (
                                      <div>
                                        {this.props.paymeterUserData.subscribed ? (
                                          <div>
                                            {this.props.paymeterUserData.unsubscribeNextMonth ? (
                                              <LaddaButton
                                                onClick={e => {
                                                  this.activate();
                                                }}
                                                loading={this.state['_activate_loading']}
                                                data-size={S}
                                                data-style={SLIDE_UP}
                                                data-spinner-size={30}
                                                data-spinner-lines={12}
                                                className="btn btn-complete  btn-cons m-t-10"
                                                type="button"
                                              >
                                                <i className="fa fa-check" aria-hidden="true" />
                                                &nbsp;&nbsp;Re-Subscribe
                                              </LaddaButton>
                                            ) : (
                                              <LaddaButton
                                                onClick={e => {
                                                  this.deactivate();
                                                }}
                                                loading={this.state['_activate_loading']}
                                                data-size={S}
                                                data-style={SLIDE_UP}
                                                data-spinner-size={30}
                                                data-spinner-lines={12}
                                                className="btn btn-danger  btn-cons m-t-10"
                                                type="button"
                                              >
                                                <i className="fa fa-times" aria-hidden="true" />
                                                &nbsp;&nbsp;Unsubscribe
                                              </LaddaButton>
                                            )}
                                          </div>
                                        ) : (
                                          <LaddaButton
                                            onClick={e => {
                                              this.activate();
                                            }}
                                            loading={this.state['_activate_loading']}
                                            data-size={S}
                                            data-style={SLIDE_UP}
                                            data-spinner-size={30}
                                            data-spinner-lines={12}
                                            className="btn btn-success  btn-cons m-t-10"
                                            type="button"
                                          >
                                            <i className="fa fa-check" aria-hidden="true" />
                                            &nbsp;&nbsp;Subscribe
                                          </LaddaButton>
                                        )}
                                      </div>
                                    ) : (
                                      <LaddaButton
                                        onClick={e => {
                                          this.activate();
                                        }}
                                        loading={this.state['_activate_loading']}
                                        data-size={S}
                                        data-style={SLIDE_UP}
                                        data-spinner-size={30}
                                        data-spinner-lines={12}
                                        className="btn btn-success  btn-cons m-t-10"
                                        type="button"
                                      >
                                        <i className="fa fa-check" aria-hidden="true" />
                                        &nbsp;&nbsp;Subscribe
                                      </LaddaButton>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div style={{ paddingLeft: '30px', paddingRight: '30px' }}>
                            <hr className="b-dashed" />
                          </div>
                          <div className="row row-same-height">
                            <div className="col-lg-12">
                              <div className="padding-30 sm-padding-5">
                                <h5>Pricing Model</h5>
                                <div className="row">
                                  <div className="col-lg-12">
                                    <p className="no-margin">Internal and External Transactions</p>
                                    <p className="small hint-text">
                                      For internal transactions, only network fee is charged without any service fees. Creating wallets doesn't add extra charges. We deduct the
                                      fees from your added debit/credit card at the end of the month.
                                    </p>
                                  </div>
                                </div>
                                <div className="row">
                                  <div className="col-lg-12">
                                    <p className="no-margin">Monthly Minimum</p>
                                    <p className="small hint-text">
                                      We charge ${this.props.paymeterPricing && this.props.paymeterPricing.minimumMonthlyCost} or total transactions fees at the EOM depending on
                                      whichever is greater
                                    </p>
                                  </div>
                                </div>
                                <table className="table table-condensed">
                                  <tbody>
                                    <tr>
                                      <td className="col-lg-8 col-md-6 col-sm-7 ">
                                        <a href="#" className="remove-item">
                                          <i className="fa fa-check" />
                                        </a>
                                        <span className="m-l-10 font-montserrat fs-11 all-caps no-hidden-text">Deposit from External Wallet</span>
                                      </td>
                                      <td className=" col-lg-2 col-md-3 col-sm-3 text-right">
                                        <span className="no-hidden-text">Each Txn</span>
                                      </td>
                                      <td className=" col-lg-2 col-md-3 col-sm-2 text-right">
                                        <h4 className="text-primary no-margin font-montserrat no-hidden-text">
                                          {this.props.paymeterPricing && this.props.paymeterPricing.perTransactionCost}%
                                        </h4>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="col-lg-8 col-md-6 col-sm-7 ">
                                        <a href="#" className="remove-item">
                                          <i className="fa fa-check" />
                                        </a>
                                        <span className="m-l-10 font-montserrat fs-11 all-caps no-hidden-text">ERC20 Deposit from External Wallet</span>
                                      </td>
                                      <td className=" col-lg-2 col-md-3 col-sm-3 text-right">
                                        <span className="no-hidden-text">Each Txn, if price not found</span>
                                      </td>
                                      <td className=" col-lg-2 col-md-3 col-sm-2 text-right">
                                        <h4 className="text-primary no-margin font-montserrat no-hidden-text">
                                          ${this.props.paymeterPricing && this.props.paymeterPricing.perTransactionCostFlat}
                                        </h4>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>

                                <br />
                                <div className="p-l-15 p-r-15">
                                  <div className="row b-a b-grey">
                                    {/*<div className="col-md-2 p-l-15 sm-p-t-15 clearfix sm-p-b-15 d-flex flex-column justify-content-center">
                                      <h5 className="font-montserrat all-caps small no-margin hint-text bold">Advance</h5>
                                      <h3 className="no-margin">

                                      </h3>
                                    </div>*/}
                                    <div className="col-md-6 clearfix sm-p-b-15 d-flex flex-column justify-content-center">
                                      <h5 className="font-montserrat all-caps small no-margin hint-text bold">Minimum Fee This Month</h5>
                                      <h3 className="no-margin">
                                        {this.props.paymeterUserData && (
                                          <span>${helpers.getFlooredFixed(parseFloat(this.props.paymeterUserData.minimumFeeThisMonth || '0.00'), 2)}</span>
                                        )}

                                        {!this.props.paymeterUserData && <span>$0.00</span>}
                                      </h3>
                                    </div>
                                    <div className="col-md-6 text-right bg-master-darker col-sm-height padding-15 d-flex flex-column justify-content-center align-items-end">
                                      <h5 className="font-montserrat all-caps small no-margin hint-text text-white bold">Total Deposit Fee This Month</h5>
                                      <h1 className="no-margin text-white">
                                        <span>$</span>
                                        <span>
                                          {this.props.paymeterUserData && (
                                            <span>
                                              <span>
                                                {this.props.paymeterUserData.bill && <span>{helpers.getFlooredFixed(parseFloat(this.props.paymeterUserData.bill), 2)}</span>}
                                              </span>
                                              <span>{!this.props.paymeterUserData.bill && <span>0.00</span>}</span>
                                            </span>
                                          )}

                                          {!this.props.paymeterUserData && <span>0.00</span>}
                                        </span>
                                      </h1>
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
                )}

                {this.state.secondBox === 'create-eth-wallet' && (
                  <div className="card card-default" style={{ marginBottom: '0px', borderTop: '0px' }}>
                    <div className="card-block">
                      <h5>Create New Ethereum Wallet</h5>
                      <form
                        className=""
                        role="form"
                        onSubmit={e => {
                          this.createETHWallet(e);
                        }}
                      >
                        <div className="form-group form-group-default required ">
                          <label>Wallet Name</label>
                          <input type="text" className="form-control" required ref="ethWalletName" />
                        </div>
                        <div className="form-group form-group-default required ">
                          <label>Wallet Password</label>
                          <input type="password" className="form-control" required ref="ethWalletPassword" />
                        </div>
                        <div className="form-group form-group-default required ">
                          <label>Network</label>
                          <select className="form-control" ref="ethWalletNetwork">
                            <option value={'testnet'} key={'testnet'}>
                              Rinkeby
                            </option>
                            <option value={'mainnet'} key={'mainnet'}>
                              Mainnet
                            </option>
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
                )}

                {this.state.secondBox === 'create-erc20-wallet' && (
                  <div className="card card-default" style={{ marginBottom: '0px', borderTop: '0px' }}>
                    <div className="card-block">
                      <h5>Create New ERC20 Wallet</h5>
                      <form
                        className=""
                        role="form"
                        onSubmit={e => {
                          this.createERC20Wallet(e);
                        }}
                      >
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
                          <label>Wallet Password</label>
                          <input type="password" className="form-control" required ref="erc20Password" />
                        </div>
                        <div className="form-group form-group-default required ">
                          <label>Network</label>
                          <select className="form-control" ref="erc20WalletNetwork">
                            <option value={'testnet'} key={'testnet'}>
                              Rinkeby
                            </option>
                            <option value={'mainnet'} key={'mainnet'}>
                              Mainnet
                            </option>
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
                )}

                {this.state.secondBox === 'eth-wallet-management' && (
                  <div className="card card-borderless card-transparent">
                    <ul className="nav nav-tabs nav-tabs-linetriangle" role="tablist" data-init-reponsive-tabs="dropdownfx">
                      <li className="nav-item">
                        <a className="active" href="#" data-toggle="tab" role="tab" data-target="#deposit">
                          Deposit
                        </a>
                      </li>
                      <li className="nav-item">
                        <a className="" href="#" data-toggle="tab" role="tab" data-target="#transfer">
                          Send
                        </a>
                      </li>
                      <li className="nav-item">
                        <a className="" href="#" data-toggle="tab" role="tab" data-target="#withdrawlHistory">
                          Withdrawl History
                        </a>
                      </li>
                      <li className="nav-item">
                        <a className="" href="#" data-toggle="tab" role="tab" data-target="#depositHistory">
                          Deposit History
                        </a>
                      </li>
                    </ul>
                    <div className="tab-content">
                      <div className="tab-pane active" id="deposit">
                        <div className="row">
                          <div className="col-lg-12">
                            <div className="card card-transparent">
                              <div className="card-block" style={{ paddingBottom: '0px' }}>
                                <div className="row row-same-height">
                                  <div className="col-xl-12 sm-b-b">
                                    <div className="p-t-0 p-b-30 p-l-30 p-r-30 sm-padding-5 sm-m-t-15 m-t-50 deposit-box">
                                      <QRCode value={wallet.address} />
                                      <h5>
                                        Deposit Address <br /> <b>{wallet.address}</b>
                                      </h5>
                                      <p className="small hint-text">
                                        <i
                                          className="fa fa-refresh"
                                          aria-hidden="true"
                                          style={{
                                            cursor: 'pointer',
                                          }}
                                          onClick={() => {
                                            this.refreshBalance(wallet._id);
                                          }}
                                        />
                                        &nbsp;15 confirmations are required for balance to update
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="tab-pane" id="transfer">
                        <div className="row">
                          <div className="col-lg-12">
                            <div className="card card-transparent">
                              <div className="card-block" style={{ paddingBottom: '0px' }}>
                                <div className="row row-same-height">
                                  <div className="col-xl-12">
                                    <div className="padding-30 sm-padding-5">
                                      <div className="form-group-attached">
                                        <form role="form" onSubmit={e => this.transferETH(e, this.state.secondBoxData.walletId)}>
                                          <div className="form-group form-group-default m-t-10 required">
                                            <label>To Address</label>
                                            <input type="text" className="form-control" ref="transferEthAddress" />
                                          </div>
                                          <div className="form-group form-group-default m-t-10 required">
                                            <label>Password</label>
                                            <input type="password" className="form-control" ref="transferEthPassword" />
                                          </div>
                                          <div className="form-group form-group-default m-t-10 required">
                                            <label>Amount</label>
                                            <input type="text" className="form-control" ref="transferEthAmount" />
                                          </div>
                                          <div className="checkbox check-success  ">
                                            <input
                                              type="checkbox"
                                              defaultChecked={this.state.transferEthFeeChecked}
                                              ref="transferEthFee"
                                              id="transferEthFee"
                                              onChange={this.handleTransferEthFee.bind(this)}
                                            />
                                            <label htmlFor="transferEthFee">Receiver will pay fee</label>
                                          </div>
                                          <LaddaButton
                                            loading={this.state.transferEthLoading}
                                            data-size={S}
                                            data-style={SLIDE_UP}
                                            data-spinner-size={30}
                                            data-spinner-lines={12}
                                            className="btn btn-complete btn-cons m-t-10"
                                            type="submit"
                                          >
                                            <i className="fa fa-paper-plane" aria-hidden="true" />
                                            &nbsp;&nbsp;Send
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
                      <div className="tab-pane" id="withdrawlHistory">
                        <div className="row">
                          <div className="col-lg-12">
                            <div className="card card-transparent">
                              <div className="card-block" style={{ paddingBottom: '0px' }}>
                                <div className="table-responsive">
                                  <table className="table table-hover" id="basicTable">
                                    <thead>
                                      <tr>
                                        <th style={{ width: '36%' }}>Date</th>
                                        <th style={{ width: '18%' }}>Txn ID</th>
                                        <th style={{ width: '13%' }}>Amount</th>
                                        <th style={{ width: '18%' }}>Fee</th>
                                        <th style={{ width: '17%' }}>To Address</th>
                                        <th style={{ width: '10%' }}>Status</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {wallet.withdrawl_txns.map((item, index) => {
                                        return (
                                          <tr key={item._id}>
                                            <td className="v-align-middle pre-imp ">{helpers.timeConverter(item.createdAt / 1000)}</td>
                                            <td className="v-align-middle ">
                                              {wallet.network === 'testnet' ? (
                                                <a href={`https://rinkeby.etherscan.io/tx/${item.txnId}`} target="_blank">
                                                  {item.txnId}
                                                </a>
                                              ) : (
                                                <a href={`https://etherscan.io/tx/${item.txnId}`} target="_blank">
                                                  {item.txnId}
                                                </a>
                                              )}
                                            </td>
                                            <td className="v-align-middle">{item.amount} ETH</td>
                                            <td className="v-align-middle">{item.fee} ETH</td>
                                            <td className="v-align-middle">
                                              {wallet.network === 'testnet' ? (
                                                <a href={`https://rinkeby.etherscan.io/address/${item.toAddress}`} target="_blank">
                                                  {item.toAddress}
                                                </a>
                                              ) : (
                                                <a href={`https://etherscan.io/address/${item.toAddress}`} target="_blank">
                                                  {item.toAddress}
                                                </a>
                                              )}
                                            </td>
                                            <td className="v-align-middle">{ReactHtmlParser(helpers.convertStatusToTag(item.status, helpers.firstLetterCapital(item.status)))}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="tab-pane" id="depositHistory">
                        <div className="row">
                          <div className="col-lg-12">
                            <div className="card card-transparent">
                              <div className="card-block" style={{ paddingBottom: '0px' }}>
                                <div className="table-responsive">
                                  <table className="table table-hover" id="basicTable">
                                    <thead>
                                      <tr>
                                        <th style={{ width: '36%' }}>Date</th>
                                        <th style={{ width: '18%' }}>Txn ID</th>
                                        <th style={{ width: '13%' }}>Amount</th>
                                        <th style={{ width: '18%' }}>Fee</th>
                                        <th style={{ width: '17%' }}>From Address</th>
                                        <th style={{ width: '10%' }}>Status</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {wallet.deposit_txns.map((item, index) => {
                                        return (
                                          <tr key={item._id}>
                                            <td className="v-align-middle pre-imp ">{helpers.timeConverter(item.createdAt / 1000)}</td>
                                            <td className="v-align-middle ">
                                              {wallet.network === 'testnet' ? (
                                                <a href={`https://rinkeby.etherscan.io/tx/${item.txnId}`} target="_blank">
                                                  {item.txnId}
                                                </a>
                                              ) : (
                                                <a href={`https://etherscan.io/tx/${item.txnId}`} target="_blank">
                                                  {item.txnId}
                                                </a>
                                              )}
                                            </td>
                                            <td className="v-align-middle">{item.amount} ETH</td>
                                            <td className="v-align-middle">${item.usdCharged || '0.00'}</td>
                                            <td className="v-align-middle">
                                              {wallet.network === 'testnet' ? (
                                                <a href={`https://rinkeby.etherscan.io/address/${item.fromAddress}`} target="_blank">
                                                  {item.fromAddress}
                                                </a>
                                              ) : (
                                                <a href={`https://etherscan.io/address/${item.fromAddress}`} target="_blank">
                                                  {item.fromAddress}
                                                </a>
                                              )}
                                            </td>
                                            <td className="v-align-middle">{ReactHtmlParser(helpers.convertStatusToTag(item.status, helpers.firstLetterCapital(item.status)))}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {this.state.secondBox === 'vouchers' && (
                  <div className="card card-default" style={{ marginBottom: '0px', borderTop: '0px' }}>
                    <div className="card-block">
                      <h5 className="text-primary">Apply Voucher Codes</h5>
                      <form className="" role="form">
                        <div className="form-group form-group-default required ">
                          <label>Promotional Code</label>
                          <input type="text" className="form-control" required ref={i => (this.promotionalCode = i)} />
                        </div>
                        <LaddaButton
                          loading={this.state.applyPromotionalCodeLoading}
                          data-size={S}
                          data-style={SLIDE_UP}
                          data-spinner-size={30}
                          data-spinner-lines={12}
                          className="btn btn-complete btn-cons m-t-10"
                          onClick={this.applyPromotionalCode}
                        >
                          <i className="fa fa-check" aria-hidden="true" />
                          &nbsp;&nbsp;Redeem
                        </LaddaButton>
                      </form>
                    </div>

                    <div className="card-block">
                      <h6 className="text-primary">Redeemed codes</h6>
                      <br />
                      <ul>
                        {this.props.paymeterUserData &&
                          this.props.paymeterUserData.vouchers &&
                          this.props.paymeterUserData.vouchers.map(voucher => {
                            return (
                              <li>
                                <b>{voucher.code}</b> | {moment(voucher.appliedOn).format('DD-MMM-YYYY')}
                              </li>
                            );
                          })}
                      </ul>
                    </div>
                  </div>
                )}

                {this.state.secondBox === 'erc20-wallet-management' && (
                  <div className="card card-borderless card-transparent">
                    <ul className="nav nav-tabs nav-tabs-linetriangle" role="tablist" data-init-reponsive-tabs="dropdownfx">
                      <li className="nav-item">
                        <a className="active" href="#" data-toggle="tab" role="tab" data-target="#deposit">
                          Deposit
                        </a>
                      </li>
                      <li className="nav-item">
                        <a className="" href="#" data-toggle="tab" role="tab" data-target="#transfer">
                          Send
                        </a>
                      </li>
                      <li className="nav-item">
                        <a className="" href="#" data-toggle="tab" role="tab" data-target="#withdrawlHistory">
                          Withdrawl History
                        </a>
                      </li>
                      <li className="nav-item">
                        <a className="" href="#" data-toggle="tab" role="tab" data-target="#depositHistory">
                          Deposit History
                        </a>
                      </li>
                    </ul>
                    <div className="tab-content">
                      <div className="tab-pane active" id="deposit">
                        <div className="row">
                          <div className="col-lg-12">
                            <div className="card card-transparent">
                              <div className="card-block" style={{ paddingBottom: '0px' }}>
                                <div className="row row-same-height">
                                  <div className="col-md-12 sm-b-b">
                                    <div className="p-t-0 p-b-30 p-l-30 p-r-30 sm-padding-5 sm-m-t-15 m-t-50 deposit-box ">
                                      <QRCode value={wallet.address} />
                                      <h5>
                                        Deposit Address: <br /> <b>{wallet.address}</b>
                                      </h5>
                                      <p className="small hint-text">
                                        <i
                                          className="fa fa-refresh"
                                          aria-hidden="true"
                                          style={{
                                            cursor: 'pointer',
                                          }}
                                          onClick={() => {
                                            this.refreshBalance(wallet._id);
                                          }}
                                        />
                                        15 confirmations are required for balance to update
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="tab-pane" id="transfer">
                        <div className="row">
                          <div className="col-lg-12">
                            <div className="card card-transparent">
                              <div className="card-block" style={{ paddingBottom: '0px' }}>
                                <div className="row row-same-height">
                                  <div className="col-md-12">
                                    <div className="padding-30 sm-padding-5">
                                      <div className="form-group-attached">
                                        <form role="form" onSubmit={e => this.transferERC20(e, this.state.secondBoxData.walletId)}>
                                          <div className="row">
                                            <div className="col-md-12">
                                              <div className="form-group form-group-default m-t-10 required">
                                                <label>To Address</label>
                                                <input type="text" className="form-control" ref="transferErc20Address" required />
                                              </div>
                                            </div>
                                          </div>
                                          <div className="row">
                                            <div className="col-md-12">
                                              <div className="form-group form-group-default m-t-10 required">
                                                <label>Amount</label>
                                                <input type="text" className="form-control" ref="transferErc20Amount" required />
                                              </div>
                                            </div>
                                          </div>
                                          <div className="form-group form-group-default m-t-10 required">
                                            <label>
                                              Fee Address <small>{'Account to Pay Fee from'}</small>
                                            </label>
                                            <select className="form-control" ref="erc20FeeWallet">
                                              <option key={wallet._id} value={wallet._id}>
                                                {wallet.walletName} (Pay from same wallet)
                                              </option>
                                              {this.props.wallets.map(temp_wallet => {
                                                if (temp_wallet.coinType === 'ETH' && temp_wallet.network === wallet.network) {
                                                  return (
                                                    <option key={temp_wallet._id} value={temp_wallet._id}>
                                                      {temp_wallet.walletName}
                                                    </option>
                                                  );
                                                }
                                              })}
                                            </select>
                                          </div>
                                          <div className="row">
                                            <div className="col-md-6">
                                              <div className="form-group form-group-default m-t-10 required">
                                                <label>Wallet Password</label>
                                                <input type="password" className="form-control" ref="transferErc20Password" required />
                                              </div>
                                            </div>
                                            <div className="col-md-6">
                                              <div className="form-group form-group-default m-t-10">
                                                <label>Gas Wallet Password</label>
                                                <input type="password" className="form-control" ref="transferErc20FeePassword" />
                                              </div>
                                            </div>
                                          </div>
                                          <div className="row">
                                            <div className="col-md-12">
                                              <div className="form-group form-group-default m-t-10">
                                                <label>Fee Collect Wallet</label>
                                                <select className="form-control" ref="erc20FeeCollectWallet">
                                                  <option key={''} value={''}>
                                                    Don't collect fee
                                                  </option>
                                                  {this.props.wallets.map(temp_wallet => {
                                                    if (temp_wallet.coinType === 'ERC20' && temp_wallet.tokenSymbol === wallet.tokenSymbol) {
                                                      if (temp_wallet._id !== wallet._id) {
                                                        return (
                                                          <option key={temp_wallet._id} value={temp_wallet._id}>
                                                            {temp_wallet.walletName}
                                                          </option>
                                                        );
                                                      }
                                                    }
                                                  })}
                                                </select>
                                              </div>
                                            </div>
                                          </div>
                                          <div className="row">
                                            <div className="col-md-12">
                                              <div className="form-group form-group-default m-t-10">
                                                <label>
                                                  Token Price in ETH <small>(1 {wallet.tokenSymbol} = ? ETH)</small>
                                                </label>
                                                <input type="text" className="form-control" ref="erc20FeeCollectPrice" />
                                              </div>
                                            </div>
                                          </div>

                                          <div className="checkbox check-success  ">
                                            <input
                                              type="checkbox"
                                              defaultChecked={this.state.transferErc20FeeChecked}
                                              ref="transferErc20Fee"
                                              id="transferErc20Fee"
                                              onChange={this.handleTransferErc20Fee.bind(this)}
                                            />
                                            <label htmlFor="transferErc20Fee">Receiver will pay fee</label>
                                          </div>

                                          <LaddaButton
                                            loading={this.state.transferErc20Loading}
                                            data-size={S}
                                            data-style={SLIDE_UP}
                                            data-spinner-size={30}
                                            data-spinner-lines={12}
                                            className="btn btn-complete btn-cons m-t-10"
                                            type="submit"
                                          >
                                            <i className="fa fa-paper-plane" aria-hidden="true" />
                                            &nbsp;&nbsp;Send
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
                      <div className="tab-pane" id="withdrawlHistory">
                        <div className="row">
                          <div className="col-lg-12">
                            <div className="card card-transparent">
                              <div className="card-block" style={{ paddingBottom: '0px' }}>
                                <div className="table-responsive">
                                  <table className="table table-hover" id="basicTable">
                                    <thead>
                                      <tr>
                                        <th style={{ width: '36%' }}>Date</th>
                                        <th style={{ width: '18%' }}>Txn ID</th>
                                        <th style={{ width: '13%' }}>Amount</th>
                                        <th style={{ width: '18%' }}>Fee</th>
                                        <th style={{ width: '17%' }}>To Address</th>
                                        <th style={{ width: '10%' }}>Status</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {wallet.withdrawl_txns.map((item, index) => {
                                        return (
                                          <tr key={item._id}>
                                            <td className="v-align-middle pre-imp ">{helpers.timeConverter(item.createdAt / 1000)}</td>
                                            <td className="v-align-middle ">{item.txnId}</td>
                                            <td className="v-align-middle">
                                              {item.amount} {wallet.tokenSymbol}
                                            </td>
                                            <td className="v-align-middle">{item.fee} ETH</td>
                                            <td className="v-align-middle">{item.toAddress}</td>
                                            <td className="v-align-middle">{ReactHtmlParser(helpers.convertStatusToTag(item.status, helpers.firstLetterCapital(item.status)))}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="tab-pane" id="depositHistory">
                        <div className="row">
                          <div className="col-lg-12">
                            <div className="card card-transparent">
                              <div className="card-block" style={{ paddingBottom: '0px' }}>
                                <div className="table-responsive">
                                  <table className="table table-hover" id="basicTable">
                                    <thead>
                                      <tr>
                                        <th style={{ width: '36%' }}>Date</th>
                                        <th style={{ width: '18%' }}>Txn ID</th>
                                        <th style={{ width: '13%' }}>Amount</th>
                                        <th style={{ width: '18%' }}>Fee</th>
                                        <th style={{ width: '17%' }}>From Address</th>
                                        <th style={{ width: '10%' }}>Status</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {wallet.deposit_txns.map((item, index) => {
                                        return (
                                          <tr key={item._id}>
                                            <td className="v-align-middle pre-imp ">{helpers.timeConverter(item.createdAt / 1000)}</td>
                                            <td className="v-align-middle ">{item.txnId}</td>
                                            <td className="v-align-middle">
                                              {item.amount} {wallet.tokenSymbol}
                                            </td>
                                            <td className="v-align-middle">${item.usdCharged || '0.00'}</td>
                                            <td className="v-align-middle">{item.fromAddress}</td>
                                            <td className="v-align-middle">{ReactHtmlParser(helpers.convertStatusToTag(item.status, helpers.firstLetterCapital(item.status)))}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="compose-wrapper hidden-md-up">
                <a className="compose-email text-info pull-right m-r-10 m-t-10" href="email_compose.html">
                  <i className="fa fa-pencil-square-o" />
                </a>
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
    totalETHWallets: Wallets.find({ coinType: 'ETH' }).count(),
    totalERC20Wallets: Wallets.find({ coinType: 'ERC20' }).count(),
    subscriptions: [Meteor.subscribe('paymeter_user_data'), Meteor.subscribe('wallets')],
    user: Meteor.user(),
    webhooks: WebHook.find({}).fetch(),
    paymeterUserData: Paymeter.findOne({ userId: Meteor.userId() }),
    paymeterPricing: PaymeterPricing.find({ active: true }).fetch()[0],
  };
})(withRouter(PaymeterComponent));
