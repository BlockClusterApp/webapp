import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { PrivatehiveOrderers } from '../../../collections/privatehiveOrderers/privatehiveOrderers';
import { PrivatehivePeers } from '../../../collections/privatehivePeers/privatehivePeers';
import { withRouter } from 'react-router-dom';
import { Link } from 'react-router-dom';

class ManageChaincode extends Component {
  constructor() {
    super();

    this.state = {
      chaincodes: [],
    };

    this.getAssetTypes = this.getAssetTypes.bind(this);
  }

  componentDidMount() {
    setTimeout(() => this.getAssetTypes(), 1000);
    this.setState({
      refreshAssetTypesTimer: setInterval(this.getAssetTypes, 15000),
    });
  }

  componentWillUnmount() {
    this.props.subscriptions.forEach(s => {
      s.stop();
    });

    clearInterval(this.state.refreshAssetTypesTimer);
  }

  getAssetTypes() {
    const { network } = this.props;
    let url = `https://${network.properties.apiEndPoint}/chaincode/installed`;
    HTTP.get(
      url,
      {
        headers: {
          'x-access-key': network.properties.tokens ? network.properties.tokens[0] : undefined,
        },
      },
      (err, res) => {
        if (!err) {
          this.setState({
            chaincodes: res.data.data.chaincodes,
          });
        }
      }
    );
  }

  render() {
    return (
      <div className="assetsStats content">
        <div className="m-t-20 container-fluid container-fixed-lg bg-white">
          <div className="row dashboard">
            <div className="col-lg-12">
              <div className="card card-transparent">
                <div className="card-header ">
                  <div className="card-title">
                    <Link to={`/app/privatehive/${this.props.match.params.id}/details`}>
                      {' '}
                      Control Panel <i className="fa fa-angle-right" />
                    </Link>{' '}
                    Chaincode Management
                  </div>
                </div>
                <div className="card-block">
                  <div className="row">
                    <div className="col-xl-12">
                      <div className="card card-transparent">
                        {this.props.network && (
                          <div className="table-responsive">
                            <table className="table table-hover" id="basicTable">
                              <thead>
                                <tr>
                                  <th style={{ width: '25%' }}>Chaincode Name</th>
                                  <th style={{ width: '55%' }}>Details</th>
                                  <th style={{ width: '20%' }}>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {this.state.chaincodes.map(cc => {
                                  return (
                                    <tr key={cc.name}>
                                      <td className="v-align-middle ">{cc.name}</td>
                                      <td className="v-align-middle">
                                        <b> Version:</b> {cc.version} <br />
                                        <b> Path:</b> {cc.path}
                                        <br />
                                        <b> Id:</b> {cc.id}
                                      </td>
                                      <td />
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withTracker(props => {
  return {
    network: [
      ...PrivatehivePeers.find({ instanceId: props.match.params.id, active: true }).fetch(),
      ...PrivatehiveOrderers.find({ instanceId: props.match.params.id, active: true }).fetch(),
    ][0],
    subscriptions: [
      Meteor.subscribe(
        'privatehive.one',
        { instanceId: props.match.params.id },
        {
          onReady: function() {
            if (
              [
                ...PrivatehivePeers.find({ instanceId: props.match.params.id, active: true }).fetch(),
                ...PrivatehiveOrderers.find({ instanceId: props.match.params.id, active: true }).fetch(),
              ].length !== 1
            ) {
              props.history.push('/app/privatehive');
            }
          },
        }
      ),
    ],
  };
})(withRouter(ManageChaincode));
