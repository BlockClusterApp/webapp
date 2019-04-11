import React, { Component } from 'react';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';
import { withTracker } from 'meteor/react-meteor-data';
import { PrivatehiveOrderers } from '../../../collections/privatehiveOrderers/privatehiveOrderers';
import { PrivatehivePeers } from '../../../collections/privatehivePeers/privatehivePeers';
import { withRouter } from 'react-router-dom';
import { Link } from 'react-router-dom';
import notifications from '../../../modules/notifications';

class ManageChaincode extends Component {
  constructor() {
    super();

    this.state = {
      chaincodes: [],
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
    this.getChannels();
    const { network } = this.props;
    Meteor.call('fetchChaincodes', { networkId: network.instanceId }, (err, res) => {
      if (err) {
        return notifications.error(err.reason);
      }
      this.setState({
        chaincodes: res.message,
      });
    });
  }

  installChaincode = chaincodeName => {
    this.setState({
      [`loading_${chaincodeName}_install`]: true,
    });
    Meteor.call('installChaincode', { name: chaincodeName, networkId: this.props.match.params.id }, (err, res) => {
      this.setState({
        [`loading_${chaincodeName}_install`]: false,
      });
      if (err) {
        return notifications.error('An error occured');
      } else {
        notifications.success('Chaincode installed');
      }
    });
  };

  getChannels() {
    Meteor.call(
      'fetchChannels',
      {
        networkId: this.props.match.params.id,
      },
      (err, res) => {
        this.setState({
          loading: false,
        });
        if (err) {
          return notifications.error(err.reason);
        }
        return this.setState({
          channels: res.message,
        });
      }
    );
  }

  instantiateChaincode = () => {
    this.setState({
      [`loading_${this.state.modalChaincodeName}_init`]: true,
    });

    if (!this.channelName.value) {
      this.setState({
        initError: true,
        initErrorMsg: 'Channel name missing',
        [`loading_${this.state.modalChaincodeName}_init`]: false,
      });
      return;
    }

    let args = this.args.value || '[]';

    try {
      args = JSON.parse(args);
    } catch (err) {
      this.setState({
        initError: true,
        initErrorMsg: 'Invalid Args. Must be a JSON array',
        [`loading_${this.state.modalChaincodeName}_init`]: false,
      });
      return;
    }

    Meteor.call(
      'instantiateChaincode',
      {
        name: this.state.modalChaincodeName,
        networkId: this.props.match.params.id,
        channelName: this.channelName.value,
        functionName: this.functionName.value,
        args,
        endorsmentPolicy: this.endorsmentPolicy.value,
      },
      (err, res) => {
        this.setState({
          [`loading_${this.state.modalChaincodeName}_init`]: true,
        });
        if (err) {
          this.setState({
            initError: true,
            initErrorMsg: 'An error occured',
            [`loading_${this.state.modalChaincodeName}_init`]: false,
          });
        } else {
          this.setState({
            [`loading_${this.state.modalChaincodeName}_init`]: false,
          });
          $('#chaincode_modal').modal('hide');
          notifications.success('Chaincode instantiated');
        }
      }
    );
  };

  render() {
    const channelOptions = this.state.channels.map((channel, index) => {
      return (
        <option key={channel.name} selected={index === 0}>
          {channel.name}
        </option>
      );
    });

    let Modal = (
      <div className="modal fade slide-right" id="chaincode_modal" tabIndex="-1" role="dialog" aria-hidden="true">
        <div className="modal-dialog modal-md">
          <div className="modal-content-wrapper">
            <div className="modal-content">
              <button type="button" className="close" data-dismiss="modal" aria-hidden="true">
                <i className="pg-close fs-14" />
              </button>
              <div className="container-md-height full-height">
                <div className="row-md-height">
                  <div className="modal-body col-md-height col-middle">
                    <div className="row clearfix">
                      <div className="col-md-12">
                        <div className="form-group form-group-default required">
                          <label>Select Channel</label>
                          <select className="form-control" ref={input => (this.channelName = input)} onChange={this.channelChangeListener}>
                            {channelOptions}
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="row clearfix">
                      <div className="col-md-12">
                        <div className="form-group form-group-default input-group">
                          <div className="form-input-group">
                            <label>Function name</label>
                            <input type="text" className="form-control" name="projectName" ref={input => (this.functionName = input)} />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="row clearfix">
                      <div className="col-md-12">
                        <div className="form-group form-group-default input-group">
                          <div className="form-input-group">
                            <label>Arguments</label>
                            <input type="text" placeholder="[]" className="form-control" name="projectName" ref={input => (this.args = input)} />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="row clearfix">
                      <div className="col-md-12">
                        <div className="form-group form-group-default input-group">
                          <div className="form-input-group">
                            <label>Endorsement Policy</label>
                            <textarea
                              placeholder={'Default: Only your org has to sign'}
                              rows={10}
                              className="form-control"
                              name="projectName"
                              ref={input => (this.endorsmentPolicy = input)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    {this.state.initError === true && (
                      <div className="row">
                        <div className="col-md-12">
                          <div className="m-b-10 alert alert-danger m-b-0" role="alert">
                            {this.state.initErrorMsg}
                          </div>
                        </div>
                      </div>
                    )}
                    <LaddaButton
                      loading={this.state[`loading_${this.state.modalChaincodeName}_init`]}
                      data-size={S}
                      data-style={SLIDE_UP}
                      data-spinner-size={30}
                      data-spinner-lines={12}
                      className="btn btn-success"
                      onClick={this.instantiateChaincode}
                    >
                      <i className="fa fa-check" aria-hidden="true" />
                      &nbsp;&nbsp;Instantiate
                    </LaddaButton>
                    &nbsp;
                    <button
                      type="button"
                      className="btn btn-default"
                      data-dismiss="modal"
                      onClick={() => {
                        $('#chaincode_modal').modal('hide');
                      }}
                    >
                      <i className="fa fa-times" aria-hidden="true" />
                      &nbsp;&nbsp;Close
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
        {Modal}
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
                                  <th style={{ width: '20%' }}>Chaincode Name</th>
                                  <th style={{ width: '20%' }}>Version</th>
                                  <th style={{ width: '20%' }}>Language</th>
                                  <th style={{ width: '40%' }}>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {this.state.chaincodes.map(cc => {
                                  return (
                                    <tr key={cc.name}>
                                      <td className="v-align-middle ">{cc.name}</td>
                                      <td className="v-align-middle ">{cc.version}</td>
                                      <td className="v-align-middle ">{cc.language === 'golang' ? 'Go' : 'Node'}</td>
                                      <td>
                                        <LaddaButton
                                          loading={this.state[`loading_${cc.name}_install`]}
                                          disabled={this.state[`loading_${cc.name}_install`]}
                                          data-size={S}
                                          data-style={SLIDE_UP}
                                          data-spinner-size={30}
                                          data-spinner-lines={12}
                                          onClick={this.onSubmit}
                                          className="btn btn-complete"
                                          onClick={() => {
                                            this.installChaincode(cc.name);
                                          }}
                                        >
                                          <i className="fa fa-thumb-tack" aria-hidden="true" />
                                          &nbsp;&nbsp;Install
                                        </LaddaButton>
                                        &nbsp;&nbsp;
                                        <LaddaButton
                                          loading={this.state[`loading_${cc.name}_init`]}
                                          disabled={this.state[`loading_${cc.name}_init`]}
                                          data-size={S}
                                          data-style={SLIDE_UP}
                                          data-spinner-size={30}
                                          data-spinner-lines={12}
                                          onClick={this.onSubmit}
                                          className="btn btn-primary"
                                          onClick={() => {
                                            this.setState({
                                              modalChaincodeName: cc.name,
                                              initError: false,
                                              initErrorMsg: '',
                                            });
                                            $('#chaincode_modal').modal('show');
                                          }}
                                        >
                                          <i className="fa fa-arrow-circle-o-right" aria-hidden="true" />
                                          &nbsp;&nbsp;Instantiate
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
              props.history.push('/app/privatehive/list');
            }
          },
        }
      ),
    ],
  };
})(withRouter(ManageChaincode));
