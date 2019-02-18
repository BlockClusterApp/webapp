import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter } from 'react-router-dom';
import NetworkConfiguration from '../../../../collections/network-configuration/network-configuration';
import ConfigCard from './components/ConfigCard';
import ServiceLocation from '../../../components/Selectors/ServiceLocation';

class ConfigList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      page: 0,
      locations: [],
    };
  }

  componentDidMount = () => {
    Meteor.call('getClusterLocations', {}, (err, res) => {
      this.setState({
        locations: res,
      });
    });
  };

  render() {
    const views = [];
    if (this.props.configs && this.props.configs.length > 0) {
      let currentRowObjects;
      for (let i = 0; i < this.props.configs.length; i++) {
        if (i % 2 === 0) {
          currentRowObjects = [];
        }
        currentRowObjects.push(
          <div className="col-md-6" key={`config_${i}`}>
            <ConfigCard config={this.props.configs[i]} locations={this.state.locations} />
          </div>
        );
        if (i % 2 === 1 || i === this.props.configs.length - 1) {
          views.push(
            <div className="row" key={`row_${i}`}>
              {currentRowObjects}
            </div>
          );
        }
      }
    }

    views.push(
      <div className="row" key="add_config">
        <div className="col-md-12">
          <ConfigCard config={{}} isInEditMode={true} locations={this.state.locations} />
        </div>
      </div>
    );

    return (
      <div className="networksList">
        <div className="m-t-20 container-fluid container-fixed-lg">
          <ServiceLocation service="dynamo" />
          <div className="row">
            <div className="col-md-12">
              <h3 className="pull-left">Dynamo Network Configuration</h3>
            </div>
          </div>
          {views}
        </div>
      </div>
    );
  }
}

export default withTracker(() => {
  return {
    configs: NetworkConfiguration.find({ active: true, for: 'dynamo' }).fetch(),
    subscriptions: [Meteor.subscribe('networkConfig.all')],
  };
})(withRouter(ConfigList));
