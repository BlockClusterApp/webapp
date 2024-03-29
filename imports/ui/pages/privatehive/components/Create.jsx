import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter } from 'react-router-dom';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';
import LocationSelector from '../../../components/Selectors/LocationSelector.jsx';
import PrivateHiveNetworkConfigSelector from '../../../components/Selectors/PrivateHiveNetworkConfigSelector.jsx';
import CardVerification from '../../billing/components/CardVerification.jsx';
import notification from '../../../../modules/notifications';
import { PrivatehivePeers } from '../../../../collections/privatehivePeers/privatehivePeers';

class PaymentDashboard extends Component {
  constructor(props) {
    super(props);

    this.state = {
      locations: [],
      formSubmitError: '',
    };
  }

  componentWillUnmount() {
    this.props.subscriptions.forEach(s => {
      s.stop();
    });
  }

  cardVerificationListener = isVerified => {
    this.setState({
      cardVerified: isVerified,
      loading: false,
    });
  };

  createPrivateHiveNetwork = () => {
    const { config } = this.config;
    if (!(config && config.voucher && config.voucher.availability && !config.voucher.availability.card_vfctn_needed)) {
      if (!this.state.cardVerified) {
        return this.setState({
          showCreditCardAlert: true,
        });
      }
    }

    const name = this.networkName.value;
    const orgName = this.orgName.value;
    this.setState({
      loading: true,
    });
    if (!name) {
      return this.setState({
        formSubmitError: 'Label cannot be empty',
        loading: false,
      });
    }

    if (!orgName) {
      return this.setState({
        formSubmitError: 'Organisation name cannot be empty',
        loading: false,
      });
    }

    if (config.networkType === 'orderer' && !config.peerId) {
      return this.setState({
        formSubmitError: 'Cannot create orderer without peer',
        loading: false,
      });
    }
    // if (config.networkType === 'peer') {
    if (!config.networkConfig) {
      return this.setState({
        formSubmitError: 'Invalid Configuration',
        loading: false,
      });
    }
    // }

    Meteor.call(
      'initializePrivateHiveNetwork',
      {
        name,
        orgName,
        networkConfig: config.networkConfig,
        ordererType: config.ordererType,
        type: config.networkType,
        peerId: config.peerId,
        locationCode: this.locationCode,
        voucherId: config.voucher && config.voucher._id,
      },
      (err, res) => {
        this.setState({
          loading: false,
        });
        if (err) {
          return notification.error(err.reason);
        }
        this.props.history.push(`/app/privatehive/list`);
        notification.success('Deploying...');
      }
    );
  };

  render() {
    return (
      <div className="">
        <div className="m-t-20 container-fixed-lg bg-white">
          <div className="row">
            <div className="col-md-5">
              <div className="card card-transparent">
                <div className="card-block">
                  <h3>Create Your Hyperledeger Fabric Organisation</h3>
                  <p>Here you can create your own production grade HLF network</p>
                </div>
              </div>
            </div>
            <div className="col-md-7">
              <div className="card card-transparent">
                <div className="card-block">
                  <p>Basic Information</p>
                  <div className="form-group-attached">
                    <div className="row clearfix">
                      <div className="col-md-12">
                        <div className="form-group form-group-default required">
                          <label>Label</label>
                          <input
                            type="text"
                            className="form-control"
                            name="projectName"
                            required
                            ref={input => {
                              this.networkName = input;
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="row clearfix">
                      <div className="col-md-12">
                        <div className="form-group form-group-default required">
                          <label>Organisation Name</label>
                          <input
                            type="text"
                            className="form-control"
                            name="projectName"
                            required
                            ref={input => {
                              this.orgName = input;
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="row clearfix">
                      <div className="col-md-12">
                        <LocationSelector
                          locationChangeListener={locationCode => {
                            this.locationCode = locationCode;
                            this.setState({});
                          }}
                          service="privatehive"
                        />
                      </div>
                    </div>
                  </div>
                  <br />
                  <p>Node Configuration</p>
                  <PrivateHiveNetworkConfigSelector
                    locationCode={this.locationCode}
                    key={`${this.locationCode}-${this.props.networks.length}`}
                    networks={this.props.networks}
                    configChangeListener={config => {
                      this.config = config;
                      this.setState({
                        formSubmitError: '',
                        error: config.error,
                        showCreditCardAlert: this.state.showSubmitAlert && (config && config.voucher ? false : true),
                      });
                    }}
                  />
                  <br />
                  {this.state.formSubmitError != '' && (
                    <div className="row">
                      <div className="col-md-12">
                        <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                          <button className="close" data-dismiss="alert" />
                          {this.state.formSubmitError}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="verificationWrapper" style={{ display: this.state.showCreditCardAlert ? 'block' : 'none' }}>
                    <CardVerification cardVerificationListener={this.cardVerificationListener} />
                  </div>
                  <LaddaButton
                    disabled={(this.state.showCreditCardAlert && !this.state.cardVerified) || this.state.loading}
                    loading={this.state.loading}
                    data-size={S}
                    data-style={SLIDE_UP}
                    data-spinner-size={30}
                    data-spinner-lines={12}
                    onClick={this.createPrivateHiveNetwork}
                    className="btn btn-success"
                    type="submit"
                  >
                    <i className="fa fa-plus-circle" aria-hidden="true" />
                    &nbsp;&nbsp;Create
                  </LaddaButton>
                  {/* </form> */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withTracker(() => {
  return {
    networks: [
      ...PrivatehivePeers.find({ userId: Meteor.userId(), active: true })
        .fetch()
        .map(p => ({ ...p, type: 'peer' })),
      // ...PrivatehiveOrderers.find({ userId: Meteor.userId(), active: true })
      //   .fetch()
      //   .map(p => ({ ...p, type: 'orderer' })),
    ],
    subscriptions: [Meteor.subscribe('privatehive', {})],
  };
})(withRouter(PaymentDashboard));
