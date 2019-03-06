import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import PrivateHive from '../../../collections/privatehive';
import { withRouter } from 'react-router-dom';
import { Link } from 'react-router-dom';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';
import notifications from '../../../modules/notifications';

class CreateChannel extends Component {
  constructor() {
    super();

    this.state = {
      channels: [],
    };
  }

  componentDidMount() {}

  createChannel = () => {
    const { network } = this.props;
    if (!this.channelName.value) {
      return '';
    }
    this.setState({
      loading: true,
    });
    let url = `https://${network.properties.apiEndPoint}/channels`;
    HTTP.call(
      'POST',
      url,
      {
        headers: {
          'x-access-key': network.properties.tokens ? network.properties.tokens[0] : undefined,
        },
        data: {
          channelName: this.channelName.value,
          externalBroker: network.properties.externalKafkaBroker,
          ordererOrg: network.isJoin ? '' : network.instanceId.replace('ph-', ''),
        },
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
  };

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
                    Create Channel
                  </div>
                </div>
                <div className="card-block">
                  <div className="row">
                    <div className="col-xl-12">
                      <div className="card card-transparent">
                        <div className="form-group">
                          <label>Channel Name</label>
                          <span className="help"> e.g. "License"</span>
                          <input
                            type="text"
                            className="form-control"
                            required
                            ref={input => {
                              this.channelName = input;
                            }}
                          />
                        </div>
                        <LaddaButton
                          loading={this.state.loading}
                          data-size={S}
                          data-style={SLIDE_UP}
                          data-spinner-size={30}
                          data-spinner-lines={12}
                          className="btn btn-success m-t-10 col-md-3"
                          onClick={this.createChannel}
                        >
                          <i className="fa fa-plus-circle" aria-hidden="true" />
                          &nbsp;&nbsp;Create
                        </LaddaButton>
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
})(withRouter(CreateChannel));
