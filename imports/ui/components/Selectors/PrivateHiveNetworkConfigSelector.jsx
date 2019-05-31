import React, { Component } from 'react';
import PrivateHiveNetworkSelector from './PrivatehiveNetworkSelector';
import './NetworkConfigSelector.scss';
class PrivateHiveNetworkConfigSelector extends Component {
  constructor(props) {
    super(props);

    this.locationCode = props.locationCode;

    this.ordererType = 'solo';
    this.state = {
      configs: {},
      voucherLoading: false,
      voucher: {
        status: undefined,
      },
      remoteConfig: window.RemoteConfig,
      isDiskChangeable: true,
      networkType: 'peer',
      networkConfig: {},
      filteredConfigs: [],
    };
    this.config = {};
  }

  componentDidMount() {
    this.fetchConfigs();
  }

  fetchConfigs = () => {
    Meteor.call('getConfigs', { type: 'privatehive', fetchRaw: true }, (err, res) => {
      if (err) {
        return setTimeout(this.fetchConfigs, 3000);
      }
      const filteredConfigs = res.filter(c => c.category === this.state.networkType);
      this.setState(
        {
          allConfigs: res,
          filteredConfigs,
        },
        () => {
          this.defaultConfig = Object.values(filteredConfigs).filter(i => (i.locations ? i.locations.includes(this.props.locationCode) : true))[0];
          if (!this.defaultConfig) {
            this.networkConfig = {};
            return this.onConfigChange();
          }
          this.networkConfigId = this.defaultConfig._id;
          this.onConfigChange();
        }
      );
    });
    this.onConfigChange(true);
  };

  onConfigChange(skipDefault) {
    let error;
    let networkConfig = this.state.filteredConfigs.find(config => config._id === this.networkConfigId);

    if (!networkConfig) {
      return;
    }

    if (this.diskSpace && this.diskSpace.value > 16000) {
      this.diskSpace.value = 16000;
    }

    this.setState(
      {
        networkType: this.networkType ? this.networkType.value : this.state.networkType,
        peerId: this.peerId,
        networkConfig,
      },
      () => {
        if (skipDefault && this.diskSpace) {
          networkConfig.disk = this.diskSpace.value || networkConfig.disk;
        } else if (this.diskSpace) {
          this.diskSpace.value = networkConfig.disk;
        }
        const config = {
          networkType: this.networkType ? this.networkType.value : this.state.networkType,
          peerId: this.peerId,
          ordererType: this.ordererType,
          networkConfig,
          voucher: this.voucherDetails,
        };
        if (this.props && this.props.configChangeListener) {
          this.props.configChangeListener({ config, error: error ? true : false });
        }
      }
    );
  }

  validateVoucher = () => {
    const voucherCode = this.voucher.value;
    this.setState({
      voucherLoading: true,
      voucher: {
        status: undefined,
      },
    });
    Meteor.call('validateVoucher', { voucherCode, type: 'privatehive' }, (err, reply) => {
      if (err) {
        return this.setState({
          voucherLoading: false,
          voucher: {
            status: 'error',
            error: err.error,
          },
        });
      }

      this.voucherDetails = reply;
      this.setState({
        voucherLoading: false,
        voucher: {
          status: 'success',
          networkConfig: reply.networkConfig,
        },
        networkConfig: reply.networkConfig,
        filteredConfigs: [reply.networkConfig],
        networkType: reply.networkConfig.category,
      });
      this.networkConfigId = reply.networkConfig._id;
      this.diskSpace.value = reply.networkConfig.disk;
      this.onConfigChange();
    });
  };

  deleteVoucher = () => {
    this.setState({
      voucherLoading: false,
      voucher: {
        status: undefined,
      },
      networkConfig: this.defaultConfig,
      networkType: this.defaultConfig.category,
      filteredConfigs: this.state.allConfigs.filter(c => c.category === this.state.networkType),
    });
    this.networkConfigId = this.defaultConfig._id;
    this.voucher.value = '';

    this.voucherDetails = undefined;
    this.onConfigChange();
  };

  networkTypeChangeHandler = () => {
    if (this.networkType.value === 'orderer') {
      this.networkConfigId = this.state.allConfigs.find(c => c.category === 'orderer' && c.ordererType === 'solo')._id;
    } else {
      this.networkConfigId = this.state.allConfigs.find(c => c.category === 'peer')._id;
    }
    this.setState(
      {
        networkType: this.networkType.value,
        filteredConfigs: this.state.allConfigs.filter(c => c.category === this.networkType.value),
      },
      () => {
        this.onConfigChange(false);
      }
    );
  };

