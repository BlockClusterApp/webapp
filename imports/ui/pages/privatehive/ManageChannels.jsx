import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import PrivateHive from '../../../collections/privatehive';
import { withRouter } from 'react-router-dom';
import { Link } from 'react-router-dom';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';
import notifications from '../../../modules/notifications';

class ManageChannels extends Component {
  constructor() {
    super();

    this.state = {
      channels: [],
      modalChannel: {},
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

  showAddOrgModal = channelName => {
    return this.setState(
      {
        showModal: true,
        modalChannel: {
          name: channelName,
        },
      },
      () => {
        $('#channel_details_modal').modal('show');
      }
    );
  };

  addOrgToChannel = () => {
    if (!this.orgEndpoint.value) {
      return this.setState({
        modalError: 'Endpoint is required',
      });
    }
    this.setState({
      loading: true,
    });
    Meteor.call(
      'addOrgToChannel',
      {
        channelName: this.state.modalChannel.name,
        organizationId: this.props.network.instanceId,
        newOrgEndpoint: this.orgEndpoint.value,
      },
      (err, res) => {
        this.setState({
          loading: false,
        });
        if (err) {
          return notifications.error(err.reason);
        }
        return notifications.success('Proposal sent');
      }
    );
    // const url = `https://${network.properties.apiEndPoint}/channels`;
    // HTTP.call(
    //   'POST',
    //   url,
    //   {
    //     headers: {
    //       'x-access-key': network.properties.tokens ? network.properties.tokens[0] : undefined,
    //     },
    //     data: {
    //       channelName: this.channelName.value,
    //       externalBroker: network.properties.externalKafkaBroker,
    //       ordererOrg: network.isJoin ? '' : network.instanceId.replace('ph-', ''),
    //     },
    //   },
    //   (err, res) => {
    //     this.setState({
    //       loading: false,
    //       showModal: false
    //     });
    //     if (err) {
    //       return notifications.error(err.reason);
    //     }
    //     return notifications.success('Proposal sent');
    //   }
    // );
  };

  render() {
    const Modal = this.state.showModal && (
      <div className="modal fade slide-right" id="channel_details_modal" tabIndex="-1" role="dialog" aria-hidden="true">
        <div className="modal-dialog modal-md">
          <div className="modal-content-wrapper">
            <div className="modal-content">
              <button type="button" className="close" data-dismiss="modal" aria-hidden="true">
                <i className="pg-close fs-14" />
              </button>
              <div className="container-md-height full-height">
                <div className="row-md-height">
                  <div className="modal-body col-md-height col-middle">
                    <h3>
                      Add new org to <b>{this.state.modalChannel.name}</b>
                    </h3>
                    <br />
                    <p>
                      <b>Note:</b> You can only add peers created using blockcluster platform using this interface
                    </p>
                    <br />
                    <br />
                    <div className="row clearfix">
                      <div className="col-md-12">
                        <div className="form-group form-group-default input-group">
                          <div className="form-input-group">
                            <label>Organization API-Client Endpoint</label>
                            <input type="text" className="form-control" name="projectName" ref={input => (this.orgEndpoint = input)} />
                          </div>
                        </div>
                      </div>
                    </div>
                    <br />
                    <LaddaButton
                      loading={this.state.loading}
                      data-size={S}
                      data-style={SLIDE_UP}
                      data-spinner-size={30}
                      data-spinner-lines={12}
                      className="btn btn-success"
                      onClick={this.addOrgToChannel}
                    >
                      <i className="fa fa-circle-plus" aria-hidden="true" />
                      &nbsp;&nbsp;Add Org
                    </LaddaButton>
                    &nbsp;
                    <button
                      type="button"
                      className="btn btn-default"
                      data-dismiss="modal"
                      onClick={() => {
                        $('#channel_details_modal').modal('hide');
                        setTimeout(this.setState({ showModal: false }), 1000);
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

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
                                      <td>
                                        <LaddaButton
                                          data-size={S}
                                          data-style={SLIDE_UP}
                                          data-spinner-size={30}
                                          data-spinner-lines={12}
                                          className="btn btn-primary"
                                          onClick={() => {
                                            this.props.history.push(`/app/privatehive/${this.props.match.params.id}/channels/explorer?channel=${channel.channel_id}`);
                                          }}
                                        >
                                          <i className="fa fa-eye" aria-hidden="true" />
                                          &nbsp;&nbsp;Audit
                                        </LaddaButton>
                                        &nbsp;&nbsp;
                                        <LaddaButton
                                          data-size={S}
                                          data-style={SLIDE_UP}
                                          data-spinner-size={30}
                                          data-spinner-lines={12}
                                          className="btn btn-success"
                                          onClick={this.showAddOrgModal.bind(this, channel.channel_id)}
                                        >
                                          <i className="fa fa-circle-plus" aria-hidden="true" />
                                          &nbsp;&nbsp;Add Org
                                        </LaddaButton>
                                      </td>
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
        {Modal}
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
