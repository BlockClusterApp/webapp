import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter } from 'react-router-dom';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';
import LocationSelector from '../../../components/Selectors/LocationSelector.jsx';
import NetworkConfigSelector from '../../../components/Selectors/NetworkConfigSelector.jsx';
import CardVerification from '../../billing/components/CardVerification.jsx';

import moment from 'moment';
import Helpers from '../../../../modules/helpers';

class PaymentDashboard extends Component {
  constructor(props) {
    super(props);

    this.state = {
      locations: [],
    };
  }

  componentWillUnmount() {
    this.props.subscriptions.forEach(s => {
      s.stop();
    });
  }

  componentDidMount() {}

  render() {
    return (
      <div className="">
        <div className="m-t-20 container-fixed-lg bg-white">
          <div className="row">
            <div className="col-md-5">
              <div className="card card-transparent">
                <div className="card-block">
                  <h3>Create Your Hyperledeger Fabric Network</h3>
                  <p>Lorem ipsum</p>
                  <ul>
                    <li>
                      <i>Voucher Code</i>: enter voucher code if you have one to get discount and other benefits
                    </li>
                    <li>
                      <i>Node Type</i>: select either development or production grade node i.e., light or power node
                    </li>
                    <li>
                      <i>Impulse URL</i>: add the impulse server URL of the network you want to join to achieve privacy features
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
                      <div className="col-md-6">
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
                      <div className="col-md-6">
                        <div className="form-group form-group-default ">
                          <label>Node Type</label>
                          <input type="text" className="form-control" name="firstName" required disabled value="Validator" />
                        </div>
                      </div>
                    </div>

                    <div className="row clearfix">
                      <div className="col-md-12">
                        <LocationSelector locationChangeListener={locationCode => (this.locationCode = locationCode)} />
                      </div>
                    </div>
                  </div>
                  <br />
                  <p>Node Configuration</p>
                  <NetworkConfigSelector
                    configChangeListener={config => {
                      this.config = config;
                      if (config.diskSpace > 16000) {
                        // 16TiB
                        return this.setState({
                          formSubmitError: 'Disk space cannot exceed 16000 GB',
                        });
                      }
                      this.setState({
                        formSubmitError: '',
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
                    disabled={this.state.showCreditCardAlert && !this.state.cardVerified}
                    loading={this.state.loading}
                    data-size={S}
                    data-style={SLIDE_UP}
                    data-spinner-size={30}
                    data-spinner-lines={12}
                    onClick={this.onSubmit}
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
