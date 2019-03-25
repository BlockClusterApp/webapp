import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import PrivateHive from '../../../collections/privatehive';
import helpers from '../../../modules/helpers';
import ReactHtmlParser, { processNodes, convertNodeToElement, htmlparser2 } from 'react-html-parser';
import { withRouter, Link } from 'react-router-dom';
import Config from '../../../modules/config/client';

import querystring from 'querystring';

import './Explorer.scss';

const REFRESH_INTERVAL = 5000;

class Explorer extends Component {
  constructor(props) {
    super(props);
    let query = {};
    if (props.location.search) {
      query = querystring.parse(props.location.search.substr(1));
    }

    this.query = query;

    this.state = {
      channel: query.channel || 'mychannel',
      latestBlock: null,
      oldestBlock: null,
      blocks: [],
      totalTransactions: 0,
      latestTxns: [],
      blocks: [],
      blockOrTxnOutput: '',
      chainCodeCount: 0,
      channels: [],
      channel_id: query.channel || 'mychannel',
    };
  }

  componentDidMount() {
    this.chaincodeTimer = setInterval(() => {
      this.fetchChainCodeCount();
    }, REFRESH_INTERVAL);
    this.latestBlockTimer = setInterval(() => {
      this.refreshLatestTxns();
    }, REFRESH_INTERVAL);
    setTimeout(() => this.getChannels(), 1000);
  }

  getChannels() {
    const { network } = this.props;
    let url = `https://${network.properties.apiEndPoint}/channels`;
    HTTP.get(
      url,
      {
        headers: {
          'x-access-key': network.properties.tokens ? network.properties.tokens[0] : undefined,
        },
      },
      (err, res) => {
        if (!err) {
          let channel = res.data.data.channels[0] ? res.data.data.channels[0].channel_id : '';
          if (this.query && this.query.channel) {
            channel = this.query.channel;
          }
          this.setState({
            channels: res.data.data.channels,
            channel,
          });
        }
      }
    );
  }

