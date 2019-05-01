import React, { Fragment, Component } from 'react';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';

import './Enterprise.scss';
export default class Enterprise extends Component {
  state = {
    step: 0,
    selected_cloud: 'aws',
    cloud_providers: [
      { name: 'AWS', value: 'aws' },
      { name: 'GCP', value: 'gcp' },
      { name: 'AZURE', value: 'azure' },
      {
        name: 'other',
        value: 'other',
      },
    ],
  };
  componentDidMount = () => {};

  render() {
    return (
      <div className="content enterprise">
        <div className="m-t-20 container-fluid container-fixed-lg bg-white">
          <div className="row dashboard">
            <div className="col-lg-12">
              <div className="card card-transparent">
                <div className="card-header ">
                  <div className="card-title">Setup your own cloud</div>
                </div>
                <div className="card-block">
                  {this.state.step == 0 && (
                    <div className="row clearfix">
                      <div className="col-md-4">
                        <div className="form-group form-group-default ">
                          <label>Provider</label>
                          <select
                            className="form-control"
                            name="provider"
                            onChange={e => {
                              this.setState({ selected_cloud: e.target.value });
                            }}
                            selected={this.state.selected_cloud}
                          >
                            {this.state.cloud_providers.map(i => {
                              return (
                                <option value={i.value} key={i.value}>
                                  {i.name}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-4">
                        {this.state.selected_cloud && this.state.selected_cloud == 'aws' && (
                          <div className="card-block">
                            <label>
                              Click to deploy EKS cluster. <br />
                              *incase already have click next to proceed
                            </label>
                            <br />
                            <img
                              src="https://s3.amazonaws.com/cloudformation-examples/cloudformation-launch-stack.png"
                              onClick={() => {
                                open(
                                  'https://console.aws.amazon.com/cloudformation/home#/stacks/new?stackName=bc-eks&templateURL=https://s3.amazonaws.com/blockcluster-stacks/bc-eks-cloudformation.yml',
                                  '_blank'
                                );
                              }}
                            />
                          </div>
                        )}
                        {this.state.selected_cloud && this.state.selected_cloud == 'gcp' && (
                          <div className="card-block">
                            <label>
                              Click to deploy GKE cluster. <br />
                              *incase already have click next to proceed
                            </label>
                            <br />
                            click to deploy
                          </div>
                        )}
                        {this.state.selected_cloud && this.state.selected_cloud == 'azure' && (
                          <div className="card-block">
                            <label>
                              Click to deploy AKS cluster. <br />
                              *incase already have click next to proceed
                            </label>
                            <br />
                            Follow the below section to deploy and proceed
                          </div>
                        )}

                        {this.state.selected_cloud && this.state.selected_cloud == 'other' && <div className="card-block">contact us</div>}
                      </div>
                    </div>
                  )}
                  {this.state.step == 1 && (
                    <div className="row clearfix">
                      <div className="col-md-4">
                        <div className="card-block">
                          <label>please apply this RBAC to your k8s</label>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="row clearfix" style={{ textAlign: 'center' }}>
                    {this.state.selected_cloud && this.state.step == 0 && (
                      <LaddaButton
                        data-size={S}
                        data-style={SLIDE_UP}
                        data-spinner-size={30}
                        data-spinner-lines={12}
                        onClick={() => {
                          this.setState({ step: 1 });
                        }}
                        className="btn btn-success"
                        type="submit"
                      >
                        &nbsp;Next&nbsp;
                        <i className="fa fa-arrow-right" aria-hidden="true" />
                      </LaddaButton>
                    )}
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
