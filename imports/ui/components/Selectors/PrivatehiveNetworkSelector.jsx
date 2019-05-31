import React, { Component } from 'react';

class NetworkSelector extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    if (this.props && this.props.onValueChangeListener) {
      this.props.onValueChangeListener(this.props.networks && this.props.networks[0]);
    }
  }

  onValueChange() {
    if (this.props && this.props.onValueChangeListener) {
      this.props.onValueChangeListener(JSON.parse(this.location.value));
    }
  }

  render() {
    if (!this.props.networks) {
      return null;
    }
    const networkList = this.props.networks.map(network => (
      <option value={JSON.stringify(network)} key={network.instanceId}>
        {network.name} - {network.instanceId}
      </option>
    ));
    return (
      <div className="form-group form-group-default ">
        <label>{this.props.label}</label>
        <select
          className="form-control"
          name="location"
          disabled={this.props.disabled}
          ref={input => (this.location = input)}
          onChange={this.onValueChange.bind(this)}
          selected={JSON.stringify(this.props.networks[0])}
        >
          {networkList}
        </select>
      </div>
    );
  }
}

export default NetworkSelector;
