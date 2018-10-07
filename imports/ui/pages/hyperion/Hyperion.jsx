import React, { Component } from "react";
import LaddaButton, { S, SLIDE_UP } from "react-ladda";
import { withTracker } from "meteor/react-meteor-data";
import { withRouter } from "react-router-dom";
import notifications from "../../../modules/notifications";
import { Link } from "react-router-dom";
import Config from "../../../modules/config/client";
import { Files } from "../../../collections/files/files.js";
import { Hyperion } from "../../../collections/hyperion/hyperion.js";
import helpers from "../../../modules/helpers";
import FineUploaderTraditional from "fine-uploader-wrappers";
import Gallery from "react-fine-uploader";
import LocationSelector from "../../components/Selectors/LocationSelector.jsx";
import {
  ComposableMap,
  ZoomableGroup,
  Geographies,
  Geography,
  Markers,
  Marker,
} from "react-simple-maps"

// ...or load this specific CSS file using a <link> tag in your document
import "react-fine-uploader/gallery/gallery.css";
import "./Hyperion.scss";

const wrapperStyles = {
  width: "100%",
  maxWidth: 2500,
  marginTop: "20px",
}

class SimpleMarkers extends Component {
  render() {
    return (
      <div style={wrapperStyles}>
        <ComposableMap
            projectionConfig={{
              scale: 205,
              rotation: [-11,0,0],
            }}
            width={980}
            height={551}
            style={{
              width: "100%",
              height: "auto",
            }}
          >
          <ZoomableGroup enter={[0,20]} disablePanning>
              <Geographies geography="/assets/json/world-50m.json">
                {(geographies, projection) => geographies.map((geography, i) => geography.id !== "ATA" && (
                  <Geography
                    key={i}
                    geography={geography}
                    projection={projection}
                    style={{
                      default: {
                        fill: "#ECEFF1",
                        stroke: "#607D8B",
                        strokeWidth: 0.75,
                        outline: "none",
                      },
                      hover: {
                        fill: "#607D8B",
                        stroke: "#607D8B",
                        strokeWidth: 0.75,
                        outline: "none",
                      },
                      pressed: {
                        fill: "#FF5722",
                        stroke: "#607D8B",
                        strokeWidth: 0.75,
                        outline: "none",
                      },
                    }}
                  />
                ))}
              </Geographies>
            <Markers>
              {this.props.markers.map((marker, i) => (
                  <Marker
                    key={i}
                    marker={marker}
                    style={{
                      default: { fill: "#FF5722" },
                      hover: { fill: "#FF5722" },
                      pressed: { fill: "#FF5722" },
                    }}
                    >
                    <circle
                      cx={0}
                      cy={0}
                      r={10}
                      style={{
                        stroke: "#FF5722",
                        strokeWidth: 3
                      }}
                    />
                  <text
                    textAnchor="middle"
                    y={marker.markerOffset}
                    style={{
                      fontFamily: "Roboto, sans-serif",
                      fill: "white",
                    }}
                    >
                    {marker.name}
                  </text>
                </Marker>
              ))}
            </Markers>
          </ZoomableGroup>
        </ComposableMap>
      </div>
    )
  }
}

