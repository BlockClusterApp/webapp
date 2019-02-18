import React, { Component } from 'react';

class LocationSelector extends Component {
  constructor(props) {
    super(props);

    this.state = {
      locations: [
        {
          locationCode: 'us-west-2',
          locationName: 'US West (Oregon)',
        },
      ],
    };
  }

  componentDidMount() {
    Meteor.call('getClusterLocations', { service: this.props.service || 'dynamo' }, (err, res) => {
      this.setState({
        locations: res,
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
      <option value={location.locationCode} key={location.locationName}>
        {location.locationName}
      </option>
    ));
    return (
      <div className="form-group form-group-default ">
        <label>Location</label>
        <select className="form-control" name="location" ref={input => (this.location = input)} onChange={this.onLocationChange.bind(this)} selected="us-west-2">
          {locationsList}
        </select>
      </div>
    );
  }
}

export default LocationSelector;