  render() {
    const configList = [
      <option value="peer" key="type_peer" selected={this.state.networkConfig.category === 'peer'}>
        Peer
      </option>,

      <option value="orderer" key="type_orderer" selected={this.state.networkConfig.category === 'orderer'}>
        Orderer
      </option>,
    ];
    const dropDown = (
      <div className="form-group form-group-default ">
        <label>Organization Type</label>
        <select
          className="form-control form-group-default"
          name="nodeType"
          ref={input => (this.networkType = input)}
          onChange={this.networkTypeChangeHandler}
          selected="peer"
          disabled={this.state.voucher.status === 'success'}
        >
          {configList}
        </select>
      </div>
    );

    let voucherActionButton = undefined;
    if (this.state.voucher.status === 'success') {
      voucherActionButton = (
        <button onClick={this.deleteVoucher} disabled={this.state.voucherLoading} className="btn btn-warning btn-cons voucher-btn">
          <span>
            <i className="fa fa-trash" aria-hidden="true" /> Remove
          </span>
        </button>
      );
    } else {
      voucherActionButton = (
        <button onClick={this.validateVoucher} disabled={this.state.voucherLoading} className="btn btn-primary btn-cons voucher-btn">
          <span>
            <i className="fa fa-gift" aria-hidden="true" /> Redeem
          </span>
        </button>
      );
    }

    const FullView = (
      <div className="network-config-selector ">
        <div className="row">
          <div className="col-md-12">
            <div className="form-group-attached">
              <div className="row clearfix">
                <div className="col-md-12">{dropDown}</div>
              </div>

              {this.state.networkType === 'orderer' && (
                <div className="row clearfix">
                  <PrivateHiveNetworkSelector
                    key={this.props.networks && this.props.networks.length}
                    networks={this.props.networks}
                    onValueChangeListener={network => {
                      if (network) {
                        this.peerId = network.instanceId;
                      }
                      this.onConfigChange();
                    }}
                    label="Peer Organization ID"
                  />
                </div>
              )}
              {this.state.networkType === 'orderer' && (
                <div className="row clearfix">
                  <div className="form-group form-group-default ">
                    <label>Select orderer type</label>
                    <select
                      className="form-control"
                      name="type"
                      ref={input => (this.ordererTypeInput = input)}
                      onChange={() => {
                        this.ordererType = this.ordererTypeInput.value || 'solo';
                        this.networkConfigId = this.state.allConfigs.find(c => c.category === 'orderer' && c.ordererType === this.ordererType)._id;
                        this.onConfigChange();
                      }}
                      disabled={this.state.voucher.status === 'success'}
                      selected={'solo'}
                    >
                      <option value="solo" selected={this.state.networkConfig && this.state.networkConfig.ordererType === 'solo'}>
                        Solo
                      </option>
                      <option value="kafka" selected={this.state.networkConfig && this.state.networkConfig.ordererType === 'kafka'}>
                        Kafka
                      </option>
                    </select>
                  </div>
                </div>
              )}
              {this.state.networkType === 'peer' && (
                <div className="row clearfix">
                  <div className="form-group form-group-default">
                    <label>Select Configuration</label>
                    <select
                      className="form-control"
                      name="peerNetworkConfig"
                      disabled={this.state.voucher.status === 'success'}
                      ref={i => (this.peerNetworkConfig = i)}
                      onChange={() => {
                        this.networkConfigId = this.peerNetworkConfig.value;
                        this.onConfigChange();
                      }}
                    >
                      {this.state.filteredConfigs.map(config => {
                        return (
                          <option value={config._id} key={config._id} selected={config._id === this.state.networkConfig._id}>
                            {config.name}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              )}

              {this.state.networkConfig && (
                <div className="row clearfix">
                  <div className="col-md-4">
                    <div className="form-group form-group-default">
                      <label>CPU (vCPUs)</label>
                      <input type="text" className="form-control" name="projectName" value={this.state.networkConfig.cpu} disabled />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group form-group-default ">
                      <label>RAM (GB)</label>
                      <input type="text" className="form-control" name="firstName" value={this.state.networkConfig.ram} disabled />
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="form-group form-group-default ">
                      <label>Disk Space (GB)</label>
                      <input
                        type="number"
                        className="form-control"
                        name="firstName"
                        required
                        ref={input => (this.diskSpace = input)}
                        disabled={!this.state.networkConfig.isDiskChangeable}
                        onChange={this.onConfigChange.bind(this, true)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {window.RemoteConfig && window.RemoteConfig.features && window.RemoteConfig.features.Vouchers && (
                <div className="row clearfix">
                  <div className="col-md-12">
                    <div className="form-group form-group-default input-group">
                      <div className="form-input-group">
                        <label>
                          Voucher Code&nbsp;
                          {this.state.voucher && this.state.voucher.status === 'error' ? (
                            <span className="error-message">{this.state.voucher.error}</span>
                          ) : this.state.voucher.status === 'success' ? (
                            <span className="success-message">Voucher Applied</span>
                          ) : (
                            undefined
                          )}
                        </label>
                        <input type="text" className="form-control" name="projectName" ref={input => (this.voucher = input)} />
                      </div>
                      {voucherActionButton}
                    </div>
                  </div>
                </div>
              )}
              {this.state.error && (
                <div className="row clearfix">
                  <div className="col-md-12">
                    <div className="form-group form-group-default">
                      <div className="form-input-group">
                        <span className="text-danger fs-14">{this.state.error}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );

    return FullView;
  }
}
export default PrivateHiveNetworkConfigSelector;
