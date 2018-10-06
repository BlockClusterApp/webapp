import React, { Component } from "react";
import LaddaButton, { S, SLIDE_UP } from "react-ladda";
import { withTracker } from "meteor/react-meteor-data";
import { withRouter } from "react-router-dom";
import notifications from "../../../modules/notifications";
import { Link } from "react-router-dom";
import Config from "../../../modules/config/client";
import {Files} from "../../../collections/files/files.js"
import helpers from "../../../modules/helpers"
import FineUploaderTraditional from 'fine-uploader-wrappers'
import Gallery from 'react-fine-uploader'
import LocationSelector from '../../components/Selectors/LocationSelector.jsx';

// ...or load this specific CSS file using a <link> tag in your document
import 'react-fine-uploader/gallery/gallery.css'
import "./Hyperion.scss";

class Hyperion extends Component {
  constructor() {
    super();

    this.state = {
      updateRPCFormSubmitError: "",
      updateRESTFormSubmitError: "",
      updateRPCFormSubmitSuccess: "",
      updateRESTFormSubmitSuccess: "",
      rpcLoading: false,
      restLoading: false,
      locationCode: "us-west-2"
    };

    this.downloadFile = this.downloadFile.bind(this)

    this.uploader = new FineUploaderTraditional({
      options: {
        chunking: {
          enabled: false
        },
        request: {
          endpoint: ``,
          inputName: "file"
        },
        retry: {
          enableAuto: true,
          autoAttemptDelay: 1,
          maxAutoAttempts: 1
        },
        callbacks: {
          onSubmit: (id, fileName) => {
            Meteor.call("getHyperionToken", {userId: Meteor.userId()}, (err, token) => {
              if(!err) {
                this.token = token;
                this.uploader.methods._endpointStore.set(`${window.location.origin}/api/hyperion/upload?location=${this.locationCode}&token=${this.token}`, id);
              }
            })
          }
        }
      }
    })
  }

  componentWillUnmount() {
    this.props.subscriptions.forEach(s => {
      s.stop();
    });
  }

  downloadFile = (e, item) => {
    e.preventDefault();

    Meteor.call("getHyperionToken", item, (err, token) => {
      if(!err) {
        window.open(`${window.location.origin}/api/hyperion/download?location=${item.region}&hash=${item.hash}&token=${token}`, '_blank');
        notifications.success("File download started")
      } else {
        notifications.error("An error occured")
      }
    })
  }

  deleteFile = (e, item) => {
    e.preventDefault();

    Meteor.call("getHyperionToken", item, (err, token) => {
      if(!err) {
        HTTP.call('DELETE', `${window.location.origin}/api/hyperion/delete?location=${item.region}&hash=${item.hash}&token=${token}`, {}, (error, result) => {
          if (!error) {
            notifications.success("File deleted successfully")
          } else {
            notifications.error("An error occured")
          }
        });
      } else {
        notifications.error("An error occured")
      }
    })
  }

