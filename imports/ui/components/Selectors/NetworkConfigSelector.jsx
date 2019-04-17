import React, { Component } from 'react';

import './NetworkConfigSelector.scss';
class NetworkConfigSelector extends Component {
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
        name: 'Light',
        cpu: 0.5,
        ram: 1,
        disk: 5,
      },
    };
  }

  componentDidMount() {
    Meteor.call('getConfigs', { type: 'dynamo' }, (err, res) => {
      this.setState({
        configs: res,
      });
      this.defaultConfig = Object.values(res).filter(i => (i.locations ? i.locations.includes(this.props.locationCode) : true))[0];
      if (!this.defaultConfig) {
        return;
      }
      if (this.config) this.config.value = this.defaultConfig.name;
      this.onConfigChange();
    });
  }

  onConfigChange(skipDefault) {
    if (!this.config) {
      return;
    }
    const config = this.state.configs[this.config.value];

    if (!config) {
      return;
    }

    if (!skipDefault) {
      this.diskSpace.value = config.disk;
    }

    if (!this.voucherDetails) {
      this.setState({
        networkConfig: config,
        isDiskChangeable: config.isDiskChangeable,
      });
    }
    if (this.props && this.props.configChangeListener) {
      this.props.configChangeListener({ config, diskSpace: Number(this.diskSpace.value) });
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
    Meteor.call('validateVoucher', { voucherCode, type: 'network' }, (err, reply) => {
      if (err) {
        return this.setState({
          voucherLoading: false,
          voucher: {
            status: 'error',
            error: err.error,
          },
        });
      }

      if (reply.locationMapping) {
        if (!reply.locationMapping[this.props.locationCode]) {
          return this.setState({
            voucherLoading: false,
            voucher: {
              status: 'error',
              error: 'Not applicable for this location',
            },
          });
        }
      }

      this.voucherDetails = reply;
      this.setState({
        voucherLoading: false,
        voucher: {
          status: 'success',
          networkConfig: reply.networkConfig,
        },
        isDiskChangeable: reply.isDiskChangeable,
        networkConfig: reply.networkConfig,
      });
      this.diskSpace.value = reply.networkConfig.disk;
      if (this.props && this.props.configChangeListener) {
        this.props.configChangeListener({ config: reply.networkConfig, diskSpace: Number(this.diskSpace.value), voucher: reply });
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
    this.diskSpace.value = 5;
    this.voucherDetails = undefined;
    this.onConfigChange();
  };

  render() {
    const configList = [];

    Object.values(this.state.configs).forEach(config => {
      if (this.props.locationCode && config.locations && !config.locations.includes(this.props.locationCode)) {
        return;
      }
      configList.push(
        <option value={config.name} key={config._id}>
          {config.name}
        </option>
      );
    });
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
                <div className="col-md-4">
                  <div className="form-group form-group-default required">
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
                      disabled={!this.state.isDiskChangeable}
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
            </div>
          </div>
        </div>
      </div>
    );

    return FullView;
  }
}

export default NetworkConfigSelector;
