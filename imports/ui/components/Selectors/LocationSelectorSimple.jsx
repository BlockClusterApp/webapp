import React, { Component } from "react";

class LocationSelector extends Component {
  constructor(props) {
    super(props);

    this.state = {
      locations: [
        {
          locationCode: "us-west-2",
          locationName: "US West (Oregon)"
        }
      ]
    };
  }

  componentDidMount() {
    Meteor.call("getClusterLocations", (err, res) => {
      this.setState({
        locations: res
      });
      if (this.props && this.props.locationChangeListener) {
        this.props.locationChangeListener(res[0] ? res[0].locationCode : 'ap-south-1a');
      }
    });
  }

  onLocationChange() {
    if (this.props && this.props.locationChangeListener) {
      this.props.locationChangeListener(this.location.value);
    }
  }

  render() {
    const locationsList = this.state.locations.map(location => (
      <option value={location.locationCode} key={location.locationName}>{location.locationName}</option>
    ));
    return (
        <select
          className="form-control"
          name="location"
          style={this.props.style}
          ref={input => (this.location = input)}
          onChange={this.onLocationChange.bind(this)}
          selected="ap-south-1a"
        >
          {locationsList}
        </select>
    );
  }
}

export default LocationSelector;
