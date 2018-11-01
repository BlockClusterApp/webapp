import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter, Link } from 'react-router-dom';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';
import axios from 'axios';
import notifications from '../../../../modules/notifications';
import EditableText from '../../../components/EditableText/EditableText';

import './ClientDetails.scss';

class ClientDetails extends Component {
  constructor(props) {
    super(props);

    this.state = {
      expire: 1,
      rawData: {},
      formattedData: [],
      featureList: {},
    };
    this.query = {};

    this.newClient = {};
    this.updateClient = {};

    this.policyIdArnMapping = {};
  }

  componentWillMount() {
    this.setState({
      clientId: this.props.match.params.id,
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
      'Licence Key': i.licenseDetails ? i.licenseDetails.licenseKey : '-',
      'Licence Created': i.licenseDetails
        ? new Date(i.licenseDetails.licenseCreated).toLocaleDateString() + ' ' + new Date(i.licenseDetails.licenseCreated).toLocaleTimeString()
        : '-',
      'License Expiry': i.licenseDetails
        ? new Date(i.licenseDetails.licenseExpiry).toLocaleDateString() + ' ' + new Date(i.licenseDetails.licenseExpiry).toLocaleTimeString()
        : '-',
    };
    if (i.awsMetaData && i.awsMetaData.policies) {
      i.awsMetaData.policies.forEach(policy => {
        this.policyIdArnMapping[policy.PolicyId] = policy.Arn;
      });
    }
    const updatedData = Object.keys(formattedData).map(i => {
      return { [i]: formattedData[i] };
    });
    this.setState({
      rawData: i,
      formattedData: updatedData,
      featureList: { ...this.state.featureList, ...i.servicesIncluded },
    });
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

  saveClientInfo = () => {
    this.setState({
      clientDetailsSaving: true,
    });
    axios.patch('/client', {
      client: {...this.updateClient, _id: this.props.match.params.id},
      updatedBy: this.props.userId
    })
    .then(res => {
      this.setState({
        clientDetailsChanged: false,
        clientDetailsSaving: false,
        rawData: res.data[0],
      }, () => {
        this.letsFormatdata();
      });
    })

  }

  textChanged = (property, value) => {
    if (!this.newClient) {
      this.newClient = {};
    }

    if (property.includes('.')) {
      const parts = property.split('.');
      if (parts.length === 2) {
        this.newClient[parts[0]] = this.newClient[parts[0]] || {};
        this.newClient[parts[0]][parts[1]] = value;
      } else if (parts.length === 3) {
        this.newClient[parts[0]] = this.newClient[parts[0]] || {};
        this.newClient[parts[0]][parts[1]] = this.newClient[parts[0]][parts[1]] || {};
        this.newClient[parts[0]][parts[1]][parts[2]] = value;
      } else {
        throw new Error('Property contains more than 3 parts');
      }
    }else {
      this.newClient[property] = value;
    }

    this.updateClient[property] = value;

    this.setState({
      clientDetailsChanged: true
    });
  };

  render() {
    const { awsMetaData } = this.state.rawData;
    let client = this.state.rawData;
    if (!client) {
      client = {
        agentMeta: {}
      };
    }

    if (!client.agentMeta) {
      client.agentMeta = {};
    }
    let { clientDetails } = client;

    if (!clientDetails) {
      clientDetails = {};
    }
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
                <li className="breadcrumb-item active">{this.state.clientId}</li>
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
              <div className="m-l-20 m-r-20 container-fluid container-fixed-lg bg-white">
                <div className="card-header clearfix" style={{ backgroundColor: '#fff' }}>
                  <h4 className="text-primary pull-left">Client Details</h4>
                  <LaddaButton
                      disabled={!this.state.clientDetailsChanged}
                      data-size={S}
                      data-style={SLIDE_UP}
                      data-spinner-size={30}
                      data-spinner-lines={12}
                      className="btn btn-success pull-right "
                      onClick={this.saveClientInfo.bind(this)}
                      loading={this.state.clientDetailsSaving}
                      style={{marginTop: '10px'}}
                    >
                      <i className="fa fa-save"/>}
                      &nbsp;&nbsp;Save Changes
                    </LaddaButton>
                  <div className="clearfix" />
                </div>
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
                        <tr>
                          <td className="v-align-middle semi-bold">Name</td>
                          <td className="v-align-middle">
                            <EditableText
                              value={this.newClient.clientDetails && this.newClient.clientDetails.clientName ? this.newClient.clientDetails.clientName : clientDetails.clientName}
                              valueChanged={this.textChanged.bind(this, 'clientDetails.clientName')}
                            />
                          </td>
                        </tr>
                        <tr>
                          <td className="v-align-middle semi-bold">Email</td>
                          <td className="v-align-middle"><EditableText
                              value={this.newClient.clientDetails && this.newClient.clientDetails.emailId ? this.newClient.clientDetails.emailId : clientDetails.emailId}
                              valueChanged={this.textChanged.bind(this, 'clientDetails.emailId')}
                            /></td>
                        </tr>
                        <tr>
                          <td className="v-align-middle semi-bold">Contact</td>
                          <td className="v-align-middle">
                            <EditableText
                              value={this.newClient.clientDetails && this.newClient.clientDetails.phone ? this.newClient.clientDetails.phone : clientDetails.phone}
                              valueChanged={this.textChanged.bind(this, 'clientDetails.phone')}
                            />
                          </td>
                        </tr>
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
                        <tr>
                          <td className="v-align-middle semi-bold">Client Note</td>
                          <td className="v-align-middle">
                            <EditableText value={this.newClient.clientMeta || client.clientMeta} valueChanged={this.textChanged.bind(this, 'clientMeta')} />
                          </td>
                        </tr>

                        <tr>
                          <td className="v-align-middle semi-bold">Client Logo</td>
                          <td className="v-align-middle">
                            <EditableText value={this.newClient.clientLogo || client.clientLogo} valueChanged={this.textChanged.bind(this, 'clientLogo')} />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
          </div>

          <div className="row">
            <div className="m-t-20 m-l-20 m-r-20 container-fluid client-aws-table container-fixed-lg bg-white">
              <div className="row">
                <div className="col-md-12">
                  <div className="m-t-20">
                    <div className="card-header clearfix" style={{ backgroundColor: '#fff' }}>
                      <h4 className="text-primary pull-left">Configurations</h4>
                      <div className="clearfix" />
                    </div>
                    <div className="card-block">
                      <div className="row">
                        <div className="col-md-6">
                          <div className="card-header clearfix" style={{ backgroundColor: '#fff' }}>
                            <h5 className="text-info pull-left">Feature gates</h5>
                            <div className="clearfix" />
                          </div>
                          <div className="table-responsive">
                            <table className="table table-hover table-condensed" id="condensedTable">
                              <thead>
                                <tr>
                                  <th style={{ width: '50%' }}>Feature</th>
                                  <th style={{ width: '50%' }}>Activated</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.keys(this.state.featureList).map(feature => {
                                  return (
                                    <tr key={feature}>
                                      <td className="v-align-middle semi-bold">{feature}</td>
                                      <td className="v-align-middle">
                                        <input
                                          type="checkbox"
                                          value={feature}
                                          defaultChecked={this.state.featureList[feature] ? 'checked' : ''}
                                          onClick={e => {
                                            if (e.target.checked) {
                                              // this.query.deletedAt = null;
                                            } else {
                                              // delete this.query.deletedAt
                                            }
                                            // this.search()
                                          }}
                                        />
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="card-header clearfix" style={{ backgroundColor: '#fff' }}>
                            <h5 className="text-info pull-left">Info</h5>
                            <div className="clearfix" />
                          </div>
                          <div className="table-responsive">
                            <table className="table table-hover table-condensed" id="condensedTable">
                              <tbody>
                                <tr>
                                  <td className="v-align-middle semi-bold"  style={{ width: '30%' }}>Daemon Version</td>
                                  <td className="v-align-middle" style={{ width: '70%' }}>{client.agentMeta.daemonVersion}</td>
                                </tr>
                                <tr>
                                  <td className="v-align-middle semi-bold">WebApp Version</td>
                                  <td className="v-align-middle">{client.agentMeta.webAppVersion}</td>
                                </tr>
                                <tr>
                                  <td className="v-align-middle semi-bold">Daemon Webapp Deploy</td>
                                  <td className="v-align-middle">
                                    <input
                                      type="checkbox"
                                      value="1"
                                      defaultChecked={client.agentMeta.shouldDaemonDeploy ? 'checked' : ''}
                                      onClick={e => {
                                        if (e.target.checked) {
                                          // this.query.deletedAt = null;
                                        } else {
                                          // delete this.query.deletedAt
                                        }
                                        // this.search()
                                      }}
                                    />
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="m-t-20 m-l-20 m-r-20 container-fluid client-aws-table container-fixed-lg bg-white">
              <div className="card-header clearfix" style={{ backgroundColor: '#fff' }}>
                <h4 className="text-primary pull-left">AWS Data</h4>
                <div className="clearfix" />
              </div>
              <div className="card-block row p-b-20">
                <div className="col-md-6">
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
                <div className="col-md-6">
                  <div className="row">
                    <div className="col-md-12">
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
                                    <td className="v-align-middle">
                                      {key.AccessKeyId} | {key.SecretAccessKey}
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-12">
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
  return {
    userId: Meteor.userId()
  };
})(withRouter(ClientDetails));
