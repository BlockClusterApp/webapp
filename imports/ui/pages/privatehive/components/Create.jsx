import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter } from 'react-router-dom';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';
import LocationSelector from '../../../components/Selectors/LocationSelector.jsx';
import PrivateHiveNetworkConfigSelector from '../../../components/Selectors/PrivateHiveNetworkConfigSelector.jsx';
import CardVerification from '../../billing/components/CardVerification.jsx';
import notification from '../../../../modules/notifications';

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

  createPrivateHiveNetwork = () => {
    const name = this.networkName.value;
    this.setState({
      loading: true,
    });
    if (!name) {
      return this.setState({
        formSubmitError: 'Name cannot be empty',
        loading: false,
      });
    }
    Meteor.call(
      'initializePrivateHiveNetwork',
      { name, networkConfig: this.config, locationCode: this.locationCode, voucherId: this.selectedVoucher ? this.selectedVoucher._id : undefined },
      (err, res) => {
        this.setState({
          loading: false,
        });
        if (err) {
          return notification.error(err.reason);
        }
        this.props.history.push(`/app/privatehive/list`);
        notification.success('Network Creating');
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
                  <h3>Create Your Hyperledeger Fabric Network</h3>
                  <p>Here you can create your own production grade HLF network</p>
                  <ul>
                    <li>
                      <i>Orderer</i>: Orderer is responsible for creating blocks. The authority of the network should be the creator of the network and is who hosts the orderer.
                    </li>
                    <li>
                      <i>Kafka and Zookeeper</i>: These are internal components of Orderer, which enable orderer to handle large TPS.
                    </li>
                    <li>
                      <i>Data Disk Space</i>: This space will hold all your CA certs, chaincodes, channel config files, channel blocks and other generated artifacts.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-md-7">
              <div className="card card-transparent">
                <div className="card-block">
                  {/* <form id="form-project" role="form" onSubmit={this.onSubmit} autoComplete="off"> */}
                  <p>Basic Information</p>
                  <div className="form-group-attached">
                    <div className="row clearfix">
                      <div className="col-md-12">
                        <div className="form-group form-group-default required">
                          <label>Network name</label>
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
                    key={this.locationCode}
                    configChangeListener={config => {
                      const voucher = config.voucher;
                      delete config.voucher;
                      this.config = config;
                      this.selectedVoucher = voucher;
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
                    disabled={(this.state.showCreditCardAlert && !this.state.cardVerified) || this.state.error || this.state.formSubmitError || this.state.loading}
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
    subscriptions: [],
  };
})(withRouter(PaymentDashboard));