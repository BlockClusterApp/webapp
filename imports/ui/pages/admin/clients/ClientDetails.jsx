import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter, Link } from 'react-router-dom';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';
import axios from 'axios';
import notifications from '../../../../modules/notifications';

import './ClientDetails.scss';

class ClientDetails extends Component {
  constructor(props) {
    super(props);

    this.state = {
      expire: 1,
      rawData: {},
      formattedData: [],
    };
    this.query = {};

    this.policyIdArnMapping = {};
  }

  componentWillMount() {
    this.setState({
      voucherId: this.props.match.params.id,
    });
    this.query = { _id: this.props.match.params.id };
    this.getClientDetails();
  }
  handleChanges = e => {
    this.setState({
      [e.target.name]: e.target.value,
    });
  };

  genLicense = e => {
    const data = {
      clientId: this.state.rawData._id,
      expire: this.state.expire,
    };
    axios
      .post('/client/license-generate', data)
      .then(data => {
        this.setState(
          {
            rawData: Object.assign(this.state.rawData, data.data),
          },
          () => {
            console.log(this.state.rawData);
            this.letsFormatdata();
          }
        );
      })
      .catch(error => {
        console.log(error);
        notifications.error('cant reach server');
      });
  };
  letsFormatdata = e => {
    const i = this.state.rawData;
    const formattedData = {
      Name: i.clientDetails.clientName,
      Email: i.clientDetails.emailId,
      Phone: i.clientDetails.phone,
      'Licence Key': i.licenseDetails ? i.licenseDetails.licenseKey : '-',
      'Licence Created': i.licenseDetails
        ? new Date(i.licenseDetails.licenseCreated).toLocaleDateString() + ' ' + new Date(i.licenseDetails.licenseCreated).toLocaleTimeString()
        : '-',
      'License Expiry': i.licenseDetails
        ? new Date(i.licenseDetails.licenseExpiry).toLocaleDateString() + ' ' + new Date(i.licenseDetails.licenseExpiry).toLocaleTimeString()
        : '-',
        "Client Note":i.clientMeta ? i.clientMeta : '-',
        "Client Logo URI": i.clientLogo ? i.clientLogo : '-'
    };
    if(i.awsMetaData && i.awsMetaData.policies) {
      i.awsMetaData.policies.forEach(policy => {
        this.policyIdArnMapping[policy.PolicyId] = policy.Arn
      });
    }
    const updatedData = Object.keys(formattedData).map(i => {
      return { [i]: formattedData[i] };
    });
    this.setState(
      {
        rawData: i,
        formattedData: updatedData,
      }
    );
  };
  getClientDetails = () => {
    return axios
      .get('/client/filter?query=' + JSON.stringify(this.query))
      .then(data => {
        const i = data.data[0];
        this.setState(
          {
            rawData: i,
          },
          () => {
            this.letsFormatdata();
          }
        );
      })
      .catch(error => {
        console.log(error);
        notifications.error('cant reach server');
      });
  };
  genSecret = () => {
    this.setState({
      genSecret_formloading: true,
    });
    const data_post = {
      clientId: this.state.rawData._id,
    };
    return axios
      .post('/client/reset-secret', data_post)
      .then(data => {
        const i = data.data[0];
        this.setState({
          genSecret_formloading: false,
        });
        notifications.success('Reset Success.');
      })
      .catch(error => {
        this.setState({
          genSecret_formloading: false,
        });
        console.log(error);
        notifications.error('Unknown Error');
      });
  };

