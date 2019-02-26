import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import PrivateHive from '../../../collections/privatehive';
import { withRouter } from 'react-router-dom';
import { Link } from 'react-router-dom';

class ManageChannels extends Component {
  constructor() {
    super();

    this.state = {
      channels: [],
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
    let url = `https://${network.properties.apiEndPoint}/channels`;
    HTTP.get(
      url,
      {
        headers: {
          'x-access-key': network.properties.tokens ? network.properties.tokens[0] : undefined,
          // Authorization: 'Basic ' + new Buffer(`${this.props.network[0].instanceId}:${this.props.network[0]['api-password']}`).toString('base64'),
        },
      },
      (err, res) => {
        if (!err) {
          this.setState({
            channels: res.data.data.channels,
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
                    Channel Management
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
                                  <th style={{ width: '50%' }}>Channel Name</th>
                                  <th style={{ width: '50%' }}>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {this.state.channels.map(channel => {
                                  return (
                                    <tr key={channel.channel_id}>
                                      <td className="v-align-middle ">{channel.channel_id}</td>
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
    network: PrivateHive.find({ instanceId: props.match.params.id, active: true }).fetch()[0],
    subscriptions: [
      Meteor.subscribe(
        'privatehive.one',
        { instanceId: props.match.params.id, active: true },
        {
          onReady: function() {
            if (PrivateHive.find({ instanceId: props.match.params.id, active: true }).fetch().length !== 1) {
              props.history.push('/app/privatehive');
            }
          },
        }
      ),
    ],
  };
})(withRouter(ManageChannels));
