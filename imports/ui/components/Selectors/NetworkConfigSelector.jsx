import React, { Component } from "react";

class NetworkConfigSelector extends Component {
  constructor(props) {
    super(props);

    this.state = {
      configs: {},
      networkConfig: {
        name: 'Micro',
        cpu: 0.5,
        ram: 500,
        disk: 5
      }
    };
  }

  componentDidMount() {
    Meteor.call("getConfigs", (err, res) => {
      this.setState({
        configs: res
      });
      this.config.value = "Micro";
      this.onConfigChange();
    });

  }

  onConfigChange(skipDefault) {
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

  render() {
    const configList = Object.values(this.state.configs).map(config => (
      <option value={config.name} key={config._id}>{config.name}</option>
    ));
    const dropDown =  (
      <div className="form-group form-group-default ">
        <label>Node Type</label>
        <select
          className="form-control"
          name="location"
          ref={input => (this.config = input)}
          onChange={this.onConfigChange.bind(this, false)}
          selected="Select node type"
        >
          {configList}
        </select>
      </div>
    );

    const FullView = (
        <div className="row">
            <div className="col-md-12">
              <div className="form-group-attached">
                <div className="row clearfix">
                    <div className="col-md-12">
                        {dropDown}
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
                            <input type="number" className="form-control" name="firstName" required ref={(input) => this.diskSpace = input} disabled={this.state.networkConfig.name.toLowerCase() === "micro"} onChange={this.onConfigChange.bind(this, true)} />
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
