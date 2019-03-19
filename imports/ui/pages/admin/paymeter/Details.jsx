import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import helpers from '../../../../modules/helpers';
import { withRouter } from 'react-router-dom';
import { Link } from 'react-router-dom';
import moment from 'moment';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';
import { Paymeter } from '../../../../collections/paymeter/paymeter';
import notifications from '../../../../modules/notifications';
import ConfirmationButton from '../../../components/Buttons/ConfirmationButton';
import EditableText from '../../../components/EditableText/EditableText';
import { Wallets } from '../../../../collections/wallets/wallets';
import { WalletTransactions } from '../../../../collections/walletTransactions/walletTransactions';

class PaymeterDetails extends Component {
  constructor(props) {
    super(props);

    this.state = {
      locations: [],
      page: 0,
      wallets: [],
      walletTransactions: [],
      txns: [],
      displayWallets: [],
    };

    this.subscriptionTypes = [];
    this.subscriptions = [];
  }

  updateUser = () => {
    const user = Meteor.users.find({ _id: this.props.paymeter.userId }).fetch()[0];
    const wallets = Wallets.find({ user: user._id }).fetch();
    const walletTransactions = WalletTransactions.find({ $or: [{ fromWallet: { $in: wallets.map(w => w._id) } }, { toWallet: { $in: wallets.map(w => w._id) } }] }).fetch();
    this.setState({
      user,
      wallets,
      displayWallets: wallets,
      walletTransactions,
      txns: walletTransactions,
    });
  };

  componentDidMount() {
    window.addEventListener('paymeter-loaded', this.updateUser);
  }

  componentWillUnmount() {
    this.props.subscriptions.forEach(s => s.stop());
    window.removeEventListener('paymeter-loaded', this.updateUser);
  }

  copyText = text => {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    notifications.success('Link copied');
  };

  adminApplyVoucher = () => {
    if (!this.voucher.value) {
      console.log('Code required');
      return false;
    }
    this.setState({
      adminApplyVoucherLoading: true,
    });
    Meteor.call('adminVoucherApply', { userId: this.props.user._id, code: this.voucher.value, type: 'paymeter' }, (err, res) => {
      this.setState({
        adminApplyVoucherLoading: false,
      });
      if (err) {
        return notifications.error(err.reason);
      }
      this.refresh();
      notifications.success('Code Applied');
    });
  };

  modalEventFns = (open, close) => {
    this.openTxnModal = open;
    this.closeTxnModal = close;
  };

  minimumBillChangeListener = value => {
    if (!value || isNaN(Number(value))) {
      notifications.error('Invalid amount');
      return false;
    }
    Meteor.call('adminChangeMinimumPaymeterBill', { paymeter: this.props.match.params.id, value }, (err, res) => {
      if (err) {
        return notifications.error(err.reason);
      }
      notifications.success('Updated');
    });
  };

  showTxnDetails = txnId => {
    const txn = WalletTransactions.find({ _id: txnId }).fetch()[0];
    if (!txn) {
      return this.setState({ txnDetails: 'Txn not found' });
    }
    this.setState({
      txnDetails: {
        'Transaction Id': txn.txnId,
        'From Wallet': txn.fromWallet,
        'To Wallet': txn.toWallet,
        'To Address': txn.toAddress,
        Type: txn.type,
        Status: txn.status,
        'Is Internal Txn': txn.isInternalTxn,
        Fee: txn.fee,
        Amount: txn.amount,
        'Raw Tx': txn.rawTx,
        'USD Charged': txn.usdCharged,
      },
    });
  };

  onSelectWallet = walletId => {
    this.walletSearch.value = walletId;
    return this.setState(
      {
        displayWallets: Wallets.find({ _id: walletId }).fetch(),
      },
      () => {
        this.onSearchWalletsTransaction();
      }
    );
  };

  onSearchWallets = e => {
    const { value } = e.target;
    if (!value) {
      return this.setState(
        {
          displayWallets: this.state.wallets,
        },
        () => this.onSearchWalletsTransaction()
      );
    }
    if (value.length < 3) {
      return true;
    }
    const wallets = Wallets.find({
      $or: [{ walletName: { $regex: `${value}*`, $options: 'i' } }, { _id: { $regex: `${value}*`, $options: 'i' } }, { address: { $regex: `${value}*`, $options: 'i' } }],
    }).fetch();

    this.setState(
      {
        displayWallets: wallets,
      },
      () => {
        this.onSearchWalletsTransaction();
      }
    );
  };