  render() {
    return (
      <div className="content hyperion">
        <div className="m-t-20 container-fluid container-fixed-lg">
          <div className="row">
            <div className="card card-borderless card-transparent">
              <ul
                className="nav nav-tabs nav-tabs-linetriangle"
                role="tablist"
                data-init-reponsive-tabs="dropdownfx"
              >
              <li className="nav-item">
                <a
                  className="active"
                  href="#"
                  data-toggle="tab"
                  role="tab"
                  data-target="#upload"
                >
                  Upload
                </a>
              </li>
                <li className="nav-item">
                  <a
                    className=""
                    href="#"
                    data-toggle="tab"
                    role="tab"
                    data-target="#files"
                  >
                    Files
                  </a>
                </li>
                <li className="nav-item">
                  <a href="#" data-toggle="tab" role="tab" data-target="#stats">
                    Stats & Billing
                  </a>
                </li>
              </ul>
              <div className="tab-content">
                <div className="tab-pane active" id="upload">
                  <div className="row">
                    <div className="col-lg-12">
                      <div className="card card-transparent">
                        <div className="card-block" style={{paddingBottom: '0px'}}>
                          <div className="form-group-attached">
                            <form role="form">
                              <LocationSelector locationChangeListener={locationCode => (this.locationCode = locationCode)} />
                              <br />
                              <Gallery uploader={ this.uploader } />
                            </form>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="tab-pane" id="files">
                  <div className="row">
                    <div className="col-lg-12">
                      <div className="card card-transparent">
                        <div className="card-block">
                          <div className="table-responsive">
                            <table
                              className="table table-hover"
                              id="basicTable"
                            >
                              <thead>
                                <tr>
                                  <th style={{ width: "15%" }}>File Name</th>
                                  <th style={{ width: "15%" }}>Hash</th>
                                  <th style={{ width: "18%" }}>Size</th>
                                  <th style={{ width: "17%" }}>Region</th>
                                  <th style={{ width: "15%" }}>Uploaded on</th>
                                  <th style={{ width: "20%" }}>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {this.props.files.map((item, index) => {
                                  return (
                                    <tr
                                      key={item._id}
                                    >
                                      <td className="v-align-middle ">
                                        {item.fileName}
                                      </td>
                                      <td className="v-align-middle">
                                        {item.hash}
                                      </td>
                                      <td className="v-align-middle">
                                        {helpers.bytesToSize(item.size)}
                                      </td>
                                      <td className="v-align-middle">
                                        {item.region}
                                      </td>
                                      <td className="v-align-middle">
                                        {helpers.timeConverter(item.uploaded / 1000)}
                                      </td>
                                      <td className="v-align-middle">
                                        <i className="fa fa-download download" onClick={(e) => this.downloadFile(e, item)}></i>
                                        &nbsp;&nbsp;&nbsp;
                                        <i className="fa fa-trash delete" onClick={(e) => this.deleteFile(e, item)}></i>
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
                <div className="tab-pane" id="stats">
                  <div className="row">
                    <div className="col-lg-5">
                      <div className="card card-transparent">
                        <div className="card-header ">
                          <div className="card-title">
                            <h5>Update Password of APIs</h5>
                          </div>
                        </div>
                        <div className="card-block" />
                      </div>
                    </div>
                    <div className="col-lg-7">
                      <div className="card card-transparent">
                        <div className="card-block">
                          <form
                            id="form-project"
                            role="form"
                            onSubmit={this.onRPCUpdateSubmit}
                            autoComplete="off"
                          >
                            <p>Set new password</p>
                            <div className="form-group-attached">
                              <div className="row clearfix">
                                <div className="col-md-12">
                                  <div className="form-group form-group-default required">
                                    <label>Username</label>
                                    <input
                                      type="text"
                                      className="form-control readOnly-Value"
                                      readOnly
                                    />
                                  </div>
                                </div>
                              </div>
                              <div className="row clearfix">
                                <div className="col-md-12">
                                  <div className="form-group form-group-default required">
                                    <label>Password</label>
                                    <input
                                      ref={input => {
                                        this.rpcPassword = input;
                                      }}
                                      type="password"
                                      className="form-control"
                                      name="password"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                            <br />
                            {this.state.updateRPCFormSubmitError != "" && (
                              <div className="row">
                                <div className="col-md-12">
                                  <div
                                    className="m-b-20 alert alert-danger m-b-0"
                                    role="alert"
                                  >
                                    <button
                                      className="close"
                                      data-dismiss="alert"
                                    />
                                    {this.state.updateRPCFormSubmitError}
                                  </div>
                                </div>
                              </div>
                            )}

                            {this.state.updateRPCFormSubmitSuccess != "" && (
                              <div className="row">
                                <div className="col-md-12">
                                  <div
                                    className="m-b-20 alert alert-success m-b-0"
                                    role="alert"
                                  >
                                    <button
                                      className="close"
                                      data-dismiss="alert"
                                    />
                                    {this.state.updateRPCFormSubmitSuccess}
                                  </div>
                                </div>
                              </div>
                            )}

                            <LaddaButton
                              loading={this.state.rpcLoading}
                              data-size={S}
                              data-style={SLIDE_UP}
                              data-spinner-size={30}
                              data-spinner-lines={12}
                              className="btn btn-success"
                              type="submit"
                            >
                              <i className="fa fa-wrench" aria-hidden="true" />
                              &nbsp;&nbsp;Update
                            </LaddaButton>
                          </form>
                        </div>
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
    files: Files.find({}).fetch(),
    workerNodeIP: Config.workerNodeIP,
    workerNodeDomainName: Config.workerNodeDomainName,
    subscriptions: [
      Meteor.subscribe("files", {
        onReady: function() {}
      })
    ]
  };
})(withRouter(Hyperion));
