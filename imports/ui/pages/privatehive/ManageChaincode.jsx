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
    Meteor.call('fetchChaincodes', { networkId: network.instanceId }, (err, res) => {
      if (err) {
        return notifications.error(err.reason);
      }
      this.setState({
        chaincodes: res.message,
      });
    });
  }

  installChaincode = () => {
    const chaincodeName = this.state.modalChaincodeName;
    this.setState({
      [`loading_${chaincodeName}`]: true,
    });
    Meteor.call('installChaincode', { name: chaincodeName, networkId: this.props.match.params.id }, (err, res) => {
      this.setState({
        [`loading_${chaincodeName}`]: true,
      });
      if (err) {
        return notifications.error(err.reason);
      }
      notifications.success('Installed');
    });
  };

  instantiateChaincode = chaincodeName => {
    this.setState({
      [`loading_${chaincodeName}`]: true,
    });
    if (!this.channelName.value) {
      return notifications.error('Channel required');
    }
    Meteor.call(
      'instantiateChaincode',
      {
        name: this.state.modalChaincodeName,
        networkId: this.props.match.params.id,
        channelName: this.channelName.value,
        functionName: this.functionName.value,
        args: this.args.value,
        endorsmentPolicy: this.endorsmentPolicy.value,
      },
      (err, res) => {
        this.setState({
          [`loading_${chaincodeName}`]: true,
        });
        if (err) {
          return notifications.error(err.reason);
        }
        notifications.success('Instantiated');
        $('#chaincode_modal').modal('hide');
      }
    );
  };

  render() {
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
                    <h3>
                      Instantiate Chaincode <b>{this.state.modalChaincodeName}</b>
                    </h3>
                    <br />
                    <div className="row clearfix">
                      <div className="col-md-12">
                        <div className="form-group form-group-default input-group">
                          <div className="form-input-group">
                            <label>Channel Name</label>
                            <input type="text" className="form-control" name="projectName" ref={input => (this.channelName = input)} />
                          </div>
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
                            <label>Args</label>
                            <input type="text" className="form-control" name="projectName" ref={input => (this.args = input)} />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="row clearfix">
                      <div className="col-md-12">
                        <div className="form-group form-group-default input-group">
                          <div className="form-input-group">
                            <label>Endorsment Policy</label>
                            <input type="text" className="form-control" name="projectName" ref={input => (this.endorsmentPolicy = input)} />
                          </div>
                        </div>
                      </div>
                    </div>
                    <br />
                    <LaddaButton
                      loading={this.state[`loading_${this.state.modalChaincodeName}`]}
                      data-size={S}
                      data-style={SLIDE_UP}
                      data-spinner-size={30}
                      data-spinner-lines={12}
                      className="btn btn-success"
                      onClick={this.instantiateChaincode}
                    >
                      <i className="fa fa-circle-plus" aria-hidden="true" />
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
                                  <th style={{ width: '25%' }}>Chaincode Name</th>
                                  <th style={{ width: '35%' }}>Details</th>
                                  <th style={{ width: '40%' }}>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {this.state.chaincodes.map(cc => {
                                  return (
                                    <tr key={cc.name}>
                                      <td className="v-align-middle ">{cc.name}</td>
                                      <td className="v-align-middle">
                                        <b> Version:</b> {cc.version} <br />
                                        <b> Language:</b> {cc.language}
                                        {/* <br /> */}
                                        {/* <b> Id:</b> {cc.id} */}
                                      </td>
                                      <td>
                                        <LaddaButton
                                          loading={this.state[`loading_${cc.name}`]}
                                          disabled={this.state[`loading_${cc.name}`]}
                                          data-size={S}
                                          data-style={SLIDE_UP}
                                          data-spinner-size={30}
                                          data-spinner-lines={12}
                                          onClick={this.onSubmit}
                                          className="btn btn-info"
                                          onClick={() => {
                                            this.installChaincode(cc.name);
                                          }}
                                        >
                                          <i className="fa fa-save" aria-hidden="true" />
                                          &nbsp;&nbsp;Install
                                        </LaddaButton>
                                        &nbsp;&nbsp;
                                        <LaddaButton
                                          loading={this.state[`loading_${cc.name}`]}
                                          disabled={this.state[`loading_${cc.name}`]}
                                          data-size={S}
                                          data-style={SLIDE_UP}
                                          data-spinner-size={30}
                                          data-spinner-lines={12}
                                          onClick={this.onSubmit}
                                          className="btn btn-primary"
                                          onClick={() => {
                                            this.setState({
                                              modalChaincodeName: cc.name,
                                            });
                                            $('#chaincode_modal').modal('show');
                                          }}
                                        >
                                          <i className="fa fa-save" aria-hidden="true" />
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
