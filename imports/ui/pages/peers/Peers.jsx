import React, { Component } from "react";
import { withTracker } from "meteor/react-meteor-data";
import { Networks } from "../../../collections/networks/networks.js";
import helpers from "../../../modules/helpers";
import { withRouter } from "react-router-dom";
import LaddaButton, { S, SLIDE_UP } from "react-ladda";
import notifications from "../../../modules/notifications";
import { Link } from "react-router-dom";
import Config from "../../../modules/config/client";
import {
  ComposableMap,
  ZoomableGroup,
  Geographies,
  Geography,
  Markers,
  Marker
} from "react-simple-maps";

import "./Peers.scss";

const wrapperStyles = {
  width: "100%",
  maxWidth: 2500,
  margin: "0 auto"
};

class SimpleMarkers extends Component {
  render() {
    return (
      <div style={wrapperStyles}>
        <ComposableMap
          projectionConfig={{
            scale: 205,
            rotation: [-11, 0, 0]
          }}
          width={980}
          height={551}
          style={{
            width: "100%",
            height: "auto"
          }}
        >
          <ZoomableGroup enter={[0, 20]} disablePanning>
            <Geographies geography="/assets/json/world-50m.json">
              {(geographies, projection) =>
                geographies.map(
                  (geography, i) =>
                    geography.id !== "ATA" && (
                      <Geography
                        key={i}
                        geography={geography}
                        projection={projection}
                        style={{
                          default: {
                            fill: "#ECEFF1",
                            stroke: "#607D8B",
                            strokeWidth: 0.75,
                            outline: "none"
                          },
                          hover: {
                            fill: "#607D8B",
                            stroke: "#607D8B",
                            strokeWidth: 0.75,
                            outline: "none"
                          },
                          pressed: {
                            fill: "#FF5722",
                            stroke: "#607D8B",
                            strokeWidth: 0.75,
                            outline: "none"
                          }
                        }}
                      />
                    )
                )
              }
            </Geographies>
            <Markers>
              {this.props.markers.map((marker, i) => (
                <Marker
                  key={i}
                  marker={marker}
                  style={{
                    default: { fill: "#FF5722" },
                    hover: { fill: "#FF5722" },
                    pressed: { fill: "#FF5722" }
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
                      fill: "white"
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
    );
  }
}

class Peers extends Component {
  constructor() {
    super();
    this.state = {
      defaultJSONQuery: JSON.stringify(
        JSON.parse(
          '{"assetName":"license","uniqueIdentifier":"1234","company":"blockcluster"}'
        ),
        undefined,
        4
      ),
      connectedPeers: [],
      staticPeers: [],
      whitelistedNodes: [],
      markers: [],
      locations: []
    };

    this.locationConfig = {};

    this.refreshConnectedPeers = this.refreshConnectedPeers.bind(this);
  }

  componentDidMount() {
    Meteor.call("getClusterLocations", (err, res) => {
      this.setState({
        locations: res
      });
    });

    this.setState({
      connectedPeersTimer: setTimeout(this.refreshConnectedPeers, 500)
    });
  }

  componentWillUnmount() {
    this.props.subscriptions.forEach(s => {
      s.stop();
    });

    clearTimeout(this.state.connectedPeersTimer);
  }

  getLocationName = locationCode => {
    const locationConfig = this.state.locations.find(
      a => a.locationCode === locationCode
    );
    if (!locationConfig) {
      return undefined;
    }
    return locationConfig.locationName;
  };

  refreshConnectedPeers() {
    let rpc = null;
    let status = null;
    let username = null;
    let password = null;

    if (this.props.network.length === 1) {
      username = this.props.network[0].instanceId;
      password = this.props.network[0]["api-password"];
      status = this.props.network[0].status;
    }

    if (status == "running") {
      let url = `https://${Config.workerNodeDomainName(
        this.props.network[0].locationCode
      )}/api/node/${this.props.network[0].instanceId}/utility/nodeInfo`;
      HTTP.get(
        url,
        {
          headers: {
            Authorization:
              "Basic " +
              new Buffer(`${username}:${password}`).toString("base64")
          }
        },
        (err, res) => {
          if (!err) {
            this.setState(
              {
                connectedPeers: res.data.connectedPeers
                  ? res.data.connectedPeers
                  : [],
                staticPeers: res.data.staticPeers ? res.data.staticPeers : [],
                whitelistedNodes: res.data.whitelistedNodes
                  ? res.data.whitelistedNodes
                  : []
              },
              () => {
                let staticPeers = res.data.staticPeers || [];
                let ips = [];
                /*if(this.locationConfig.workerNodeIP) {
                            ips.push(this.locationConfig.workerNodeIP)
                        }*/
                staticPeers.forEach((url, index) => {
                  ips.push(url.split("@")[1].split(":")[0]);
                });

                Meteor.call("convertIP_Location", ips, (error, result) => {
                  if (!error && result) {
                    let markers = [];
                    result.forEach(location => {
                      markers.push({
                        markerOffset: 4,
                        coordinates: location.ll.reverse(),
                        name: result.reduce((n, obj) => {
                          return n + (obj.ip == location.ip);
                        }, 0)
                      });
                    });

                    this.setState({
                      connectedPeersTimer: setTimeout(
                        this.refreshConnectedPeers,
                        500
                      ),
                      markers: markers
                    });
                  } else {
                    this.setState({
                      connectedPeersTimer: setTimeout(
                        this.refreshConnectedPeers,
                        500
                      )
                    });
                  }
                });
              }
            );
          } else {
            this.setState({
              connectedPeersTimer: setTimeout(this.refreshConnectedPeers, 500)
            });
          }
        }
      );
    } else {
      this.setState({
        connectedPeersTimer: setTimeout(this.refreshConnectedPeers, 500)
      });
    }
  }

  addPeer(e, instanceId) {
    e.preventDefault();

    this.setState({
      [instanceId + "_enodeURL_formSubmitError"]: "",
      [instanceId + "_addPeer_formloading"]: true,
      [instanceId + "_enodeURL_formSubmitSuccess"]: ""
    });

    Meteor.call(
      "addPeer",
      instanceId,
      this[instanceId + "_enodeURL"].value,
      error => {
        if (error) {
          this.setState({
            [instanceId + "_enodeURL_formSubmitError"]: error.reason,
            [instanceId + "_enodeURL_formSubmitSuccess"]: "",
            [instanceId + "_addPeer_formloading"]: false
          });
        } else {
          this.setState({
            [instanceId + "_enodeURL_formSubmitError"]: "",
            [instanceId +
            "_enodeURL_formSubmitSuccess"]: "Successfully added ENode URL to static peers list",
            [instanceId + "_addPeer_formloading"]: false
          });
        }
      }
    );
  }

  removePeer(e, instanceId, url) {
    e.preventDefault();

    Meteor.call("removePeer", instanceId, url, error => {
      if (error) {
        notifications.error("Unknown Error Occured");
      } else {
        notifications.success("Removed Successfully");
      }
    });
  }

  blacklistPeer(e, instanceId, url) {
    e.preventDefault();

    Meteor.call("blacklistPeer", instanceId, url, error => {
      if (error) {
        notifications.error("Unknown Error Occured");
      } else {
        notifications.success("Blacklisted Successfully");
      }
    });
  }

  whitelistPeer(e, instanceId) {
    e.preventDefault();

    this.setState({
      [instanceId + "_enodeURL_formSubmitError"]: "",
      [instanceId + "_whitelist_formloading"]: true,
      [instanceId + "_enodeURL_formSubmitSuccess"]: ""
    });

    Meteor.call(
      "whitelistPeer",
      instanceId,
      this[instanceId + "_enodeURL"].value,
      error => {
        if (error) {
          this.setState({
            [instanceId + "_enodeURL_formSubmitError"]: error.reason,
            [instanceId + "_enodeURL_formSubmitSuccess"]: "",
            [instanceId + "_whitelist_formloading"]: false
          });
        } else {
          this.setState({
            [instanceId + "_enodeURL_formSubmitError"]: "",
            [instanceId +
            "_enodeURL_formSubmitSuccess"]: "Successfully added ENode URL to static peers list",
            [instanceId + "_whitelist_formloading"]: false
          });
        }
      }
    );
  }

  render() {
    if (this.props.network[0]) {
      this.locationConfig = this.state.locations.find(
        i => i && i.locationCode === this.props.network[0].locationCode
      );
      if (!this.locationConfig) {
        this.locationConfig = {};
      }
    }

    return (
      <div className="peers content">
        <div className="m-t-20 container-fluid container-fixed-lg bg-white">
          <div className="row dashboard">
            <div className="col-lg-12">
              <div className="card card-transparent">
                <div className="card-header ">
                  <div className="card-title">
                    <Link to={"/app/networks/" + this.props.match.params.id}>
                      {" "}
                      Control Panel <i className="fa fa-angle-right" />
                    </Link>{" "}
                    Peers Management
                  </div>
                </div>
                <div className="card-block" style={{ paddingBottom: "0px" }}>
                  <div className="row">
                    <div className="col-xl-12">
                      <div className="card card-transparent">
                        <div>
                          {this.props.network.length === 1 && (
                            <div>
                              <ul
                                className="nav nav-tabs nav-tabs-fillup"
                                data-init-reponsive-tabs="dropdownfx"
                              >
                                <li className="nav-item">
                                  <a
                                    href="#"
                                    className="active"
                                    data-toggle="tab"
                                    data-target={
                                      "#" +
                                      this.props.network[0].instanceId +
                                      "_slide1"
                                    }
                                  >
                                    <span>Add or Whitelist peers</span>
                                  </a>
                                </li>
                                <li className="nav-item">
                                  <a
                                    href="#"
                                    data-toggle="tab"
                                    data-target={
                                      "#" +
                                      this.props.network[0].instanceId +
                                      "_slide2"
                                    }
                                  >
                                    <span>Connected Peers</span>
                                  </a>
                                </li>
                                <li className="nav-item">
                                  <a
                                    href="#"
                                    data-toggle="tab"
                                    data-target={
                                      "#" +
                                      this.props.network[0].instanceId +
                                      "_slide3"
                                    }
                                  >
                                    <span>Static Peers</span>
                                  </a>
                                </li>
                                <li className="nav-item">
                                  <a
                                    href="#"
                                    data-toggle="tab"
                                    data-target={
                                      "#" +
                                      this.props.network[0].instanceId +
                                      "_slide4"
                                    }
                                  >
                                    <span>Whitelisted Peers</span>
                                  </a>
                                </li>
                              </ul>
                              <div className="tab-content p-l-0 p-r-0">
                                <div
                                  className="tab-pane slide-left active"
                                  id={
                                    this.props.network[0].instanceId + "_slide1"
                                  }
                                >
                                  <div className="row column-seperation">
                                    <div className="col-lg-12">
                                      <form role="form">
                                        <div className="form-group">
                                          <label>ENode URL</label>
                                          <input
                                            type="text"
                                            className="form-control"
                                            ref={input => {
                                              this[
                                                this.props.network[0]
                                                  .instanceId + "_enodeURL"
                                              ] = input;
                                            }}
                                            required
                                          />
                                        </div>
                                        {this.state[
                                          this.props.network[0].instanceId +
                                            "_enodeURL_formSubmitError"
                                        ] && (
                                          <div className="row m-t-15">
                                            <div className="col-md-12">
                                              <div
                                                className="m-b-20 alert alert-danger m-b-0"
                                                role="alert"
                                              >
                                                <button
                                                  className="close"
                                                  data-dismiss="alert"
                                                />
                                                {
                                                  this.state[
                                                    this.props.network[0]
                                                      .instanceId +
                                                      "_enodeURL_formSubmitError"
                                                  ]
                                                }
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                        {this.state[
                                          this.props.network[0].instanceId +
                                            "_enodeURL_formSubmitSuccess"
                                        ] && (
                                          <div className="row m-t-15">
                                            <div className="col-md-12">
                                              <div
                                                className="m-b-20 alert alert-success m-b-0"
                                                role="alert"
                                              >
                                                <button
                                                  className="close"
                                                  data-dismiss="alert"
                                                />
                                                {
                                                  this.state[
                                                    this.props.network[0]
                                                      .instanceId +
                                                      "_enodeURL_formSubmitSuccess"
                                                  ]
                                                }
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                        <p className="pull-left">
                                          <LaddaButton
                                            loading={
                                              this.state[
                                                this.props.network[0]
                                                  .instanceId +
                                                  "_addPeer_formloading"
                                              ]
                                            }
                                            data-size={S}
                                            data-style={SLIDE_UP}
                                            data-spinner-size={30}
                                            data-spinner-lines={12}
                                            className="btn btn-success"
                                            type="submit"
                                            onClick={e => {
                                              this.addPeer(
                                                e,
                                                this.props.network[0].instanceId
                                              );
                                            }}
                                          >
                                            <i
                                              className="fa fa-plus"
                                              aria-hidden="true"
                                            />
                                            &nbsp;&nbsp;Add Static Peer
                                          </LaddaButton>
                                          &nbsp;
                                          <LaddaButton
                                            loading={
                                              this.state[
                                                this.props.network[0]
                                                  .instanceId +
                                                  "_whitelist_formloading"
                                              ]
                                            }
                                            data-size={S}
                                            data-style={SLIDE_UP}
                                            data-spinner-size={30}
                                            data-spinner-lines={12}
                                            className="btn btn-default"
                                            data-spinner-color="black"
                                            type="submit"
                                            onClick={e => {
                                              this.whitelistPeer(
                                                e,
                                                this.props.network[0].instanceId
                                              );
                                            }}
                                          >
                                            <i
                                              className="fa fa-check"
                                              aria-hidden="true"
                                            />
                                            &nbsp;&nbsp;Whitelist
                                          </LaddaButton>
                                        </p>
                                      </form>
                                    </div>
                                  </div>
                                </div>
                                <div
                                  className="tab-pane slide-left"
                                  id={
                                    this.props.network[0].instanceId + "_slide2"
                                  }
                                >
                                  <div className="row">
                                    <div className="col-lg-12">
                                      <div className="table-responsive">
                                        <table
                                          className="table table-hover"
                                          id="basicTable"
                                        >
                                          <thead>
                                            <tr>
                                              <th style={{ width: "25%" }}>
                                                IP and Port
                                              </th>
                                              <th style={{ width: "40%" }}>
                                                ENode ID
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {this.state.connectedPeers.map(
                                              (item, index) => {
                                                return (
                                                  <tr key={item.id}>
                                                    <td className="v-align-middle">
                                                      {
                                                        item.network
                                                          .remoteAddress
                                                      }
                                                    </td>
                                                    <td className="v-align-middle ">
                                                      {item.id}
                                                    </td>
                                                  </tr>
                                                );
                                              }
                                            )}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div
                                  className="tab-pane slide-left"
                                  id={
                                    this.props.network[0].instanceId + "_slide3"
                                  }
                                >
                                  <div className="row">
                                    <div className="col-lg-12">
                                      <h4>Static Peers</h4>
                                      <div className="table-responsive">
                                        <table
                                          className="table table-hover"
                                          id="basicTable"
                                        >
                                          <thead>
                                            <tr>
                                              <th style={{ width: "50%" }} />
                                              <th style={{ width: "50%" }}>
                                                Peer URI
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {this.state.staticPeers.map(
                                              (item, index) => {
                                                return (
                                                  <tr key={item}>
                                                    <td className="v-align-middle ">
                                                      <i
                                                        className="fa fa-trash"
                                                        onClick={e => {
                                                          this.removePeer(
                                                            e,
                                                            this.props
                                                              .network[0]
                                                              .instanceId,
                                                            item
                                                          );
                                                        }}
                                                      />
                                                    </td>
                                                    <td className="v-align-middle">
                                                      {item}
                                                    </td>
                                                  </tr>
                                                );
                                              }
                                            )}
                                          </tbody>
                                        </table>
                                      </div>
                                      <br />
                                      <SimpleMarkers
                                        markers={this.state.markers}
                                      />
                                    </div>
                                  </div>
                                </div>
                                <div
                                  className="tab-pane slide-left"
                                  id={
                                    this.props.network[0].instanceId + "_slide4"
                                  }
                                >
                                  <div className="row">
                                    <div className="col-lg-12">
                                      <h4>Whitelisted Peers</h4>
                                      <div className="table-responsive">
                                        <table
                                          className="table table-hover"
                                          id="basicTable"
                                        >
                                          <thead>
                                            <tr>
                                              <th style={{ width: "50%" }} />
                                              <th style={{ width: "50%" }}>
                                                Peer URI
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {this.state.whitelistedNodes.map(
                                              (item, index) => {
                                                return (
                                                  <tr key={item}>
                                                    <td
                                                      className="v-align-middle "
                                                      onClick={e => {
                                                        this.blacklistPeer(
                                                          e,
                                                          this.props.network[0]
                                                            .instanceId,
                                                          item
                                                        );
                                                      }}
                                                    >
                                                      <i className="fa fa-ban" />
                                                    </td>
                                                    <td className="v-align-middle">
                                                      {item}
                                                    </td>
                                                  </tr>
                                                );
                                              }
                                            )}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
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
      </div>
    );
  }
}

export default withTracker(props => {
  return {
    network: Networks.find({
      instanceId: props.match.params.id,
      active: true
    }).fetch(),
    subscriptions: [
      Meteor.subscribe("networks", {
        onReady: function() {
          if (
            Networks.find({
              instanceId: props.match.params.id,
              active: true
            }).fetch().length !== 1
          ) {
            props.history.push("/app/networks");
          }
        }
      })
    ]
  };
})(withRouter(Peers));
