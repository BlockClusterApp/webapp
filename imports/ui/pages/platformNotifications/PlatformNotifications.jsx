import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter } from 'react-router-dom';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';
import notifications from '../../../modules/notifications';
import moment from 'moment';

import './PlatformNotifications.scss';
import WebHook from '../../../collections/webhooks';

class PlatformNotifications extends Component {
  constructor() {
    super();
    this.state = {
      webhook: {},
    };
  }

  componentWillUnmount() {
    this.props.subscriptions.forEach(s => {
      s.stop();
    });
  }

  getWebhookStatus = status => {
    if (status === 1) {
      return <span className="label label-info">Pending</span>;
    } else if (status === 2) {
      return <span className="label label-success">Success</span>;
    } else {
      return <span className="label label-danger">Failed</span>;
    }
  };

  updateURL = e => {
    e.preventDefault();

    this.setState({
      ['_nodeEvents_formloading']: true,
      ['_nodeEvents_formSubmitError']: '',
    });

    Meteor.call('updateNetworksCallbackURL', this['_nodeEvents_url'].value, error => {
      if (!error) {
        this.setState({
          ['_nodeEvents_formloading']: false,
          ['_nodeEvents_formSubmitError']: '',
        });

        notifications.success('URL Updated');
      } else {
        this.setState({
          ['_nodeEvents_formloading']: false,
          ['_nodeEvents_formSubmitError']: error.reason,
        });
      }
    });
  };

  showWebhook(webhook) {
    this.setState({
      webhook,
    });
    $('#modalSlideLeft_payload').modal('show');
  }

  render() {
    const { webhooks } = this.props;

    return (
      <div className="nodeEvents content">
        <div className="modal fade slide-right" id="modalSlideLeft_payload" tabIndex="-1" role="dialog" aria-hidden="true">
          <div className="modal-dialog modal-md">
            <div className="modal-content-wrapper">
              <div className="modal-content">
                <button type="button" className="close" data-dismiss="modal" aria-hidden="true">
                  <i className="pg-close fs-14" />
                </button>
                <div className="container-xs-height full-height">
                  <div className="row-xs-height">
                    <div className="modal-body col-xs-height col-middle ">
                      <h6 className="text-primary ">Webhook: {this.state.webhook.id}</h6>
                      <a href="#">{this.state.webhook.url}</a>
                      <br />
                      <br />
                      <b>Payload</b>
                      <pre style={{ background: '#eee', padding: '5px' }}>{JSON.stringify(this.state.webhook.payload, null, 2)}</pre>
                      <br />
                      <br />
                      <b>Status: {this.getWebhookStatus(this.state.webhook.status)}</b>
                      <br />
                      <b>Response code: {this.state.webhook.response && this.state.webhook.response.code}</b>
                      <br />
                      {moment(this.state.webhook.createdAt).format('DD-MMM-YYYY HH:mm:SS')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="m-t-20 container-fluid container-fixed-lg bg-white">
          <div className="row dashboard">
            <div className="col-lg-12">
              <div className="card card-transparent">
                <div className="card-header ">
                  <div className="card-title">Networks Notifications Web Book</div>
                </div>
                <div className="card-block">
                  <div className="card card-transparent">
                    <form
                      role="form"
                      onSubmit={e => {
                        this.updateURL(e);
                      }}
                    >
                      {this.props.user && (
                        <div className="form-group">
                          <label>URL</label>
                          <span className="help"> e.g. "http://callback.blockcluster.io/eventHandler"</span>
                          <input
                            type="text"
                            className="form-control"
                            required
                            defaultValue={this.props.user.profile.notifyURL}
                            ref={input => {
                              this['_nodeEvents_url'] = input;
                            }}
                          />
                        </div>
                      )}

                      {this.state['_nodeEvents_formSubmitError'] && (
                        <div className="row m-t-30">
                          <div className="col-md-12">
                            <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                              <button className="close" data-dismiss="alert" />
                              {this.state['_nodeEvents_formSubmitError']}
                            </div>
                          </div>
                        </div>
                      )}
                      <LaddaButton
                        loading={this.state['_nodeEvents_formloading']}
                        data-size={S}
                        data-style={SLIDE_UP}
                        data-spinner-size={30}
                        data-spinner-lines={12}
                        className="btn btn-success m-t-10"
                        type="submit"
                      >
                        <i className="fa fa-upload" aria-hidden="true" />
                        &nbsp;&nbsp;Update
                      </LaddaButton>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {webhooks && webhooks.length > 0 && (
            <div className="row dashboard">
              <div className="col-lg-12">
                <div className="card card-transparent">
                  <div className="card-header ">
                    <div className="card-title text-primary fs-16">History</div>
                  </div>
                  <div className="card-block">
                    <div className="card card-transparent">
                      <div className="auto-overflow widget-11-2-table" style={{ maxHeight: '400px' }}>
                        <table className="table table-condensed table-hover">
                          <thead>
                            <tr>
                              <th style={{ width: '40%' }}>ID</th>
                              <th style={{ width: '30%' }}>Timestamp</th>
                              <th style={{ width: '15%' }}>Status</th>
                              <th style={{ width: '15%' }}>Response code</th>
                            </tr>
                          </thead>
                          <tbody>
                            {webhooks &&
                              webhooks
                                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                .map((webhook, index) => {
                                  return (
                                    <tr
                                      key={index + 1}
                                      onClick={() => {
                                        this.showWebhook(webhook);
                                      }}
                                    >
                                      <td className="font-montserrat b-r b-dashed b-grey fs-12 w-40">{webhook.id}</td>
                                      <td className="font-montserrat b-r b-dashed b-grey all-caps fs-12 w-30">{moment(webhook.createdAt).format('DD-MMM-YYYY HH:mm:SS')}</td>
                                      <td className="text-right b-r b-dashed b-grey w-15" style={{ textAlign: 'center!important' }}>
                                        {this.getWebhookStatus(webhook.status)}
                                      </td>
                                      <td className="text-right b-r b-dashed b-grey w-15" style={{ textAlign: 'center!important' }}>
                                        {webhook.response && webhook.response.code}
                                      </td>
                                    </tr>
                                  );
                                })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default withTracker(props => {
  return {
    user: Meteor.user(),
    webhooks: WebHook.find({}).fetch(),
    subscriptions: [Meteor.subscribe('platform-webhooks')],
  };
})(withRouter(PlatformNotifications));
