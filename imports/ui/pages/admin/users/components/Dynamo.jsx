import React from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter, Link } from 'react-router-dom';

import { Networks } from '../../../../../collections/networks/networks';

class DynamoDetails extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedNetwork: {},
    };
  }

  getNetworkType = network => {
    if (!network.metadata) {
      return null;
    }
    if (network.metadata.networkConfig) {
      const config = network.metadata.networkConfig;
      return `${config.cpu} vCPU | ${config.ram} GB | ${config.disk} GB`;
    }
    if (network.metadata.voucher) {
      const config = network.metadata.voucher.networkConfig;
      return `${config.cpu} vCPU | ${config.ram} GB | ${config.disk} GB`;
    }

    return null;
  };

  getNetworkTypeName = network => {
    const config = network.networkConfig;
    if (!config) {
      return <span className="label label-info">None</span>;
    }
    if (config.cpu === 500 && config.ram === 1 && config.disk === 50) {
      return <span className="label label-info">Light</span>;
    } else if (config.cpu === 2000 && config.ram >= 7.5 && config.ram <= 8) {
      return <span className="label label-info">Power</span>;
    }
    return <span className="label label-info">Custom</span>;
  };

  render() {
    const { networks } = this.props;
    return (
      <div className="row">
        <div className="col-lg-6 m-b-10 d-flex">
          <div className=" card no-border card-condensed no-margin widget-loader-circle align-self-stretch d-flex flex-column">
            <div className="card-header top-right">
              <div className="card-controls">
                <ul>
                  <li>
                    <a data-toggle="refresh" className="portlet-refresh text-black" href="#">
                      <i className="portlet-icon portlet-icon-refresh" />
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="padding-25">
              <div className="pull-left">
                <h2 className="text-success no-margin">Networks</h2>
                <p className="no-margin">Running Networks</p>
              </div>
              <h3 className="pull-right semi-bold">{networks && networks.length}</h3>
              <div className="clearfix" />
            </div>
            <div className="auto-overflow -table" style={{ maxHeight: '750px' }}>
              <table className="table table-condensed table-hover">
                <tbody>
                  {networks &&
                    networks
                      .sort((a, b) => b.createdOn - a.createdOn)
                      .map((network, index) => {
                        return (
                          <tr key={index + 1} onClick={() => this.setState({ selectedNetwork: network })}>
                            <td className="font-montserrat all-caps fs-12 w-40">
                              <Link to={`/app/admin/networks/${network._id}`}>{network.name}</Link>
                            </td>
                            <td className="text-right b-r b-dashed b-grey w-35">
                              <span className="hint-text small">{this.getNetworkType(network)}</span>
                            </td>
                            <td className="w-25">
                              <span className="font-montserrat fs-18">{this.getNetworkTypeName(network)}</span>
                            </td>
                          </tr>
                        );
                      })}
                  {!networks && (
                    <tr>
                      <td className="font-montserrat fs-12 w-100">No networks to show</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="col-lg-6 m-b-10 d-flex">
          <div className="card no-border  align-self-stretch d-flex flex-column">
            <div className="card-header">
              <div className="card-controls">
                <h4>Details</h4>
              </div>
            </div>
            <div className="card-block">
              <pre style={{ background: '#eee', padding: '5px' }}>{JSON.stringify(this.state.selectedNetwork, null, 2)}</pre>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withTracker(props => {
  return {
    networks: Networks.find({ user: props.match.params.id }).fetch(),
    subscriptions: [Meteor.subscribe('user.details.networks', { userId: props.match.params.id })],
  };
})(withRouter(DynamoDetails));