class HyperionComponent extends Component {
  constructor() {
    super();

    this.state = {
      updateRPCFormSubmitError: "",
      updateRESTFormSubmitError: "",
      updateRPCFormSubmitSuccess: "",
      updateRESTFormSubmitSuccess: "",
      rpcLoading: false,
      restLoading: false,
      locationCode: "us-west-2",
      markers: []
    };

    this.downloadFile = this.downloadFile.bind(this);
    this.searchFile = this.searchFile.bind(this);

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
            Meteor.call(
              "getHyperionToken",
              { userId: Meteor.userId() },
              (err, token) => {
                if (!err) {
                  this.token = token;
                  this.uploader.methods._endpointStore.set(
                    `${window.location.origin}/api/hyperion/upload?location=${
                      this.locationCode
                    }&token=${this.token}`,
                    id
                  );
                }
              }
            );
          }
        }
      }
    });
  }

  componentDidMount() {
    Meteor.call("getClusterLocations", (err, res) => {
      let ips = []
      res.forEach(item => {
        ips.push(item.workerNodeIP);
      })

      Meteor.call("convertIP_Location", ips, (error, result) => {
        if (!error && result) {
          let markers = [];
          result.forEach(location => {
            markers.push({
              markerOffset: 4,
              coordinates: location.ll.reverse()
            });
          });

          this.setState({
            markers: markers
          });
        }
      });
    });
  }

  componentWillUnmount() {
    this.props.subscriptions.forEach(s => {
      s.stop();
    });
  }

  downloadFile = (e, item) => {
    e.preventDefault();

    Meteor.call("getHyperionToken", item, (err, token) => {
      if (!err) {
        window.open(
          `${window.location.origin}/api/hyperion/download?location=${
            item.region
          }&hash=${item.hash}&token=${token}`,
          "_blank"
        );
        notifications.success("File download started");
      } else {
        notifications.error("An error occured");
      }
    });
  };

  searchFile = (e) => {
    e.preventDefault();

    Meteor.call("getHyperionToken", {userId: Meteor.userId()}, (err, token) => {
      if (!err) {
        window.open(
          `${window.location.origin}/api/hyperion/download?location=${
            this.locationCode
          }&hash=${this.refs.searchBox.value}&token=${token}`,
          "_blank"
        );
        notifications.success("File download started");
      } else {
        notifications.error("An error occured");
      }
    });
  }

  deleteFile = (e, item) => {
    e.preventDefault();

    Meteor.call("getHyperionToken", item, (err, token) => {
      if (!err) {
        HTTP.call(
          "DELETE",
          `${window.location.origin}/api/hyperion/delete?location=${
            item.region
          }&hash=${item.hash}&token=${token}`,
          {},
          (error, result) => {
            if (!error) {
              notifications.success("File deleted successfully");
            } else {
              notifications.error("An error occured");
            }
          }
        );
      } else {
        notifications.error("An error occured");
      }
    });
  };

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
                <li className="nav-item">
                  <a href="#" data-toggle="tab" role="tab" data-target="#search">
                    Search
                  </a>
                </li>
              </ul>
              <div className="tab-content">
                <div className="tab-pane active" id="upload">
                  <div className="row">
                    <div className="col-lg-12">
                      <div className="card card-transparent">
                        <div
                          className="card-block"
                          style={{ paddingBottom: "0px" }}
                        >
                          <div className="form-group-attached">
                            <form role="form">
                              <LocationSelector
                                locationChangeListener={locationCode =>
                                  (this.locationCode = locationCode)
                                }
                              />
                              <br />
                              <Gallery uploader={this.uploader} />
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
                                    <tr key={item._id}>
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
                                        {helpers.timeConverter(
                                          item.uploaded / 1000
                                        )}
                                      </td>
                                      <td className="v-align-middle">
                                        <i
                                          className="fa fa-download download"
                                          onClick={e =>
                                            this.downloadFile(e, item)
                                          }
                                        />
                                        &nbsp;&nbsp;&nbsp;
                                        <i
                                          className="fa fa-trash delete"
                                          onClick={e =>
                                            this.deleteFile(e, item)
                                          }
                                        />
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
                    <div className="col-lg-12">
                      <div className="card card-transparent">
                        <div className="card-block">
                          <div className="row">
                            <div className="col-lg-3">
                              <div className="widget-9 card no-border bg-success no-margin widget-loader-bar">
                                <div className="full-height d-flex flex-column">
                                  <div className="card-header ">
                                    <div className="card-title text-black">
                                      <span className="font-montserrat fs-11 all-caps text-white">
                                        Disk Space Consumed{" "}
                                        <i className="fa fa-chevron-right" />
                                      </span>
                                    </div>
                                    <div className="card-controls">
                                      <ul>
                                        <li>
                                          <a
                                            href="#"
                                            className="card-refresh "
                                            style={{ color: "white" }}
                                            data-toggle="refresh"
                                          >
                                            <i className="fa fa-cloud text-white" />
                                          </a>
                                        </li>
                                      </ul>
                                    </div>
                                  </div>
                                  <div className="p-l-20">
                                    <h3 className="no-margin p-b-30 text-white ">
                                      {this.props.hyperion.length === 1 &&
                                        <span>{helpers.bytesToSize(this.props.hyperion[0].size)}</span>
                                      }

                                      {this.props.hyperion.length === 0 &&
                                        <span>0</span>
                                      }
                                    </h3>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="col-lg-3">
                              <div className="widget-9 card no-border bg-primary no-margin widget-loader-bar">
                                <div className="full-height d-flex flex-column">
                                  <div className="card-header ">
                                    <div className="card-title text-black">
                                      <span className="font-montserrat fs-11 all-caps text-white">
                                        Cost Per GB{" "}
                                        <i className="fa fa-chevron-right" />
                                      </span>
                                    </div>
                                    <div className="card-controls">
                                      <ul>
                                        <li>
                                          <a
                                            href="#"
                                            className="card-refresh "
                                            style={{ color: "white" }}
                                            data-toggle="refresh"
                                          >
                                            <i className="fa fa-archive text-white" />
                                          </a>
                                        </li>
                                      </ul>
                                    </div>
                                  </div>
                                  <div className="p-l-20">
                                    <h3 className="no-margin p-b-30 text-white ">
                                      <span>${helpers.hyperionGBCostPerMonth()}</span>
                                    </h3>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="col-lg-3">
                              <div className="widget-9 card no-border bg-warning no-margin widget-loader-bar">
                                <div className="full-height d-flex flex-column">
                                  <div className="card-header ">
                                    <div className="card-title text-black">
                                      <span className="font-montserrat fs-11 all-caps text-white">
                                        Monthly Cost{" "}
                                        <i className="fa fa-chevron-right" />
                                      </span>
                                    </div>
                                    <div className="card-controls">
                                      <ul>
                                        <li>
                                          <a
                                            href="#"
                                            className="card-refresh "
                                            style={{ color: "white" }}
                                            data-toggle="refresh"
                                          >
                                            <i className="fa fa-calendar text-white" />
                                          </a>
                                        </li>
                                      </ul>
                                    </div>
                                  </div>
                                  <div className="p-l-20">
                                    <h3 className="no-margin p-b-30 text-white ">
                                      {this.props.hyperion.length === 1 &&
                                        <span>${((((this.props.hyperion[0].size / 1024) / 1024) / 1024) * (helpers.hyperionGBCostPerDay() * helpers.daysInThisMonth())).toPrecision(2)}</span>
                                      }

                                      {this.props.hyperion.length === 0 &&
                                        <span>$0</span>
                                      }
                                    </h3>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="col-lg-3">
                              <div className="widget-9 card no-border bg-complete no-margin widget-loader-bar">
                                <div className="full-height d-flex flex-column">
                                  <div className="card-header ">
                                    <div className="card-title text-black">
                                      <span className="font-montserrat fs-11 all-caps text-white">
                                        This Month Invoice{" "}
                                        <i className="fa fa-chevron-right" />
                                      </span>
                                    </div>
                                    <div className="card-controls">
                                      <ul>
                                        <li>
                                          <a
                                            href="#"
                                            className="card-refresh "
                                            style={{ color: "white" }}
                                            data-toggle="refresh"
                                          >
                                            <i className="fa fa-file-o text-white" />
                                          </a>
                                        </li>
                                      </ul>
                                    </div>
                                  </div>
                                  <div className="p-l-20">
                                    <h3 className="no-margin p-b-30 text-white ">
                                      {this.props.hyperion.length === 1 &&
                                        <span>${((((((this.props.hyperion[0].size / 1024) / 1024) / 1024) * (helpers.hyperionGBCostPerDay() * helpers.daysInThisMonth())).toPrecision(2)) - this.props.hyperion[0].discount).toPrecision(2)}</span>
                                      }

                                      {this.props.hyperion.length === 0 &&
                                        <span>$0</span>
                                      }
                                    </h3>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="col-lg-12">
                              <SimpleMarkers markers={this.state.markers} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="tab-pane" id="search">
                  <div className="row">
                    <div className="col-lg-12">
                      <div className="card card-transparent m-b-0">
                        <div className="card-block">
                          <div className="form-group-attached">
                            <form role="form" onSubmit={e =>
                                this.searchFile(e)
                              }>
                              <LocationSelector
                                locationChangeListener={locationCode =>
                                  (this.locationCode = locationCode)
                                }
                              />
                              <div className="form-group form-group-default m-t-10">
                                <label>Enter File Hash</label>
                                <input type="text" placeholder="QmcoEsT1y1jJjGKv5jXLtVrkyuV9mz2hukPic5UnjS4JEw" className="form-control" ref="searchBox" style={{height: "calc(2.25rem + 2px)"}} />
                              </div>
                              <button className="btn btn-complete btn-cons m-t-10"><i className="fa fa-search" /> Search</button>
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
      </div>
    );
  }
}

export default withTracker(props => {
  return {
    files: Files.find({}).fetch(),
    hyperion: Hyperion.find({}).fetch(),
    workerNodeIP: Config.workerNodeIP,
    workerNodeDomainName: Config.workerNodeDomainName,
    subscriptions: [
      Meteor.subscribe("files"), Meteor.subscribe("hyperion")
    ]
  };
})(withRouter(HyperionComponent));