  componentWillUnmount() {
    this.props.subscriptions.forEach(s => {
      s.stop();
    });
    clearInterval(this.chaincodeTimer);
    clearInterval(this.latestBlockTimer);
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
      latestTxns: [],
    });
  }

  nodeStatusIcon() {
    if (this.props.network) {
      if (this.props.network.status === 'running') {
        return <i className="fa fa-circle text-success fs-11" />;
      } else if (this.props.network.status === 'down') {
        return <i className="fa fa-circle text-danger fs-11" />;
      } else {
        return <i className="fa fa-circle text-complete fs-11" />;
      }
    }
  }

  fetchChainCodeCount = () => {
    const { network } = this.props;
    if (!network) {
      return true;
    }
    if (network.status !== 'running') {
      return;
    }

    const url = `https://${network.properties.apiEndPoint}/chaincode/installed`;
    HTTP.get(
      url,
      {
        headers: {
          'x-access-key': network.properties.tokens ? network.properties.tokens[0] : undefined,
        },
      },
      (err, res) => {
        if (err) {
          return;
        }
        this.setState({
          chainCodeCount: res.data.data.chaincodes.length,
        });
      }
    );
  };

  refreshLatestTxns = () => {
    const { network } = this.props;
    if (!network) {
      return true;
    }
    // let rpc = null;
    let status = network.status;
    let username = null;
    let password = null;

    if (status == 'running') {
      let url = `https://${network.properties.apiEndPoint}/blocks/${this.state.channel}/latestInfo`;
      HTTP.get(
        url,
        {
          headers: {
            'x-access-key': network.properties.tokens ? network.properties.tokens[0] : undefined,
          },
        },
        (err, res) => {
          if (!err) {
            const { data } = res.data;
            const latestBlockNumber = data.height.low;
            if (this.state.blocks.length < 15) {
              const blocks = [];
              let number = latestBlockNumber - 1;
              while (blocks.length < 15) {
                blocks.push({
                  number,
                });
                number -= 1;
                if (number < 0) {
                  break;
                }
              }
              this.setState({
                blocks,
              });
            }
          }
        }
      );
    } else {
    }
  };

  fetchBlockOrTxn = value => {
    const { network } = this.props;
    if (!network.status === 'running') {
      return this.setState({
        blockOrTxnOutput: 'Wait for network to start running',
      });
    }
    let url = `https://${network.properties.apiEndPoint}/blocks/${this.state.channel}`;

    if (value.length > 10) {
      url = `${url}/txn/${value}`;
    } else if (!Number.isNaN(parseInt(value))) {
      url = `${url}/block/${value}`;
    } else {
      return;
    }

    HTTP.get(
      url,
      {
        headers: {
          'x-access-key': network.properties.tokens ? network.properties.tokens[0] : undefined,
        },
      },
      (err, res) => {
        if (err) {
          setTimeout(() => this.fetchBlockOrTxn(value), 3000);
          return this.setState({ blockOrTxnOutput: err.toString() });
        }
        return this.setState({
          blockOrTxnOutput: JSON.stringify(res.data.data, null, 2),
        });
      }
    );
  };

  channelChangeListener = () => {
    this.txnBlock.value = '';
    this.setState(
      {
        channel: this.channel.value,
        blockOrTxnOutput: '',
      },
      () => {
        this.refreshLatestTxns();
      }
    );
  };

  render() {
    const channelOptions = this.state.channels.map(channel => {
      return (
        <option value={location.channel_id} key={channel.channel_id} selected={this.query.channel === channel.channel_id}>
          {channel.channel_id}
        </option>
      );
    });

    return (
      <div className="content explorer sm-gutter">
        <div className="container-fluid container-fixed-lg m-t-20 p-l-25 p-r-25 p-t-0 p-b-25 sm-padding-10">
          <div className="row">
            <div className="col-lg-8 col-sm-12">
              <div className="row">
                <div className="col-lg-12 m-b-10">
                  <Link to={`/app/privatehive/${this.props.match.params.id}/details`}>
                    {' '}
                    Control Panel <i className="fa fa-angle-right" />
                  </Link>{' '}
                  Explorer
                </div>
              </div>
              <div className="row">
                <div className="col-lg-4">
                  <div className="card no-border bg-white no-margin widget-loader-bar">
                    <div className="card-header  top-left top-right ">
                      <div className="card-title text-black hint-text">
                        <span className="font-montserrat fs-11 all-caps">
                          Transaction Pool <i className="fa fa-chevron-right" />
                        </span>
                      </div>
                      <div className="card-controls">
                        <ul>
                          <li className="p-l-10">
                            <a data-toggle="refresh" className="card-refresh text-black" href="#">
                              <i className="fa fa-spinner" />
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
                              <i className="fa fa-caret-up m-l-10" /> {this.state.totalPending}
                            </span>
                          </div>
                          <div className="pull-left m-l-20 small">
                            <span>Queue</span>
                            <span className=" text-danger font-montserrat">
                              <i className="fa fa-caret-down m-l-10" /> {this.state.totalQueued}
                            </span>
                          </div>
                          <div className="clearfix" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-lg-3">
                  <div className="widget-9 card no-border bg-success no-margin widget-loader-bar">
                    <div className="full-height d-flex flex-column">
                      <div className="card-header ">
                        <div className="card-title text-black">
                          <span className="font-montserrat fs-11 all-caps text-white">
                            Chaincodes <i className="fa fa-chevron-right" />
                          </span>
                        </div>
                        <div className="card-controls">
                          <ul>
                            <li>
                              <a href="#" className="card-refresh " style={{ color: 'white' }} data-toggle="refresh">
                                <i className="fa fa-file-o text-white" />
                              </a>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div className="p-l-20">
                        <h3 className="no-margin p-b-30 text-white ">{this.state.chainCodeCount}</h3>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-lg-5">
                  <div className="widget-9 card no-border bg-primary no-margin widget-loader-bar">
                    <div className="full-height d-flex flex-column">
                      <div className="card-header ">
                        <div className="card-title text-black">
                          <span className="font-montserrat fs-11 all-caps text-white">
                            Select Channel <i className="fa fa-chevron-right" />
                          </span>
                        </div>
                        <div className="card-controls" />
                      </div>
                      <div className="p-l-20 p-r-20 p-b-20 ">
                        <select className="full-width select2-hidden-accessible bg-white" ref={input => (this.channel = input)} onChange={this.channelChangeListener}>
                          {channelOptions}
                        </select>
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
                            <label>Enter Block Number or Txn Hash to Audit</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="0x...."
                              ref={input => (this.txnBlock = input)}
                              onChange={e => {
                                this.fetchBlockOrTxn(e.target.value);
                              }}
                            />
                          </div>
                          <div className="input-group-addon p-l-20 p-r-20 search-button">
                            <i className="fa fa-search" />
                          </div>
                        </div>
                      </form>
                    </div>
                    <div className="padding-15 json-output">
                      <pre>{this.state.blockOrTxnOutput}</pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="row">
                <div className="col-lg-12 m-b-30" />
              </div>
              <div className="widget-11-2 card no-border card-condensed no-margin widget-loader-circle align-self-stretch d-flex flex-column">
                <div className="card-header top-right">
                  <div className="card-controls">
                    <ul>
                      <li>
                        <a data-toggle="refresh" className="portlet-refresh text-black" href="#">
                          <i className="portlet-icon portlet-icon-refresh" />
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="padding-25">
                  <div className="pull-left">
                    <h2 className="text-success no-margin">Latest Blocks</h2>
                    <p className="no-margin">Descending Order</p>
                  </div>
                  <h3 className="pull-right semi-bold">
                    <sup>
                      <small className="semi-bold">#</small>
                    </sup>{' '}
                    {this.state.blocks && this.state.blocks.length}
                  </h3>
                  <div className="clearfix" />
                </div>
                <div className="auto-overflow widget-11-2-table">
                  <table className="table table-condensed table-hover">
                    <tbody>
                      {this.state.blocks.map((item, index) => {
                        return (
                          <tr
                            key={item.number}
                            onClick={() => {
                              this.txnBlock.value = item.number;
                              this.fetchBlockOrTxn(item.number);
                            }}
                          >
                            <td className="font-montserrat all-caps fs-12 w-50" style={{ cursor: 'pointer' }}>
                              Block #{item.number}
                            </td>
                            <td className="text-right hidden-lg">{/* <span className="hint-text small">dewdrops</span> */}</td>
                            {/* <td className="text-right b-r b-dashed b-grey w-25"> */}
                            {/* <span className="hint-text small">{item.transactions.length} Txns</span> */}
                            {/* </td> */}
                            {/* <td className="w-25"> */}
                            {/* <span className="font-montserrat fs-18">{item.size} Bytes</span> */}
                            {/* </td> */}
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
    );
  }
}

export default withTracker(props => {
  return {
    network: PrivateHive.find({ instanceId: props.match.params.id, active: true }).fetch()[0],
    subscriptions: [
      Meteor.subscribe(
        'privatehive.one',
        { instanceId: props.match.params.id, active: true },
        {
          onReady: function() {
            if (PrivateHive.find({ instanceId: props.match.params.id, active: true }).fetch().length !== 1) {
              props.history.push('/app/privatehive');
            }
          },
        }
      ),
    ],
  };
})(withRouter(Explorer));
