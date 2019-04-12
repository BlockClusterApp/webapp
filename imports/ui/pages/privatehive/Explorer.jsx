import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter, Link } from 'react-router-dom';
import { PrivatehivePeers } from '../../../collections/privatehivePeers/privatehivePeers';
import helpers from '../../../modules/helpers/index';

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
      blocks: [],
      latestTxns: [],
      blocks: [],
      blockOrTxnOutput: '',
      channels: [],
      name: query.channel || 'mychannel',
    };
  }

  componentDidMount() {
    setTimeout(() => this.getChannels(), 1000);
  }

  getChannels() {
    Meteor.call(
      'fetchChannels',
      {
        networkId: this.props.match.params.id,
      },
      (err, res) => {
        this.setState({
          loading: false,
        });
        return this.setState(
          {
            channels: res.message,
            channel: this.state.selectedChannel || res.message[0],
          },
          () => {
            if (!this.refreshTimer) {
              this.refreshTimer = setInterval(() => {
                this.refreshExplorerDetails();
              }, REFRESH_INTERVAL);
              this.refreshExplorerDetails();
            }
          }
        );
      }
    );
  }

  componentWillUnmount() {
    this.props.subscriptions.forEach(s => {
      s.stop();
    });
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
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
    Meteor.call('fetchChaincodes', { networkId: this.props.match.params.id }, (err, res) => {
      if (err) {
        return;
      }
      this.setState({
        chaincodes: res.message,
      });
    });
  };

  refreshExplorerDetails = () => {
    Meteor.call('explorerDetails', { channelName: this.state.channel.name, networkId: this.props.match.params.id }, (err, res) => {
      console.log(err, res);
      this.setState({
        blocks: res.blocks.message,
        chaincodes: res.chaincodes.message,
        latestBlock: res.latestBlock.message,
        organizations: res.organizations.message,
        size: res.size.message,
      });
    });
  };

  channelChangeListener = () => {
    this.txnBlock.value = '';
    this.setState(
      {
        channel: JSON.parse(this.channel.value),
        blockOrTxnOutput: '',
      },
      () => {
        this.refreshExplorerDetails();
      }
    );
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

  render() {
    const channelOptions = this.state.channels.map(channel => {
      return (
        <option value={JSON.stringify(channel)} key={channel.name}>
          {channel.name}
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
                          Channels <i className="fa fa-chevron-right" />
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
                          <div className=" ">
                            <select className="full-width select2-hidden-accessible bg-white" ref={input => (this.channel = input)} onChange={this.channelChangeListener}>
                              {channelOptions}
                            </select>
                          </div>
                          <div className="clearfix" />
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
                        <h3 className="no-margin p-b-30 text-white ">{this.state.chaincodes && Array.isArray(this.state.chaincodes) && this.state.chaincodes.length}</h3>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-lg-4">
                  <div className="widget-9 card no-border bg-primary no-margin widget-loader-bar">
                    <div className="full-height d-flex flex-column">
                      <div className="card-header ">
                        <div className="card-title text-black">
                          <span className="font-montserrat fs-11 all-caps text-white">
                            Size of Blockchain <i className="fa fa-chevron-right" />
                          </span>
                        </div>
                        <div className="card-controls">
                          <ul>
                            <li>
                              <a href="#" className="card-refresh" data-toggle="refresh">
                                <i className="card-icon card-icon-refresh text-white" />
                              </a>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div className="p-l-20">
                        {!isNaN(Number(this.state.size)) && <h3 className="no-margin p-b-30 text-white ">{helpers.bytesToSize(Number(this.state.size) || 0, 2)}</h3>}
                        {isNaN(Number(this.state.size)) && <p className="no-margin p-b-30 text-white ">{this.state.size}</p>}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-lg-8 m-t-10">
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

                <div className="col-lg-4 m-t-10">
                  <div className="widget-9  widget-11-2 card no-border card-condensed no-margin widget-loader-circle align-self-stretch details">
                    <div className="padding-25">
                      <div className="pull-left">
                        <h2 className="text-success no-margin">Organizations</h2>
                      </div>
                      <h3 className="pull-right semi-bold">
                        <sup>
                          <small className="semi-bold">#</small>
                        </sup>
                        &nbsp;
                        {this.state.organizations && this.state.organizations.length}
                      </h3>
                      <div className="clearfix" />
                    </div>
                    <div className="auto-overflow widget-11-2-table-2">
                      <table className="table table-condensed table-hover">
                        <tbody>
                          {this.state.organizations &&
                            Array.isArray(this.state.organizations) &&
                            this.state.organizations.map((orgName, index) => {
                              return (
                                <tr key={orgName}>
                                  <td className="font-montserrat fs-14 break-word">{orgName.toPascalCase()}</td>
                                </tr>
                              );
                            })}

                          {this.state.organizations && !Array.isArray(this.state.organizations) && (
                            <tr className="break-word">
                              <td>{this.state.organizations}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
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
                      {this.state.blocks &&
                        Array.isArray(this.state.blocks) &&
                        this.state.blocks.map((item, index) => {
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
                            </tr>
                          );
                        })}
                      {this.state.blocks && !Array.isArray(this.state.blocks) && (
                        <tr className="break-word">
                          <td title={this.state.blocks}>{this.state.blocks}</td>
                        </tr>
                      )}
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
    network: PrivatehivePeers.findOne({ instanceId: props.match.params.id, active: true }),
    subscriptions: [
      Meteor.subscribe(
        'privatehive.one',
        { instanceId: props.match.params.id },
        {
          onReady: function() {
            if (PrivatehivePeers.find({ instanceId: props.match.params.id, active: true }).fetch().length !== 1) {
              props.history.push('/app/privatehive/list');
            }
          },
        }
      ),
    ],
  };
})(withRouter(Explorer));