  render() {
    const { awsMetaData } = this.state.rawData;
    return (
      <div className="page-content-wrapper">
        <div className="content sm-gutter" style={{ paddingBottom: '0' }}>
          <div data-pages="parallax">
            {/* <div className="container-fluid p-l-25 p-r-25 sm-p-l-0 sm-p-r-0"> */}
            <div className="inner">
              <ol className="breadcrumb sm-p-b-5">
                <li className="breadcrumb-item">
                  <Link to="/app/admin">Admin</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link to="/app/admin/clients">Clients</Link>
                </li>
                <li className="breadcrumb-item active">{this.state.voucherId}</li>
              </ol>
              {/* </div> */}
            </div>
            {this.state.rawData &&
              (!this.state.rawData.licenseDetails || !this.state.rawData.licenseDetails.licenseKey) && (
                <div>
                  <label className="semi-bold">&nbsp;&nbsp; Generate License</label>
                  <p className="hint-text">&nbsp;&nbsp; number in months </p>
                  <div className="row">
                    &nbsp;&nbsp;
                    <input
                      name="expire"
                      type="number"
                      placeholder="in months"
                      className="form-control col-md-3"
                      onChange={this.handleChanges.bind(this)}
                      value={this.state.expire}
                      required
                    />
                    &nbsp;&nbsp;
                    <LaddaButton
                      data-size={S}
                      data-style={SLIDE_UP}
                      data-spinner-size={30}
                      data-spinner-lines={12}
                      className="btn btn-success "
                      onClick={this.genLicense.bind(this)}
                    >
                      <i className="pg-form" aria-hidden="true" />
                      &nbsp;&nbsp;Generate
                    </LaddaButton>
                    <br />
                  </div>
                </div>
              )}
          </div>
        </div>

        <div className="m-l-10 m-r-10 content ClientDetails" style={{ paddingTop: '0' }}>
          <div className="row">
            <div className="col-md-12">
              <div className="m-t-20 container-fluid container-fixed-lg bg-white">
                <div className="card-block">
                  <div className="table-responsive">
                    <table className="table table-hover table-condensed" id="condensedTable">
                      <thead>
                        <tr>
                          <th style={{ width: '30%' }}>Options</th>
                          <th style={{ width: '70%' }}>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {this.state.formattedData.map((element, index) => {
                          let Key = Object.keys(element)[0];
                          let Value = element[Key];
                          return (
                            <tr key={index + 1}>
                              <td className="v-align-middle semi-bold">{Key}</td>
                              <td className="v-align-middle">{Value}</td>
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
          <div className="row">
            <div className="m-t-20 m-l-20 m-r-20 container-fluid client-aws-table container-fixed-lg bg-white">

            <div className="card-header clearfix" style={{ backgroundColor: '#fff' }}>
              <h4 className="text-info pull-left">AWS Data</h4>
              <div className="clearfix" />
            </div>
              <div className="card-block row p-b-20">
                <div className="col-md-4">
                  <h4 className="text-info pull-left fs-12">AWS User</h4>
                  <div className="table-responsive">
                    <table className="table table-hover table-condensed" id="condensedTable">
                      <thead>
                        <tr>
                          <th style={{ width: '30%' }}>Property</th>
                          <th style={{ width: '70%' }}>Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="v-align-middle semi-bold">ARN</td>
                          <td className="v-align-middle">{awsMetaData && awsMetaData.user && awsMetaData.user.Arn}</td>
                        </tr>

                        <tr>
                          <td className="v-align-middle semi-bold">Created At</td>
                          <td className="v-align-middle">{awsMetaData && awsMetaData.user && awsMetaData.user.CreateDate}</td>
                        </tr>

                        <tr>
                          <td className="v-align-middle semi-bold">User Name</td>
                          <td className="v-align-middle">{awsMetaData && awsMetaData.user && awsMetaData.user.UserName}</td>
                        </tr>

                        <tr>
                          <td className="v-align-middle semi-bold">User Id</td>
                          <td className="v-align-middle">{awsMetaData && awsMetaData.user && awsMetaData.user.UserId}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="col-md-4">
                  <h4 className="text-info pull-left fs-12">Policies and Access Keys</h4>
                  <div className="table-responsive">
                    <table className="table table-hover table-condensed" id="condensedTable">
                      <thead>
                        <tr>
                          <th style={{ width: '40%' }}>Policy</th>
                          <th style={{ width: '60%' }}>Access Token</th>
                        </tr>
                      </thead>
                      <tbody>
                        {awsMetaData &&
                          awsMetaData.accessKeys &&
                          awsMetaData.accessKeys.map(key => {
                            return (
                              <tr>
                                <td className="v-align-middle semi-bold">{this.policyIdArnMapping[key.PolicyId]}</td>
                                <td className="v-align-middle">{key.AccessKeyId} | {key.SecretAccessKey}</td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="col-md-4">
                  <h4 className="text-info pull-left fs-12">Repository</h4>
                  <div className="table-responsive">
                    <table className="table table-hover table-condensed" id="condensedTable">
                      <thead>
                        <tr>
                          <th style={{ width: '30%' }}>Property</th>
                          <th style={{ width: '70%' }}>Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {awsMetaData &&
                          awsMetaData.ecrRepositories &&
                          awsMetaData.ecrRepositories.map(r => {
                            return (
                              <tr>
                                <td className="v-align-middle semi-bold">{r.RepoType}</td>
                                <td className="v-align-middle">{r.Arn}</td>
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
          <br />
          <div className="row justify-content-center">
            <div>
              &nbsp;&nbsp; &nbsp;&nbsp;
              <LaddaButton
                loading={this.state.genSecret_formloading ? this.state.genSecret_formloading : false}
                data-size={S}
                data-style={SLIDE_UP}
                data-spinner-size={30}
                data-spinner-lines={12}
                className="btn btn-danger"
                onClick={this.genSecret.bind(this)}
              >
                <i className="fa fa-user-secret" aria-hidden="true" />
                &nbsp;Generate New Secret
              </LaddaButton>
              <p className="hint-text m-t-10">&nbsp;&nbsp; Mail will be sent to user with secret key. </p>
              <br />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withTracker(() => {
  return {};
})(withRouter(ClientDetails));
