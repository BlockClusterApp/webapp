import React, { Component } from "react";

import './NetworkConfigSelector.scss';
class NetworkConfigSelector extends Component {
  constructor(props) {
    super(props);

    this.state = {
      configs: {},
      voucherLoading: false,
      voucher: {
        status: undefined
      },
      networkConfig: {
        name: 'Light',
        cpu: 0.5,
        ram: 1,
        disk: 5
      }
    };
  }

  componentDidMount() {
    Meteor.call("getConfigs", (err, res) => {
      this.setState({
        configs: res
      });
      if(this.config) this.config.value = "Light";
      this.onConfigChange();
    });

  }

  onConfigChange(skipDefault) {
    if(!this.config){
      return;
    }
    const config = this.state.configs[this.config.value];

    if(!skipDefault) {
      this.diskSpace.value = config.disk
    }

    this.setState({
      networkConfig: config
    });
    if (this.props && this.props.configChangeListener) {
      this.props.configChangeListener({config, diskSpace: Number(this.diskSpace.value)});
    }
  }

  validateVoucher = () => {
    const voucherCode = this.voucher.value;
    this.setState({
      voucherLoading: true,
      voucher: {
        status: undefined
      }
    });
    Meteor.call('validateVoucher', voucherCode, (err, reply) => {
      if(err) {
        return this.setState({
          voucherLoading: false,
          voucher: {
            status: 'error',
            error: err.error
          }
        })
      }

      this.voucherDetails = reply;
      this.setState({
        voucherLoading: false,
        voucher: {
          status: 'success',
          networkConfig: reply.networkConfig
        },
        networkConfig: reply.networkConfig
      });
      this.diskSpace.value = reply.networkConfig.disk;
      if (this.props && this.props.configChangeListener) {
        this.props.configChangeListener({config: reply.networkConfig, diskSpace: Number(this.diskSpace.value), voucher: reply});
      }
    });
  }

  deleteVoucher = () => {
    this.setState({
      voucherLoading: false,
      voucher: {
        status: undefined
      },
      networkConfig: {
        name: 'Light',
        cpu: 0.5,
        ram: 500,
        disk: 5
      }
    });
    this.voucher.value = '';
    this.diskSpace.value = 5;
    this.voucherDetails = undefined;
    this.onConfigChange();
  }

  render() {
    const configList = Object.values(this.state.configs).map(config => (
      <option value={config.name} key={config._id}>{config.name}</option>
    ));
    const dropDown =  (
      <div className="form-group form-group-default ">
        <label>Node Type</label>
        <select
          className="form-control form-group-default"
          name="location"
          ref={input => (this.config = input)}
          onChange={this.onConfigChange.bind(this, false)}
          selected="Select node type"
          disabled={this.state.voucher.status === 'success'}
        >
          {configList}
        </select>
      </div>
    );

    let voucherActionButton = undefined;
    if(this.state.voucher.status === 'success'){
      voucherActionButton =  <button onClick={this.deleteVoucher} disabled={this.state.voucherLoading} className="input-group-addon delete-button">
          <span><i className="fa fa-trash" aria-hidden="true"></i> Delete</span>
  </button>
    } else {
      voucherActionButton = <button onClick={this.validateVoucher} disabled={this.state.voucherLoading} className="input-group-addon apply-button">
          <span><i className="fa fa-check" aria-hidden="true"></i> Apply</span>
      </button>
    }

    const FullView = (
        <div className="row network-config-selector ">
            <div className="col-md-12">
              <div className="form-group-attached">
                <div className="row clearfix">
                    <div className="col-md-4">
                        {dropDown}
                    </div>
                    <div className="col-md-8">
                        <div className="form-group form-group-default input-group">
                            <div className="form-input-group">
                                <label>Voucher Code {
                                  this.state.voucher && this.state.voucher.status === 'error' ? <span className="error-message">{this.state.voucher.error}</span> : this.state.voucher.status === 'success' ? <span className="success-message">Voucher Applied</span> : undefined
                                }</label>
                                <input type="text" className="form-control" name="projectName" ref={(input) => this.voucher = input} />
                            </div>
                            {voucherActionButton}
                        </div>
                    </div>
                </div>
                <div className="row clearfix">
                    <div className="col-md-4">
                        <div className="form-group form-group-default required">
                            <label>CPU (vCPUs)</label>
                            <input type="text" className="form-control" name="projectName" value={this.state.networkConfig.cpu} disabled />
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="form-group form-group-default ">
                            <label>RAM (GB)</label>
                            <input type="text" className="form-control" name="firstName" value={this.state.networkConfig.ram} disabled  />
                        </div>
                    </div>

                    <div className="col-md-4">
                        <div className="form-group form-group-default ">
                            <label>Disk Space (GB)</label>
                            <input type="number" className="form-control" name="firstName" required ref={(input) => this.diskSpace = input} disabled={!this.state.networkConfig.isDiskChangeable} onChange={this.onConfigChange.bind(this, true)} />
                        </div>
                    </div>
                </div>
              </div>

            </div>
        </div>
    );

    return FullView;
  }
}

export default NetworkConfigSelector;
