import React, { Component } from 'react';

import './NetworkConfigSelector.scss';
class PrivateHiveNetworkConfigSelector extends Component {
  constructor(props) {
    super(props);

    this.state = {
      configs: {},
      voucherLoading: false,
      voucher: {
        status: undefined,
      },
      remoteConfig: window.RemoteConfig,
      isDiskChangeable: true,
      networkConfig: {
        kafka: {},
        fabric: {},
        orderer: {},
        data: {},
        peer: {},
      },
    };
  }

  componentDidMount() {
    Meteor.call('getConfigs', { type: 'privatehive' }, (err, res) => {
      this.setState({
        configs: res,
      });
      this.defaultConfig = Object.values(res)[0];
      if (this.config) this.config.value = this.defaultConfig.name;
      this.onConfigChange();
    });
  }

  onConfigChange(skipDefault) {
    if (!this.config) {
      return;
    }

    let error;
    const config = this.state.configs[this.config.value];

    if (!this.voucherDetails) {
      if (!this.props.isJoin) {
        if (!this.ordererDiskSpace.value) {
          this.ordererDiskSpace.value = config.orderer.disk;
          this.kafkaDiskSpace.value = config.kafka.disk;
        } else {
          config.orderer.disk = this.ordererDiskSpace.value;
          config.kafka.disk = this.kafkaDiskSpace.value;
          if (Number(config.orderer.disk) <= 0) {
            error = 'Orderer Disk space should be greater than 0';
          }
          if (Number(config.kafka.disk) <= 0) {
            error = 'Kafka disk space should be greater than 0';
          }
        }
      }

      if (!this.dataDiskSpace.value) {
        this.dataDiskSpace.value = config.data.disk;
      } else {
        config.data.disk = this.dataDiskSpace.value;
        if (Number(config.data.disk) <= 0) {
          error = 'Data disk space should be greater than 0';
        }
      }

      const newState = { networkConfig: config };

      if (error) {
        newState.error = error;
      } else {
        newState.error = '';
      }

      this.setState(newState);
    }

    if (this.props && this.props.configChangeListener) {
      this.props.configChangeListener({ config, error: error ? true : false, voucher: this.voucherDetails });
    }
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
      });
      this.dataDiskSpace.value = reply.networkConfig.data.disk;
      if (!this.props.isJoin) {
        this.ordererDiskSpace.value = reply.networkConfig.orderer.disk;
        this.kafkaDiskSpace.value = reply.networkConfig.kafka.disk;
      }

      if (this.props && this.props.configChangeListener) {
        this.props.configChangeListener({ config: reply.networkConfig, voucher: reply });
      }
    });
  };

  deleteVoucher = () => {
    this.setState({
      voucherLoading: false,
      voucher: {
        status: undefined,
      },
      networkConfig: this.defaultConfig,
    });
    this.voucher.value = '';

    this.dataDiskSpace.value = this.defaultConfig.networkConfig.data.disk;
    this.ordererDiskSpace.value = this.defaultConfig.networkConfig.orderer.disk;
    this.kafkaDiskSpace.value = this.defaultConfig.networkConfig.kafka.disk;

    this.voucherDetails = undefined;
    this.onConfigChange();
  };

  render() {
    const configList = Object.values(this.state.configs).map(config => (
      <option value={config.name} key={config._id}>
        {config.name}
      </option>
    ));
    const dropDown = (
      <div className="form-group form-group-default ">
        <label>Node Type</label>
        <select
          className="form-control form-group-default"
          name="location"
          ref={input => (this.config = input)}
          onChange={this.onConfigChange.bind(this, false)}
          selected={Object.values(this.state.configs)[0]}
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
              <div className="row clearfix">
                <div className={this.props.isJoin ? 'col-md-6' : 'col-md-4'}>
                  <div className="form-group form-group-default ">
                    <label>Version</label>
                    <input type="text" className="form-control" name="projectName" value={this.state.networkConfig.fabric.version} disabled />
                  </div>
                </div>
                {!this.props.isJoin && (
                  <div className="col-md-4">
                    <div className="form-group form-group-default ">
                      <label>Orderers</label>
                      <input type="text" className="form-control" name="firstName" value={this.state.networkConfig.fabric.orderers} disabled />
                    </div>
                  </div>
                )}
                <div className={this.props.isJoin ? 'col-md-6' : 'col-md-4'}>
                  <div className="form-group form-group-default ">
                    <label>Peers</label>
                    <input type="text" className="form-control" name="firstName" value={this.state.networkConfig.fabric.peers} disabled />
                  </div>
                </div>
              </div>
              {!this.props.isJoin && (
                <div className="row clearfix">
                  <div className="col-md-4 col-sm-4">
                    <div className="form-group form-group-default ">
                      <label>Kafka CPU (vCPUs)</label>
                      <input type="text" className="form-control" name="projectName" value={this.state.networkConfig.kafka.cpu} disabled />
                    </div>
                  </div>
                  <div className="col-md-4 col-sm-4">
                    <div className="form-group form-group-default ">
                      <label>Kafka RAM (GB)</label>
                      <input type="text" className="form-control" name="firstName" value={this.state.networkConfig.kafka.ram} disabled />
                    </div>
                  </div>
                  <div className="col-md-4 col-sm-4">
                    <div className="form-group form-group-default ">
                      <label>Kafka Disk Space (GB)</label>
                      <input
                        type="number"
                        className="form-control"
                        name="ordererDiskSpace"
                        ref={input => (this.kafkaDiskSpace = input)}
                        disabled={!this.state.networkConfig.kafka.isDiskChangeable}
                        onChange={this.onConfigChange.bind(this, true)}
                      />
                    </div>
                  </div>
                </div>
              )}
              {!this.props.isJoin && (
                <div className="row clearfix">
                  <div className="col-md-4 col-sm-4">
                    <div className="form-group form-group-default ">
                      <label>Orderer CPU (vCPUs)</label>
                      <input type="text" className="form-control" name="projectName" value={this.state.networkConfig.orderer.cpu} disabled />
                    </div>
                  </div>
                  <div className="col-md-4 col-sm-4">
                    <div className="form-group form-group-default ">
                      <label>Orderer RAM (GB)</label>
                      <input type="text" className="form-control" name="firstName" value={this.state.networkConfig.orderer.ram} disabled />
                    </div>
                  </div>
                  <div className="col-md-4 col-sm-4">
                    <div className="form-group form-group-default ">
                      <label> Orderer Disk Space (GB)</label>
                      <input
                        type="number"
                        className="form-control"
                        ref={input => (this.ordererDiskSpace = input)}
                        disabled={!this.state.networkConfig.orderer.isDiskChangeable}
                        onChange={this.onConfigChange.bind(this, true)}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div className="row clearfix">
                <div className="col-md-4 col-sm-4">
                  <div className="form-group form-group-default ">
                    <label>Peer CPU (vCPUs)</label>
                    <input type="text" className="form-control" name="projectName" value={this.state.networkConfig.peer.cpu} disabled />
                  </div>
                </div>
                <div className="col-md-4 col-sm-4">
                  <div className="form-group form-group-default ">
                    <label>Peer RAM (GB)</label>
                    <input type="text" className="form-control" name="firstName" value={this.state.networkConfig.peer.ram} disabled />
                  </div>
                </div>
                <div className="col-md-4 col-sm-4">
                  <div className="form-group form-group-default ">
                    <label>Data Disk Space (GB)</label>
                    <input
                      type="number"
                      className="form-control"
                      name="ordererDiskSpace"
                      ref={input => (this.dataDiskSpace = input)}
                      disabled={!this.state.networkConfig.data.isDiskChangeable}
                      onChange={this.onConfigChange.bind(this, true)}
                    />
                  </div>
                </div>
              </div>
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
