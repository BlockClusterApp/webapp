import React, { Component } from 'react';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';
import LocationConfiguration from '../../../collections/locations';
import notifications from '../../../modules/notifications';

class ServiceLocation extends Component {
  constructor(props) {
    super(props);

    this.state = {
      service: props.service,
      allLocations: [],
    };

    if (!props.service) {
      throw new Error('Service Location should have service prop');
    }

    this.locationMapping = {};
    this.locationNameMapping = {};
  }

  componentDidMount = () => {
    Meteor.call('getClusterLocations', {}, (err, res) => {
      this.setState({
        allLocations: res,
      });
      this.subscription = Meteor.subscribe(
        'locations-config',
        { service: this.props.service },
        {
          onReady: () => {
            const locationConfig = LocationConfiguration.find({ service: this.props.service }).fetch()[0];
            this.state.allLocations.forEach(loc => {
              this.locationNameMapping[loc.locationCode] = loc.locationName;
              if (locationConfig) {
                if (locationConfig.locations.includes(loc.locationCode)) {
                  this.locationMapping[loc.locationCode] = true;
                } else {
                  this.locationMapping[loc.locationCode] = false;
                }
              } else {
                this.locationMapping[loc.locationCode] = true;
              }
            });
            this.setState({});
          },
        }
      );
    });
  };

  updateAvailableLocations = () => {
    this.setState({
      loading: true,
    });
    Meteor.call('updateServiceLocations', { service: this.props.service, locationMapping: this.locationMapping }, (err, res) => {
      this.setState({
        loading: false,
      });
      if (err) {
        return notifications.error(err.reason);
      }
      notifications.success('Locations updated');
    });
  };

  render() {
    const locationView = Object.keys(this.locationMapping).map(locationCode => {
      return (
        <div className="col-md-4 col-lg-3 col-sm-6 p-t-15" key={locationCode}>
          <label htmlFor={`label_${locationCode}`} style={{ cursor: 'pointer' }}>
            {this.locationNameMapping[locationCode]} ({locationCode})
          </label>
          &nbsp;
          <input
            type="checkbox"
            id={`label_${locationCode}`}
            defaultChecked={this.locationMapping[locationCode]}
            onClick={e => {
              this.locationMapping[locationCode] = e.target.checked;
            }}
          />
        </div>
      );
    });
    return (
      <div className="row">
        <div className="card bg-white">
          <div className="card-header ">
            <h5 className="text-info bold m-b-0 m-t-0">Available in Locations:</h5>
          </div>
          <div className="card-block">
            <div className="row">
              {locationView}
              <div className="col-md-4 col-lg-3 col-sm-6">
                <LaddaButton
                  loading={this.state.loading}
                  data-size={S}
                  data-style={SLIDE_UP}
                  data-spinner-size={30}
                  data-spinner-lines={12}
                  className="btn btn-success btn-cons m-t-10"
                  onClick={this.updateAvailableLocations}
                >
                  <i className="fa fa-save" aria-hidden="true" />
                  &nbsp;&nbsp;Save
                </LaddaButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default ServiceLocation;
