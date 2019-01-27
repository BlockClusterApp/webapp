import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter } from 'react-router-dom';
import NetworkConfiguration from '../../../../collections/network-configuration/network-configuration';
import ConfigCard from './components/ConfigCard';

class ConfigList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      page: 0,
    };
  }

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
            <ConfigCard config={this.props.configs[i]} />
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
          <ConfigCard config={{}} isInEditMode={true} />
        </div>
      </div>
    );

    return (
      <div className="content networksList">
        <div className="m-t-20 container-fluid container-fixed-lg">
          <div className="row">
            <div className="col-md-12">
              <h3 className="pull-left">Network Configuration</h3>
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
    configs: NetworkConfiguration.find({ active: true }).fetch(),
    subscriptions: [Meteor.subscribe('networkConfig.all')],
  };
})(withRouter(ConfigList));
