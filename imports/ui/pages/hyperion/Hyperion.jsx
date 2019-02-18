import React, { Component } from 'react';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter } from 'react-router-dom';
import notifications from '../../../modules/notifications';
import { Link } from 'react-router-dom';
import Config from '../../../modules/config/client';
import { Files } from '../../../collections/files/files.js';
import { Hyperion } from '../../../collections/hyperion/hyperion.js';
import HyperionPricing from '../../../collections/pricing/hyperion';
import helpers from '../../../modules/helpers';
import FineUploaderTraditional from 'fine-uploader-wrappers';
import Gallery from 'react-fine-uploader';
import LocationSelector from '../../components/Selectors/LocationSelector.jsx';
import LoadingIcon from '../../components/LoadingIcon/LoadingIcon.jsx';
const BigNumber = require('bignumber.js');

import { ComposableMap, ZoomableGroup, Geographies, Geography, Markers, Marker } from 'react-simple-maps';

// ...or load this specific CSS file using a <link> tag in your document
import 'react-fine-uploader/gallery/gallery.css';
import './Hyperion.scss';
import moment from 'moment';

const wrapperStyles = {
  width: '100%',
  maxWidth: 2500,
  marginTop: '20px',
};

class SimpleMarkers extends Component {
  render() {
    return (
      <div style={wrapperStyles}>
        <ComposableMap
          projectionConfig={{
            scale: 205,
            rotation: [-11, 0, 0],
          }}
          width={980}
          height={551}
          style={{
            width: '100%',
            height: 'auto',
          }}
        >
          <ZoomableGroup enter={[0, 20]} disablePanning>
            <Geographies geography="/assets/json/world-50m.json">
              {(geographies, projection) =>
                geographies.map(
                  (geography, i) =>
                    geography.id !== 'ATA' && (
                      <Geography
                        key={i}
                        geography={geography}
                        projection={projection}
                        style={{
                          default: {
                            fill: '#ECEFF1',
                            stroke: '#607D8B',
                            strokeWidth: 0.75,
                            outline: 'none',
                          },
                          hover: {
                            fill: '#607D8B',
                            stroke: '#607D8B',
                            strokeWidth: 0.75,
                            outline: 'none',
                          },
                          pressed: {
                            fill: '#FF5722',
                            stroke: '#607D8B',
                            strokeWidth: 0.75,
                            outline: 'none',
                          },
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
                    default: { fill: '#FF5722' },
                    hover: { fill: '#FF5722' },
                    pressed: { fill: '#FF5722' },
                  }}
                >
                  <circle
                    cx={0}
                    cy={0}
                    r={10}
                    style={{
                      stroke: '#FF5722',
                      strokeWidth: 3,
                    }}
                  />
                  <text
                    textAnchor="middle"
                    y={marker.markerOffset}
                    style={{
                      fontFamily: 'Roboto, sans-serif',
                      fill: 'white',
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

class HyperionComponent extends Component {
  constructor() {
    super();

    this.state = {
      updateRPCFormSubmitError: '',
      updateRESTFormSubmitError: '',
      updateRPCFormSubmitSuccess: '',
      updateRESTFormSubmitSuccess: '',
      rpcLoading: false,
      restLoading: false,
      locationCode: 'us-west-2',
      markers: [],
      deletingFiles: [],
      downloadingFiles: [],
      searchLoading: false,
    };

    this.downloadFile = this.downloadFile.bind(this);
    this.searchFile = this.searchFile.bind(this);

    this.uploader = new FineUploaderTraditional({
      options: {
        chunking: {
          enabled: false,
        },
        request: {
          endpoint: ``,
          inputName: 'file',
        },
        deleteFile: {
          enabled: false,
        },
        retry: {
          enableAuto: false,
        },
        callbacks: {
          onSubmit: async (id, fileName) => {
            function setUploaderURL(userId, locationCode, uploader) {
              return new Promise((resolve, reject) => {
                Meteor.call('getHyperionToken', { userId: userId }, (err, token) => {
                  if (!err) {
                    uploader.methods._endpointStore.set(`${window.location.origin}/api/hyperion/upload?location=${locationCode}&token=${token}`, id);

                    resolve();
                  } else {
                    reject();
                  }
                });
              });
            }

            await setUploaderURL(Meteor.userId(), this.locationCode, this.uploader);
          },
          onError: (id, fileName, reason, d) => {
            notifications.error(reason);
          },
          onTotalProgress: (a, b) => {
            console.log(a, b);
          },
        },
      },
    });
  }

  componentDidMount() {
    Meteor.call('getClusterLocations', { service: 'hyperion' }, (err, res) => {
      let ips = [];
      res.forEach(item => {
        ips.push(item.workerNodeIP);
      });

      Meteor.call('convertIP_Location', ips, (error, result) => {
        if (!error && result) {
          let markers = [];
          result.forEach(location => {
            markers.push({
              markerOffset: 4,
              coordinates: location.ll.reverse(),
            });
          });

          this.setState({
            markers: markers,
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

    let downloadingFiles = this.state.downloadingFiles;
    downloadingFiles.push(item.hash);

    this.setState({
      downloadingFiles: downloadingFiles,
    });

    Meteor.call('getHyperionToken', item, (err, token) => {
      if (!err) {
        helpers.downloadFile(
          `${window.location.origin}/api/hyperion/download?location=${item.region}&hash=${item.hash}&token=${token}`,
          item.fileName.substr(item.fileName.lastIndexOf('.') + 1)
        );
        notifications.success('File download started');
      } else {
        notifications.error('An error occured');
      }

      let downloadingFiles = this.state.downloadingFiles;
      let index = downloadingFiles.indexOf(item.hash);

      if (index > -1) {
        downloadingFiles.splice(index, 1);
        this.setState({
          downloadingFiles: downloadingFiles,
        });
      }
    });
  };

  applyPromotionalCode = () => {
    this.setState({
      promotionalCodeLoading: true,
    });
    Meteor.call('applyVoucherCode', { code: this.promotionalCode.value, type: 'hyperion', userId: Meteor.userId() }, (err, res) => {
      this.setState({
        promotionalCodeLoading: false,
      });
      if (err) {
        return notifications.error(err.reason);
      }
      this.promotionalCode.value = '';
      return notifications.success('Applied Successfully');
    });
  };

  searchFile = e => {
    e.preventDefault();

    this.setState({
      searchLoading: true,
    });

    Meteor.call('getHyperionToken', { userId: Meteor.userId() }, (err, token) => {
      if (!err) {
        HTTP.call('GET', `${window.location.origin}/api/hyperion/fileStats?location=${this.locationCode}&hash=${this.refs.searchBox.value}&token=${token}`, {}, (error, result) => {
          if (!error) {
            helpers.downloadFile(`${window.location.origin}/api/hyperion/download?location=${this.locationCode}&hash=${this.refs.searchBox.value}&token=${token}`);
            notifications.success('File download started');
          } else {
            notifications.error('File not found');
          }

          this.setState({
            searchLoading: false,
          });
        });
      } else {
        notifications.error('An error occured');
        this.setState({
          searchLoading: false,
        });
      }
    });
  };

  deleteFile = (e, item) => {
    e.preventDefault();

    let deletingFiles = this.state.deletingFiles;
    deletingFiles.push(item.hash);

    this.setState({
      deletingFiles: deletingFiles,
    });

    Meteor.call('getHyperionToken', item, (err, token) => {
      if (!err) {
        HTTP.call('DELETE', `${window.location.origin}/api/hyperion/delete?location=${item.region}&hash=${item.hash}&token=${token}`, {}, (error, result) => {
          if (!error) {
            notifications.success('File deleted successfully');
          } else {
            notifications.error('An error occured');
          }

          let deletingFiles = this.state.deletingFiles;
          let index = deletingFiles.indexOf(item.hash);

          if (index > -1) {
            deletingFiles.splice(index, 1);
            this.setState({
              deletingFiles: deletingFiles,
            });
          }
        });
      } else {
        notifications.error('An error occured');

        let deletingFiles = this.state.deletingFiles;
        let index = deletingFiles.indexOf(item.hash);

        if (index > -1) {
          deletingFiles.splice(index, 1);
          this.setState({
            deletingFiles: deletingFiles,
          });
        }
      }
    });
  };

  activate = _ => {
    this.setState({
      ['_activate_loading']: true,
    });

    Meteor.call('subscribeForHyperion', e => {
      if (e) {
        notifications.error(e.reason);
      } else {
        notifications.success('Subscription Successful');
      }

      this.setState({
        ['_activate_loading']: false,
      });
    });
  };

  deactivate = _ => {
    this.setState({
      ['_activate_loading']: true,
    });

    Meteor.call('unsubscribeFromHyperion', e => {
      if (e) {
        notifications.error(e.reason);
      } else {
        notifications.success('Unsubscription Successful');
      }

      this.setState({
        ['_activate_loading']: false,
      });
    });
  };

  render() {
    const hyperionPricing = this.props.hyperionPricing;

    return (
      <div className="content hyperion">
        <div className="m-t-20 container-fluid container-fixed-lg">
          <div className="row">
            <div className="card card-borderless card-transparent">
              <ul className="nav nav-tabs nav-tabs-linetriangle" role="tablist" data-init-reponsive-tabs="dropdownfx">
                <li className="nav-item">
                  <a className="active" href="#" data-toggle="tab" role="tab" data-target="#upload">
                    Upload
                  </a>
                </li>
                <li className="nav-item">
                  <a className="" href="#" data-toggle="tab" role="tab" data-target="#files">
                    Files
                  </a>
                </li>
                <li className="nav-item">
                  <a href="#" data-toggle="tab" role="tab" data-target="#search">
                    Search
                  </a>
                </li>
                <li className="nav-item">
                  <a href="#" data-toggle="tab" role="tab" data-target="#stats">
                    Stats & Billing
                  </a>
                </li>
                <li className="nav-item">
                  <a href="#" data-toggle="tab" role="tab" data-target="#activation">
                    Activation
                  </a>
                </li>
                <li className="nav-item">
                  <a href="#" data-toggle="tab" role="tab" data-target="#vouchers">
                    Vouchers
                  </a>
                </li>
              </ul>
              <div className="tab-content">
                <div className="tab-pane active" id="upload">
                  <div className="row">
                    <div className="col-lg-12">
                      <div className="card card-transparent">
                        <div className="card-block" style={{ paddingBottom: '0px' }}>
                          <div className="form-group-attached">
                            <form role="form">
                              <LocationSelector locationChangeListener={locationCode => (this.locationCode = locationCode)} service="hyperion" />
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
                            <table className="table table-hover" id="basicTable">
                              <thead>
                                <tr>
                                  <th style={{ width: '15%' }}>File Name</th>
                                  <th style={{ width: '15%' }}>Hash</th>
                                  <th style={{ width: '18%' }}>Size</th>
                                  <th style={{ width: '17%' }}>Region</th>
                                  <th style={{ width: '15%' }}>Uploaded on</th>
                                  <th style={{ width: '20%' }}>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {this.props.files.map((item, index) => {
                                  return (
                                    <tr key={item._id}>
                                      <td className="v-align-middle ">{item.fileName}</td>
                                      <td className="v-align-middle">{item.hash}</td>
                                      <td className="v-align-middle">{helpers.bytesToSize(item.size)}</td>
                                      <td className="v-align-middle">{item.region}</td>
                                      <td className="v-align-middle">{helpers.timeConverter(item.uploaded / 1000)}</td>
                                      <td className="v-align-middle">
                                        {this.state.downloadingFiles.includes(item.hash) && <LoadingIcon />}
                                        {!this.state.downloadingFiles.includes(item.hash) && <i className="fa fa-download download" onClick={e => this.downloadFile(e, item)} />}
                                        &nbsp;&nbsp;&nbsp;
                                        {this.state.deletingFiles.includes(item.hash) && <LoadingIcon />}
                                        {!this.state.deletingFiles.includes(item.hash) && <i className="fa fa-trash delete" onClick={e => this.deleteFile(e, item)} />}
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
                                        Disk Space Consumed <i className="fa fa-chevron-right" />
                                      </span>
                                    </div>
                                    <div className="card-controls">
                                      <ul>
                                        <li>
                                          <a href="#" className="card-refresh " style={{ color: 'white' }} data-toggle="refresh">
                                            <i className="fa fa-cloud text-white" />
                                          </a>
                                        </li>
                                      </ul>
                                    </div>
                                  </div>
                                  <div className="p-l-20">
                                    <h3 className="no-margin p-b-30 text-white ">
                                      {this.props.hyperion && <span>{helpers.bytesToSize(this.props.hyperion.size)}</span>}

                                      {!this.props.hyperion && <span>0</span>}
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
                                        Cost Per GB <i className="fa fa-chevron-right" />
                                      </span>
                                    </div>
                                    <div className="card-controls">
                                      <ul>
                                        <li>
                                          <a href="#" className="card-refresh " style={{ color: 'white' }} data-toggle="refresh">
                                            <i className="fa fa-archive text-white" />
                                          </a>
                                        </li>
                                      </ul>
                                    </div>
                                  </div>
                                  <div className="p-l-20">
                                    <h3 className="no-margin p-b-30 text-white ">
                                      <span>${this.props.hyperionPricing && this.props.hyperionPricing.perGBCost}</span>
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
                                        Monthly Cost <i className="fa fa-chevron-right" />
                                      </span>
                                    </div>
                                    <div className="card-controls">
                                      <ul>
                                        <li>
                                          <a href="#" className="card-refresh " style={{ color: 'white' }} data-toggle="refresh">
                                            <i className="fa fa-calendar text-white" />
                                          </a>
                                        </li>
                                      </ul>
                                    </div>
                                  </div>
                                  <div className="p-l-20">
                                    <h3 className="no-margin p-b-30 text-white ">
                                      {this.props.hyperion && (
                                        <span>${Number(((this.props.hyperion.size || 0) / (1024 * 1024 * 1024)) * (hyperionPricing && hyperionPricing.perGBCost)).toFixed(2)}</span>
                                      )}

                                      {!this.props.hyperion && <span>$0</span>}
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
                                        This Month Invoice <i className="fa fa-chevron-right" />
                                      </span>
                                    </div>
                                    <div className="card-controls">
                                      <ul>
                                        <li>
                                          <a href="#" className="card-refresh " style={{ color: 'white' }} data-toggle="refresh">
                                            <i className="fa fa-file-o text-white" />
                                          </a>
                                        </li>
                                      </ul>
                                    </div>
                                  </div>
                                  <div className="p-l-20">
                                    <h3 className="no-margin p-b-30 text-white ">
                                      {this.props.hyperion && (
                                        <span>
                                          $
                                          {Math.max(
                                            ((this.props.hyperion.size || 0) / (1024 * 1024 * 1024)) * (hyperionPricing ? hyperionPricing.perGBCost : 0) -
                                              (this.props.hyperion.discount || 0),
                                            Number(this.props.hyperion.minimumFeeThisMonth)
                                          ).toFixed(2)}
                                        </span>
                                      )}

                                      {!this.props.hyperion && <span>$0</span>}
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
                            <form role="form" onSubmit={e => this.searchFile(e)}>
                              <LocationSelector locationChangeListener={locationCode => (this.locationCode = locationCode)} />
                              <div className="form-group form-group-default m-t-10">
                                <label>Enter File Hash</label>
                                <input
                                  type="text"
                                  placeholder="QmcoEsT1y1jJjGKv5jXLtVrkyuV9mz2hukPic5UnjS4JEw"
                                  className="form-control"
                                  ref="searchBox"
                                  style={{ height: 'calc(2.25rem + 2px)' }}
                                />
                              </div>
                              <LaddaButton
                                loading={this.state.searchLoading}
                                data-size={S}
                                data-style={SLIDE_UP}
                                data-spinner-size={30}
                                data-spinner-lines={12}
                                className="btn btn-complete btn-cons m-t-10"
                                type="submit"
                              >
                                <i className="fa fa-search" aria-hidden="true" />
                                &nbsp;&nbsp;Search
                              </LaddaButton>
                            </form>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="tab-pane" id="activation">
                  <div className="row">
                    <div className="col-lg-12">
                      <div className="card card-transparent m-b-0">
                        <div className="card-block">
                          <div>
                            <div className="tab-pane padding-20 sm-no-padding active slide-left" id="tab1">
                              <div className="row row-same-height">
                                <div className="col-md-6 sm-b-b b-r b-dashed b-grey ">
                                  <div className="padding-30 sm-padding-5 sm-m-t-15">
                                    <i className="fa fa fa-cube fa-2x hint-text" />
                                    <h2>IPFS Cluster-as-a-Service</h2>
                                    <p>Hyperion let's you upload files to a specific geographic location and share it with anyone using just the hash of the file.</p>
                                    <p className="small hint-text">
                                      Note that anyone with the hash of the file can download the file from any geo-graphic location. The hash should be shared only with parties
                                      which should have access to it.
                                    </p>
                                    <div>
                                      <div>
                                        {this.props.hyperion ? (
                                          <div>
                                            {this.props.hyperion.subscribed ? (
                                              <div>
                                                {this.props.hyperion.unsubscribeNextMonth ? (
                                                  <LaddaButton
                                                    onClick={e => {
                                                      this.activate();
                                                    }}
                                                    loading={this.state['_activate_loading']}
                                                    data-size={S}
                                                    data-style={SLIDE_UP}
                                                    data-spinner-size={30}
                                                    data-spinner-lines={12}
                                                    className="btn btn-complete  btn-cons m-t-10"
                                                    type="button"
                                                  >
                                                    <i className="fa fa-check" aria-hidden="true" />
                                                    &nbsp;&nbsp;Re-Subscribe
                                                  </LaddaButton>
                                                ) : (
                                                  <LaddaButton
                                                    onClick={e => {
                                                      this.deactivate();
                                                    }}
                                                    loading={this.state['_activate_loading']}
                                                    data-size={S}
                                                    data-style={SLIDE_UP}
                                                    data-spinner-size={30}
                                                    data-spinner-lines={12}
                                                    className="btn btn-danger  btn-cons m-t-10"
                                                    type="button"
                                                  >
                                                    <i className="fa fa-times" aria-hidden="true" />
                                                    &nbsp;&nbsp;Unsubscribe
                                                  </LaddaButton>
                                                )}
                                              </div>
                                            ) : (
                                              <LaddaButton
                                                onClick={e => {
                                                  this.activate();
                                                }}
                                                loading={this.state['_activate_loading']}
                                                data-size={S}
                                                data-style={SLIDE_UP}
                                                data-spinner-size={30}
                                                data-spinner-lines={12}
                                                className="btn btn-success  btn-cons m-t-10"
                                                type="button"
                                              >
                                                <i className="fa fa-check" aria-hidden="true" />
                                                &nbsp;&nbsp;Subscribe
                                              </LaddaButton>
                                            )}
                                          </div>
                                        ) : (
                                          <LaddaButton
                                            onClick={e => {
                                              this.activate();
                                            }}
                                            loading={this.state['_activate_loading']}
                                            data-size={S}
                                            data-style={SLIDE_UP}
                                            data-spinner-size={30}
                                            data-spinner-lines={12}
                                            className="btn btn-success  btn-cons m-t-10"
                                            type="button"
                                          >
                                            <i className="fa fa-check" aria-hidden="true" />
                                            &nbsp;&nbsp;Subscribe
                                          </LaddaButton>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <div className="padding-30 sm-padding-5">
                                    <h5>Pricing Model</h5>
                                    <div className="row">
                                      <div className="col-lg-12">
                                        <p className="no-margin">Storage Consumed</p>
                                        <p className="small hint-text">
                                          We only charge for uploading files. There are no charges for bandwidth utilization. We deduct the fees from your added debit/credit card
                                          at the end of the month.
                                        </p>
                                      </div>
                                    </div>
                                    <div className="row">
                                      <div className="col-lg-12">
                                        <p className="no-margin">Monthly Minimum</p>
                                        <p className="small hint-text">We charge $399 or total storage fees consumed depending on whichever is greater</p>
                                      </div>
                                    </div>
                                    <table className="table table-condensed">
                                      <tbody>
                                        <tr>
                                          <td className="col-lg-8 col-md-6 col-sm-7 ">
                                            <a href="#" className="remove-item">
                                              <i className="fa fa-check" />
                                            </a>
                                            <span className="m-l-10 font-montserrat fs-11 all-caps no-hidden-text">File Upload</span>
                                          </td>
                                          <td className=" col-lg-2 col-md-3 col-sm-3 text-right">
                                            <span className="no-hidden-text">Per GB / month</span>
                                          </td>
                                          <td className=" col-lg-2 col-md-3 col-sm-2 text-right">
                                            <h4 className="text-primary no-margin font-montserrat no-hidden-text">${hyperionPricing && hyperionPricing.perGBCost}</h4>
                                          </td>
                                        </tr>
                                        <tr>
                                          <td className="col-lg-8 col-md-6 col-sm-7 ">
                                            <a href="#" className="remove-item">
                                              <i className="fa fa-check" />
                                            </a>
                                            <span className="m-l-10 font-montserrat fs-11 all-caps no-hidden-text">Minimum fees</span>
                                          </td>
                                          <td className=" col-lg-2 col-md-3 col-sm-3 text-right">
                                            <span className="no-hidden-text">Per month</span>
                                          </td>
                                          <td className=" col-lg-2 col-md-3 col-sm-2 text-right">
                                            <h4 className="text-primary no-margin font-montserrat no-hidden-text">${hyperionPricing && hyperionPricing.minimumMonthlyCost}</h4>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>

                                    <br />
                                    <div className="p-l-15 p-r-15">
                                      <div className="row b-a b-grey">
                                        {/*<div className="col-md-2 p-l-15 sm-p-t-15 clearfix sm-p-b-15 d-flex flex-column justify-content-center">
                                          <h5 className="font-montserrat all-caps small no-margin hint-text bold">Advance</h5>
                                          <h3 className="no-margin">

                                          </h3>
                                        </div>*/}
                                        <div className="col-md-6 clearfix sm-p-b-15 d-flex flex-column justify-content-center">
                                          <h5 className="font-montserrat all-caps small no-margin hint-text bold">Minimum Fee This Month</h5>
                                          <h3 className="no-margin">
                                            {this.props.hyperion && <span>${helpers.getFlooredFixed(parseFloat(this.props.hyperion.minimumFeeThisMonth || '0.00'), 2)}</span>}

                                            {!this.props.hyperion && <span>$0.00</span>}
                                          </h3>
                                        </div>
                                        <div className="col-md-6 text-right bg-master-darker col-sm-height padding-15 d-flex flex-column justify-content-center align-items-end">
                                          <h5 className="font-montserrat all-caps small no-margin hint-text text-white bold">Total Fee This Month</h5>
                                          <h1 className="no-margin text-white">
                                            <span>$</span>
                                            <span>
                                              {this.props.hyperion && (
                                                <span>
                                                  {helpers.getFlooredFixed(
                                                    (
                                                      (
                                                        ((this.props.hyperion.size || 0) / 1024 / 1024 / 1024) *
                                                        (helpers.hyperionGBCostPerDay() * helpers.daysInThisMonth())
                                                      ).toPrecision(2) - (this.props.hyperion.discount || 0)
                                                    ).toPrecision(2),
                                                    2
                                                  )}
                                                </span>
                                              )}

                                              {!this.props.hyperion && <span>0</span>}
                                            </span>
                                          </h1>
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
                  </div>
                </div>
                <div className="tab-pane" id="vouchers">
                  <div className="row">
                    <div className="col-md-8 col-md-6 b-r b-dashed b-grey">
                      <div className="card card-transparent m-b-0">
                        <div className="card-block">
                          <div className="form-group-attached">
                            <form role="form">
                              <div className="form-group form-group-default m-t-10">
                                <label>Apply promotional code</label>
                                <input
                                  type="text"
                                  placeholder="HYPERIONCODE100"
                                  className="form-control"
                                  ref={i => (this.promotionalCode = i)}
                                  style={{ height: 'calc(2.25rem + 2px)' }}
                                />
                              </div>
                              <LaddaButton
                                loading={this.state.promotionalCodeLoading}
                                data-size={S}
                                data-style={SLIDE_UP}
                                data-spinner-size={30}
                                data-spinner-lines={12}
                                className="btn btn-complete btn-cons m-t-10"
                                onClick={this.applyPromotionalCode}
                              >
                                <i className="fa fa-check" aria-hidden="true" />
                                &nbsp;&nbsp;Redeem
                              </LaddaButton>
                            </form>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4 col-sm-6">
                      <div className="card-block">
                        <h4 className="text-primary">Applied voucher codes</h4>
                        <br />
                        <ul>
                          {this.props.hyperion &&
                            this.props.hyperion.vouchers &&
                            this.props.hyperion.vouchers.map(voucher => {
                              return (
                                <li>
                                  <b>{voucher.code}</b> | {moment(voucher.appliedOn).format('DD-MMM-YYYY')}
                                </li>
                              );
                            })}
                        </ul>
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
    hyperion: Hyperion.find({ userId: Meteor.userId() }).fetch()[0],
    hyperionPricing: HyperionPricing.find({ active: true }).fetch()[0],
    workerNodeIP: Config.workerNodeIP,
    workerNodeDomainName: Config.workerNodeDomainName,
    subscriptions: [Meteor.subscribe('files'), Meteor.subscribe('hyperion')],
  };
})(withRouter(HyperionComponent));