  onSearchWalletsTransaction = e => {
    const walletIds = this.state.displayWallets.map(w => w._id);
    if (!e) {
      return this.setState({
        txns: WalletTransactions.find({ $or: [{ fromWallet: { $in: walletIds } }, { toWallet: { $in: walletIds } }] }).fetch(),
      });
    }
    const { value } = e.target;
    if (!value) {
      return this.setState({
        txns: WalletTransactions.find({ $or: [{ fromWallet: { $in: walletIds } }, { toWallet: { $in: walletIds } }] }).fetch(),
      });
    }
    if (value.length < 3) {
      return true;
    }
    this.setState({
      txns: WalletTransactions.find({
        $and: [
          { $or: [{ fromWallet: { $in: walletIds } }, { toWallet: { $in: walletIds } }] },
          {
            $or: [
              { _id: { $regex: `${value}*`, $options: 'i' } },
              { txnId: { $regex: `${value}*`, $options: 'i' } },
              { toWallet: { $regex: `${value}*`, $options: 'i' } },
              { fromWallet: { $regex: `${value}*`, $options: 'i' } },
              { toAddress: { $regex: `${value}*`, $options: 'i' } },
            ],
          },
        ],
      }),
    });
  };

  render() {
    const { user } = this.state;
    const { paymeter } = this.props;

    if (!(paymeter && paymeter.userId && user)) {
      const LoadingView = (
        <div className="d-flex justify-content-center flex-column full-height" style={{ marginTop: '250px', paddingBottom: '250px', paddingLeft: '250px' }}>
          <div id="loader" />
          <br />
          <p style={{ textAlign: 'center', fontSize: '1.2em' }}>Just a minute</p>
        </div>
      );
      return LoadingView;
    }

    return (
      <div className="page-content-wrapper ">
        <div className="content sm-gutter">
          <div data-pages="parallax">
            <div className="container-fluid p-l-25 p-r-25 sm-p-l-0 sm-p-r-0">
              <div className="inner">
                <ol className="breadcrumb sm-p-b-5">
                  <li className="breadcrumb-item">
                    <Link to="/app/admin">Admin</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link to="/app/admin/paymeter">Paymeter</Link>
                  </li>
                  <li className="breadcrumb-item active">{this.props.match.params.id}</li>
                </ol>
              </div>
            </div>
          </div>
          <div className="container-fluid p-l-25 p-r-25 p-t-0 p-b-25 sm-padding-10">
            <div className="row">
              <div className="col-lg-3 col-sm-6  d-flex flex-column">
                <div className="card social-card share  full-width m-b-0 full-height no-border" data-social="item">
                  <div className="card-header ">
                    <h5 className="text-primary pull-left">
                      User <i className="fa fa-circle text-complete fs-11" />
                    </h5>
                    <div className="clearfix" />
                  </div>
                  <div className="card-description">
                    <p>
                      <span style={{ fontSize: '1.1em', textDecoration: 'uppercase' }}>
                        <Link to={`/app/admin/users/${user._id}`}>
                          {user.profile.firstName} {user.profile.lastName}
                        </Link>
                      </span>
                      <br />
                      <br />
                      <Link to={`/app/admin/users/${user._id}`}>{user.emails[0].address}</Link>
                      <br />
                      <br />
                      {paymeter.subscribed ? <span className="label label-success">Subscribed</span> : <span className="label label-danger">Not Subscribed</span>}
                    </p>
                  </div>
                </div>
              </div>

              <div className="col-sm-3">
                <div className="full-height card no-border bg-complete no-margin widget-loader-bar">
                  <div className="full-height d-flex flex-column">
                    <div className="card-header ">
                      <div className="card-title text-black">
                        <span className="font-montserrat fs-11 all-caps text-white">
                          This Month Invoice <i className="fa fa-chevron-right" />
                        </span>
                      </div>
                    </div>
                    <h1 className="no-margin text-white text-center p-t-30">
                      {paymeter && <span>$ {Number(Math.max(paymeter.bill || 0, paymeter.minimumFeeThisMonth)).toFixed(2)}</span>}

                      {!paymeter && <span>$0</span>}
                    </h1>
                  </div>
                </div>
              </div>
              <div className="col-lg-6 d-flex">
                <table className="table table-condensed table-hover m-t-0">
                  <tbody>
                    <tr>
                      <td className="font-montserrat" style={{ width: '35%' }}>
                        Minimum fee this month
                      </td>
                      <td className="text-right b-r b-dashed b-grey" style={{ width: '65%' }}>
                        <EditableText value={Number(paymeter.minimumFeeThisMonth).toFixed(2)} valueChanged={this.minimumBillChangeListener} />
                      </td>
                    </tr>
                    <tr>
                      <td className="font-montserrat" style={{ width: '35%' }}>
                        Actual Bill
                      </td>
                      <td className="text-right b-r b-dashed b-grey" style={{ width: '65%' }}>
                        $ {Number(paymeter.bill).toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td className="font-montserrat" style={{ width: '35%' }}>
                        Vouchers
                      </td>
                      <td className="text-right b-r b-dashed b-grey" style={{ width: '65%' }}>
                        {paymeter.vouchers &&
                          paymeter.vouchers.map(v => (
                            <Link to={`/app/admin/voucher/details/${v._id}`} key={v._id}>{`${v.code} : ${moment(v.appliedOn).format('DD-MMM-YYYY kk:mm:ss')}`}</Link>
                          ))}
                      </td>
                    </tr>
                    <tr>
                      <td className="font-montserrat" style={{ width: '35%' }}>
                        Apply Voucher
                      </td>
                      <td className="text-right b-r b-dashed b-grey p-t-0 p-b-0" style={{ width: '65%' }}>
                        <div className="row">
                          <div className="col-md-8">
                            <input type="text" placeholder="Voucher code" ref={i => (this.voucher = i)} className="form-control" />
                          </div>
                          <div className="col-md-4">
                            <button className="btn btn-success" onClick={this.adminApplyVoucher} disabled={this.state.adminApplyVoucherLoading}>
                              Apply
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="font-montserrat" style={{ width: '35%' }}>
                        Unsubscribe next month
                      </td>
                      <td className="text-right b-r b-dashed b-grey" style={{ width: '65%' }}>
                        {paymeter.unsubscribeNextMonth ? 'Yes' : 'No'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="row m-t-30 bg-white">
              <div className="col-md-12">
                <div className="card social-card share full-width" style={{ border: 'none' }}>
                  <div className="card-header">
                    <div className="row">
                      <div className="col-md-1 p-t-10">
                        <h5 className="text-success ">Wallets</h5>
                      </div>
                      <div className="col-md-11">
                        <div className="input-group transparent">
                          <span className="input-group-addon">
                            <i className="fa fa-search" />
                          </span>
                          <input type="text" placeholder="Wallet id, name or address" ref={i => (this.walletSearch = i)} className="form-control" onChange={this.onSearchWallets} />
                        </div>
                      </div>
                    </div>
                    <div className="clearfix" />
                  </div>
                  <div className="card-block">
                    <div className="table-responsive">
                      <table className="table table-hover m-t-0">
                        <thead>
                          <tr>
                            <th style={{ width: '5%' }}>S No.</th>
                            <th style={{ width: '20%' }}>Name</th>
                            <th style={{ width: '15%' }}>Coin</th>
                            <th style={{ width: '20%' }}>Balance</th>
                            <th style={{ width: '40%' }}>Address</th>
                          </tr>
                        </thead>
                        <tbody>
                          {this.state.displayWallets.map((wallet, index) => {
                            return (
                              <tr key={wallet._id} onClick={this.onSelectWallet.bind(this, wallet._id)} style={{ cursor: 'pointer' }}>
                                <td>{index + 1}.</td>
                                <td>{wallet.walletName}</td>
                                <td>{wallet.coinType === 'ERC20' ? `${wallet.coinType} | ${wallet.tokenSymbol}` : wallet.coinType}</td>
                                <td>{wallet.confirmedBalance}</td>
                                <td>{wallet.address}</td>
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
            <div className="row m-t-30">
              <div className={this.state.txnDetails ? 'col-md-6' : 'col-md-12'}>
                <div className="card social-card share full-width " style={{ border: 'none' }}>
                  <div className="card-header">
                    <div className="row">
                      <div className="col-md-2 ">
                        <h5 className="text-primary ">Wallet Transactions</h5>
                      </div>
                      <div className="col-md-10">
                        <div className="input-group transparent">
                          <span className="input-group-addon">
                            <i className="fa fa-search" />
                          </span>
                          <input type="text" placeholder="Txn ID" className="form-control" onChange={this.onSearchWalletsTransaction} />
                        </div>
                      </div>
                    </div>

                    <div className="clearfix" />
                  </div>
                  <div className="card-block">
                    <div className="table-responsive">
                      <table className="table table-condensed table-hover m-t-0">
                        <thead>
                          <tr>
                            <th style={{ width: '10%' }}>&nbsp;</th>
                            <th style={{ width: '30%' }}>Type</th>
                            <th style={{ width: '60%' }}>Txn Id</th>
                          </tr>
                        </thead>
                        <tbody>
                          {this.state.txns.map((txn, index) => {
                            return (
                              <tr key={index + 1} onClick={this.showTxnDetails.bind(this, txn._id)} style={{ cursor: 'pointer' }}>
                                <td>{index + 1}</td>
                                <td>{txn.type}</td>
                                <td>{txn.txnId}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
              {this.state.txnDetails && (
                <div className="col-md-6">
                  <div className="card social-card share  full-width m-b-0 full-height no-border" data-social="item">
                    <div className="card-header ">
                      <h5 className="text-primary ">
                        Transaction Details <i className="fa fa-info pull-right text-primary fs-11" />
                      </h5>
                      <div className="clearfix" />
                    </div>

                    <div className="card-description">
                      <table className="table table-condensed table-hover m-t-0">
                        <tbody>
                          {this.state.txnDetails &&
                            Object.keys(this.state.txnDetails).map((key, index) => {
                              return (
                                <tr key={index + 1}>
                                  <td style={{ width: '30%' }}>{key}</td>
                                  <td style={{ width: '60%' }} className="text-right">
                                    {this.state.txnDetails[key]}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withTracker(props => {
  return {
    paymeter: Paymeter.find({ _id: props.match.params.id }).fetch()[0],
    subscriptions: [
      Meteor.subscribe(
        'paymeter.search',
        { query: { _id: props.match.params.id }, loadWallets: true },
        {
          onReady: () => {
            window.dispatchEvent(new Event('paymeter-loaded'));
          },
        }
      ),
    ],
  };
})(withRouter(PaymeterDetails));
