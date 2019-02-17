import React, { Component } from 'react';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';
import { withRouter } from 'react-router-dom';
import { Networks } from '../../../collections/networks/networks.js';
import notifications from '../../../modules/notifications';
import LocationSelector from '../../components/Selectors/LocationSelector.jsx';
import NetworkConfigSelector from '../../components/Selectors/NetworkConfigSelector.jsx';
import CardVerification from '../billing/components/CardVerification.jsx';

class CreateNetwork extends Component {
  constructor() {
    super();
    this.locationCode = 'ap-south-1a';
    this.state = {
      formSubmitError: '',
      loading: false,
      showSubmitAlert: false,
      microNodesViolated: false,
    };
    this.networks = [];
  }

  componentDidMount() {
    // Meteor.call('nodeCount', (err, res) => {
    //   if(!err){
    //     if(res.micro >= 0){
    //       this.setState({
    //         microNodesViolated: true,
    //         nodeCount: res
    //       });
    //     }
    //   }
    // });
  }

  onSubmit = e => {
    this.setState({
      showSubmitAlert: true,
    });
    e.preventDefault();
    // const isVoucherMicro = (this.config.voucher &&  this.config.voucher.networkConfig && this.config.voucher.networkConfig.cpu === 0.5);
    // const isMicro = (this.config && this.config.config && (this.config.config.cpu === 0.5 || this.config.config.name && this.config.config.name.toLowerCase() === 'light')) || isVoucherMicro;
    // if(this.state.nodeCount.micro >= 2 && isMicro){
    //   return this.setState({
    //     formSubmitError: 'You can have at max only 2 micro nodes at a time',
    //   });
    // }

    if (!(this.config && this.config.voucher)) {
      if (!this.state.cardVerified) {
        return this.setState({
          showCreditCardAlert: true,
        });
      }
    }

    if (!this.networkName.value) {
      return;
      this.setState({
        formSubmitError: 'Network name is required',
      });
    }

    this.setState({
      formSubmitError: '',
    });

    this.setState({
      formSubmitError: '',
      loading: true,
    });

    Meteor.call('createNetwork', { networkName: this.networkName.value, locationCode: this.locationCode, networkConfig: { ...this.config } }, (error, reply) => {
      if (!error) {
        this.setState({
          loading: false,
          formSubmitError: '',
        });
        this.props.history.push(`/app/networks/${reply}`);
        notifications.success('Initializing node');
      } else {
        this.setState({
          loading: false,
          formSubmitError: error.reason || error.error,
        });
      }
    });
  };

  cardVerificationListener = isVerified => {
    this.setState({
      cardVerified: isVerified,
      loading: false,
    });
  };

  render() {
    return (
      <div className="content ">
        <div className="m-t-20 container-fluid container-fixed-lg bg-white">
          <div className="row">
            <div className="col-md-5">
              <div className="card card-transparent">
                <div className="card-header ">
                  <div className="card-title">Create Network</div>
                </div>
                <div className="card-block">
                  <h3>Create Your Blockchain Network</h3>
                  <p>This will create a private and permissioned blockchain network. Technically it will create a single node network.</p>
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
                        <LocationSelector
                          locationChangeListener={locationCode => {
                            this.locationCode = locationCode;
                            this.setState({});
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <br />
                  <p>Node Configuration</p>
                  <NetworkConfigSelector
                    locationCode={this.locationCode}
                    key={this.locationCode}
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

export default withRouter(CreateNetwork);
