import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { Networks } from '../../../collections/networks/networks.js';
import helpers from '../../../modules/helpers';
import ReactHtmlParser, { processNodes, convertNodeToElement, htmlparser2 } from 'react-html-parser';
import { withRouter } from 'react-router-dom';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';
import notifications from '../../../modules/notifications';
import { Link } from 'react-router-dom';
var html2pdf = require('html2pdf.js');
import './AssetsAudit.scss';
import Config from '../../../modules/config/client';

import { base64_accessGranted, base64_accessRevoked, base64_closeAsset, base64_newAsset, base64_transferAsset, base64_updateAsset, base64_updateAssetEncrypted } from './images';

class AssetsAudit extends Component {
  constructor() {
    super();
    this.state = {
      assetTypes: [],
    };

    this.getAssetTypes = this.getAssetTypes.bind(this);
  }

  componentDidMount() {
    this.setState({
      refreshAssetTypesTimer: setInterval(this.getAssetTypes, 500),
    });
  }

  getAssetTypes() {
    if (this.props.network[0]) {
      let url = `https://${Config.workerNodeDomainName(this.props.network[0].locationCode)}/api/node/${this.props.network[0].instanceId}/assets/assetTypes`;
      HTTP.get(
        url,
        {
          headers: {
            Authorization: 'Basic ' + new Buffer(`${this.props.network[0].instanceId}:${this.props.network[0]['api-password']}`).toString('base64'),
          },
        },
        (err, res) => {
          if (!err) {
            this.setState({
              assetTypes: res.data,
            });
          }
        }
      );
    }
  }

  downloadReport = (e, instanceId) => {
    e.preventDefault();

    this.setState({
      _auditReport_formSubmitError: '',
      _auditReport_formloading: true,
    });

    let assetName = this['_auditReport_assetName'].value;
    let uID = this['_auditReport_uniqueIdentifier'].value;

    Meteor.call('downloadReport', instanceId, assetName, uID, (error, result) => {
      if (!error) {
        this.setState({
          _auditReport_formloading: false,
          _auditReport_formSubmitError: '',
        });

        let uniqueIdentifier = uID;

        let html = `
                <html xmlns="http://www.w3.org/1999/xhtml">
                    <head>
                        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
                        <meta name="format-detection" content="telephone=no">
                        <meta name="viewport" content="width=device-width; initial-scale=1.0; maximum-scale=1.0; user-scalable=no;">
                        <meta http-equiv="X-UA-Compatible" content="IE=9; IE=8; IE=7; IE=EDGE">
                    </head>
                    <body style="padding:0; margin:0">
                        <div style="word-wrap:break-word">
                            <div>
                                <center style="font-family:'Helvetica Neue',sans-serif;font-size:12px;font-style:normal;font-variant:normal;font-weight:normal;letter-spacing:normal;text-indent:0px;text-transform:none;white-space:normal;word-spacing:0px;background-color:rgb(240,240,240)">
                                    <br>
                                    <table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%" bgcolor="#f0f0f0" style="margin:0px;padding:0px;height:100%!important;width:100%!important;font-family:'Helvetica Neue',sans-serif;background-color:rgb(240,240,240);background-position:initial initial;background-repeat:initial initial">
                                        <tbody>
                                            <tr>
                                                <td align="center" valign="top">
                                                    <table border="0" cellpadding="0" cellspacing="0" width="600" style="font-family:'Helvetica Neue',sans-serif">
                                                        <tbody>
                                                            <tr>
                                                                <td align="center" valign="top">
                                                                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                                                        <tbody>
                                                                            <tr>
                                                                                <td align="left" valign="top">
                                                                                    <table border="0" cellpadding="30" cellspacing="0" width="100%">
                                                                                        <tbody>
                                                                                            <tr>
                                                                                                <td valign="top" bgcolor="#fff" style="background-color:rgb(255,255,255);border-top-left-radius:6px;border-top-right-radius:6px;border-bottom-right-radius:6px;border-bottom-left-radius:6px;font-family:'Helvetica Neue',sans-serif;background-position:initial initial;background-repeat:initial initial">
                                                                                                    <div style="border-bottom-color:rgb(238,238,238);border-bottom-style:solid;border-bottom-width:1px;color:rgb(68,68,68);font-family:'Helvetica Neue',sans-serif;font-size:14px;line-height:21px;margin-bottom:20px;padding-bottom:25px">
                                                                                                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                                                                                            <tbody>
                                                                                                                <tr>
                                                                                                                    <td>
                                                                                                                        <h1 align="left" style="margin-top: 10px; color:rgb(68,68,68);display:block;font-family:'Helvetica Neue',sans-serif;font-size:18px;font-weight:500;line-height:1.3;margin:0px;text-align:left">${assetName}: ${uniqueIdentifier}<span style="color:rgb(153,153,153);display:block;font-size:15px;font-weight:normal">Here is the detailed audit trail of the ${assetName}.</span></h1>
                                                                                                                    </td>
                                                                                                                </tr>
                                                                                                            </tbody>
                                                                                                        </table>
                                                                                                    </div>
                                                                                                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size:14px;margin:0px 0px 30px;padding:0px">
                                                                                                        <tbody>
                                                                                                            <tr>
                                                                                                                <td style="padding:10px 0px"></td>
                                                                                                                <td style="padding:10px 0px"></td>
                                                                                                                <td colspan="3" style="padding:10px 0px">
                                                                                                                    <h3 align="left" style="color:rgb(153,153,153);display:block;font-family:'Helvetica Neue',sans-serif;font-size:13px;font-weight:500;line-height:13px;margin:0px;padding:0px;text-align:left;text-transform:uppercase">Transactions</h3>
                                                                                                                </td>
                                                                                                            </tr>
                `;

        for (let count = 0; count < result.length; count++) {
          if (result[count].eventName === 'soloAssetIssued') {
            let icon = base64_newAsset;
            let title = 'Issued';
            let date = helpers.timeConverter(result[count].timestamp);
            let data = 'Owner: ' + result[count].owner;
            let txID = result[count].transactionHash;

            html =
              html +
              `
                        <tr>
                        <td width="40" style="padding:10px 0px"><img src="${icon}" style="border:0px;min-height:auto;line-height:14px;outline:none;text-decoration:none;border-top-left-radius:50%;border-top-right-radius:50%;border-bottom-right-radius:50%;border-bottom-left-radius:50%;display:inline;width: 24px;margin-left: 8px;"></td>
                            <td width="15" style="padding:10px 0px"><img width="15" alt="" style="border:0px;min-height:auto;line-height:14px;outline:none;text-decoration:none;display:inline"></td>
                            <td style="padding:10px 0px"><a style="color:rgb(68,68,68);font-family:'Helvetica Neue',sans-serif;font-weight:500;text-decoration:none" target="_blank"><strong style="color:rgb(68,68,68);display:block;margin:0px 0px 4px;font-size:16px;line-height:1.2">${title}</strong><span style="font-weight:normal;color:rgb(119,119,119)">${date}</span></a></td>
                            <td width="15" style="padding:10px 0px"><img width="15" alt="" style="border:0px;min-height:auto;line-height:14px;outline:none;text-decoration:none;display:inline"></td>
                            <td style="padding:10px 0px"><span style="display: inline-block; width: 100px; color:rgb(153,153,153);font-size:13px">${data}</span></td>
                            <td width="15" style="padding:10px 0px"><img width="15" alt="" style="border:0px;min-height:auto;line-height:14px;outline:none;text-decoration:none;display:inline"></td>
                            <td style="padding:10px 0px"><span style="display: inline-block; width: 100px; color:rgb(153,153,153);font-size:13px">Transaction ID: ${txID}</span></td>
                        </tr>`;
          } else if (result[count].eventName === 'addedOrUpdatedSoloAssetExtraData') {
            let icon = base64_updateAsset;
            let title = 'Updated';
            let date = helpers.timeConverter(result[count].timestamp);
            let data = result[count].key + ': ' + result[count].value;
            let txID = result[count].transactionHash;

            html =
              html +
              `
                        <tr>
                            <td width="40" style="padding:10px 0px"><img src="${icon}" style="border:0px;min-height:auto;line-height:14px;outline:none;text-decoration:none;border-top-left-radius:50%;border-top-right-radius:50%;border-bottom-right-radius:50%;border-bottom-left-radius:50%;display:inline;width: 36px;margin-left: 3px;"></td>
                            <td width="15" style="padding:10px 0px"><img width="15" alt="" style="border:0px;min-height:auto;line-height:14px;outline:none;text-decoration:none;display:inline"></td>
                            <td style="padding:10px 0px"><a style="color:rgb(68,68,68);font-family:'Helvetica Neue',sans-serif;font-weight:500;text-decoration:none" target="_blank"><strong style="color:rgb(68,68,68);display:block;margin:0px 0px 4px;font-size:16px;line-height:1.2">${title}</strong><span style="font-weight:normal;color:rgb(119,119,119)">${date}</span></a></td>
                            <td width="15" style="padding:10px 0px"><img width="15" alt="" style="border:0px;min-height:auto;line-height:14px;outline:none;text-decoration:none;display:inline"></td>
                            <td style="padding:10px 0px"><span style="display: inline-block; width: 100px; color:rgb(153,153,153);font-size:13px">${data}</span></td>
                            <td width="15" style="padding:10px 0px"><img width="15" alt="" style="border:0px;min-height:auto;line-height:14px;outline:none;text-decoration:none;display:inline"></td>
                            <td style="padding:10px 0px"><span style="display: inline-block; width: 100px; color:rgb(153,153,153);font-size:13px">Transaction ID: ${txID}</span></td>
                        </tr>`;
          } else if (result[count].eventName === 'addedOrUpdatedEncryptedDataObjectHash') {
            let icon = base64_updateAssetEncrypted;
            let title = 'Updated';
            let date = helpers.timeConverter(result[count].timestamp);
            let data = result[count].key + ': ' + result[count].value;
            let txID = result[count].transactionHash;

            html =
              html +
              `
                        <tr>
                            <td width="40" style="padding:10px 0px"><img src="${icon}" style="border:0px;min-height:auto;line-height:14px;outline:none;text-decoration:none;border-top-left-radius:50%;border-top-right-radius:50%;border-bottom-right-radius:50%;border-bottom-left-radius:50%;display:inline;width: 32px;margin-left: 3px;"></td>
                            <td width="15" style="padding:10px 0px"><img width="15" alt="" style="border:0px;min-height:auto;line-height:14px;outline:none;text-decoration:none;display:inline"></td>
                            <td style="padding:10px 0px"><a style="color:rgb(68,68,68);font-family:'Helvetica Neue',sans-serif;font-weight:500;text-decoration:none" target="_blank"><strong style="color:rgb(68,68,68);display:block;margin:0px 0px 4px;font-size:16px;line-height:1.2">${title}</strong><span style="font-weight:normal;color:rgb(119,119,119)">${date}</span></a></td>
                            <td width="15" style="padding:10px 0px"><img width="15" alt="" style="border:0px;min-height:auto;line-height:14px;outline:none;text-decoration:none;display:inline"></td>
                            <td style="padding:10px 0px"><span style="display: inline-block; width: 100px; color:rgb(153,153,153);font-size:13px">${data}</span></td>
                            <td width="15" style="padding:10px 0px"><img width="15" alt="" style="border:0px;min-height:auto;line-height:14px;outline:none;text-decoration:none;display:inline"></td>
                            <td style="padding:10px 0px"><span style="display: inline-block; width: 100px; color:rgb(153,153,153);font-size:13px">Transaction ID: ${txID}</span></td>
                        </tr>`;
          } else if (result[count].eventName === 'soloAssetAccessGranted') {
            let icon = base64_accessGranted;
            let title = 'Access Granted';
            let date = helpers.timeConverter(result[count].timestamp);
            let data = 'Public Key: ' + result[count].publicKey;
            let txID = result[count].transactionHash;

            html =
              html +
              `
                        <tr>
                            <td width="40" style="padding:10px 0px"><img src="${icon}" style="border:0px;min-height:auto;line-height:14px;outline:none;text-decoration:none;border-top-left-radius:50%;border-top-right-radius:50%;border-bottom-right-radius:50%;border-bottom-left-radius:50%;display:inline;width: 32px;margin-left: 3px;"></td>
                            <td width="15" style="padding:10px 0px"><img width="15" alt="" style="border:0px;min-height:auto;line-height:14px;outline:none;text-decoration:none;display:inline"></td>
                            <td style="padding:10px 0px"><a style="color:rgb(68,68,68);font-family:'Helvetica Neue',sans-serif;font-weight:500;text-decoration:none" target="_blank"><strong style="color:rgb(68,68,68);display:block;margin:0px 0px 4px;font-size:16px;line-height:1.2">${title}</strong><span style="font-weight:normal;color:rgb(119,119,119)">${date}</span></a></td>
                            <td width="15" style="padding:10px 0px"><img width="15" alt="" style="border:0px;min-height:auto;line-height:14px;outline:none;text-decoration:none;display:inline"></td>
                            <td style="padding:10px 0px"><span style="display: inline-block; width: 100px; color:rgb(153,153,153);font-size:13px">${data}</span></td>
                            <td width="15" style="padding:10px 0px"><img width="15" alt="" style="border:0px;min-height:auto;line-height:14px;outline:none;text-decoration:none;display:inline"></td>
                            <td style="padding:10px 0px"><span style="display: inline-block; width: 100px; color:rgb(153,153,153);font-size:13px">Transaction ID: ${txID}</span></td>
                        </tr>`;
          } else if (result[count].eventName === 'soloAssetAccessRevoked') {
            let icon = base64_accessRevoked;
            let title = 'Access Revoked';
            let date = helpers.timeConverter(result[count].timestamp);
            let data = 'Public Key: ' + result[count].publicKey;
            let txID = result[count].transactionHash;

            html =
              html +
              `
                        <tr>
                            <td width="40" style="padding:10px 0px"><img src="${icon}" style="border:0px;min-height:auto;line-height:14px;outline:none;text-decoration:none;border-top-left-radius:50%;border-top-right-radius:50%;border-bottom-right-radius:50%;border-bottom-left-radius:50%;display:inline;width: 32px;margin-left: 3px;"></td>
                            <td width="15" style="padding:10px 0px"><img width="15" alt="" style="border:0px;min-height:auto;line-height:14px;outline:none;text-decoration:none;display:inline"></td>
                            <td style="padding:10px 0px"><a style="color:rgb(68,68,68);font-family:'Helvetica Neue',sans-serif;font-weight:500;text-decoration:none" target="_blank"><strong style="color:rgb(68,68,68);display:block;margin:0px 0px 4px;font-size:16px;line-height:1.2">${title}</strong><span style="font-weight:normal;color:rgb(119,119,119)">${date}</span></a></td>
                            <td width="15" style="padding:10px 0px"><img width="15" alt="" style="border:0px;min-height:auto;line-height:14px;outline:none;text-decoration:none;display:inline"></td>
                            <td style="padding:10px 0px"><span style="display: inline-block; width: 100px; color:rgb(153,153,153);font-size:13px">${data}</span></td>
                            <td width="15" style="padding:10px 0px"><img width="15" alt="" style="border:0px;min-height:auto;line-height:14px;outline:none;text-decoration:none;display:inline"></td>
                            <td style="padding:10px 0px"><span style="display: inline-block; width: 100px; color:rgb(153,153,153);font-size:13px">Transaction ID: ${txID}</span></td>
                        </tr>`;
          } else if (result[count].eventName === 'transferredOwnershipOfSoloAsset') {
            let icon = base64_transferAsset;
            let title = 'Transferred';
            let date = helpers.timeConverter(result[count].timestamp);
            let data = 'New Owner: ' + result[count].owner;
            let txID = result[count].transactionHash;

            html =
              html +
              `
                        <tr>
                            <td width="40" style="padding:10px 0px"><img src="${icon}" style="border:0px;min-height:auto;line-height:14px;outline:none;text-decoration:none;border-top-left-radius:50%;border-top-right-radius:50%;border-bottom-right-radius:50%;border-bottom-left-radius:50%;display:inline;width: 24px;margin-left: 8px;"></td>
                            <td width="15" style="padding:10px 0px"><img width="15" alt="" style="border:0px;min-height:auto;line-height:14px;outline:none;text-decoration:none;display:inline"></td>
                            <td style="padding:10px 0px"><a style="color:rgb(68,68,68);font-family:'Helvetica Neue',sans-serif;font-weight:500;text-decoration:none" target="_blank"><strong style="color:rgb(68,68,68);display:block;margin:0px 0px 4px;font-size:16px;line-height:1.2">${title}</strong><span style="font-weight:normal;color:rgb(119,119,119)">${date}</span></a></td>
                            <td width="15" style="padding:10px 0px"><img width="15" alt="" style="border:0px;min-height:auto;line-height:14px;outline:none;text-decoration:none;display:inline"></td>
                            <td style="padding:10px 0px"><span style="display: inline-block; width: 100px; color:rgb(153,153,153);font-size:13px">${data}</span></td>
                            <td width="15" style="padding:10px 0px"><img width="15" alt="" style="border:0px;min-height:auto;line-height:14px;outline:none;text-decoration:none;display:inline"></td>
                            <td style="padding:10px 0px"><span style="display: inline-block; width: 100px; color:rgb(153,153,153);font-size:13px">Transaction ID: ${txID}</span></td>
                        </tr>`;
          } else if (result[count].eventName === 'closedSoloAsset') {
            let icon = base64_closeAsset;
            let title = 'Closed';
            let date = helpers.timeConverter(result[count].timestamp);
            let data = '';
            let txID = result[count].transactionHash;

            html =
              html +
              `
                        <tr>
                            <td width="40" style="padding:10px 0px"><img src="${icon}" style="border:0px;min-height:auto;line-height:14px;outline:none;text-decoration:none;border-top-left-radius:50%;border-top-right-radius:50%;border-bottom-right-radius:50%;border-bottom-left-radius:50%;display:inline;width: 24px;margin-left: 8px;"></td>
                            <td width="15" style="padding:10px 0px"><img width="15" alt="" style="border:0px;min-height:auto;line-height:14px;outline:none;text-decoration:none;display:inline"></td>
                            <td style="padding:10px 0px"><a style="color:rgb(68,68,68);font-family:'Helvetica Neue',sans-serif;font-weight:500;text-decoration:none" target="_blank"><strong style="color:rgb(68,68,68);display:block;margin:0px 0px 4px;font-size:16px;line-height:1.2">${title}</strong><span style="font-weight:normal;color:rgb(119,119,119)">${date}</span></a></td>
                            <td width="15" style="padding:10px 0px"><img width="15" alt="" style="border:0px;min-height:auto;line-height:14px;outline:none;text-decoration:none;display:inline"></td>
                            <td style="padding:10px 0px"><span style="display: inline-block; width: 100px; color:rgb(153,153,153);font-size:13px">${data}</span></td>
                            <td width="15" style="padding:10px 0px"><img width="15" alt="" style="border:0px;min-height:auto;line-height:14px;outline:none;text-decoration:none;display:inline"></td>
                            <td style="padding:10px 0px"><span style="display: inline-block; width: 100px; color:rgb(153,153,153);font-size:13px">Transaction ID: ${txID}</span></td>
                        </tr>`;
          }
        }

        html =
          html +
          `
                                </tbody>
                            </table>
                        </td>
                    </tr>
                    </tbody>
                    </table>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-family:'Helvetica Neue',sans-serif">
                    <tbody>
                    <tr>
                        <td valign="top">
                            <table border="0" cellpadding="30" cellspacing="0" width="100%">
                                <tbody>
                                    <tr>
                                        <td valign="top">
                                            <div align="center" style="color:rgb(153,153,153);font-family:'Helvetica Neue',sans-serif;font-size:13px;line-height:1.6;padding:0px 27px;text-align:center">
                                                Audit Report Generated using <a href="https://www.blockcluster.io">Blockcluster</a>
                                                <br>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                    </tbody>
                    </table>
                    </td>
                    </tr>
                    </tbody>
                    </table>
                    </td>
                    </tr>
                    </tbody>
                    </table>
                    </td>
                    </tr>
                    </tbody>
                    </table>
                    </center>
                    </div>
                    </div>
                    </body>
                    </html>

                `;

        html2pdf()
          .set({
            enableLinks: false,
            filename: `audit-${assetName}-${uID}.pdf`,
          })
          .from(html)
          .save();
      } else {
        this.setState({
          _auditReport_formloading: false,
          _auditReport_formSubmitError: error.reason,
        });
      }
    });
  };

  componentWillUnmount() {
    this.props.subscriptions.forEach(s => {
      s.stop();
    });

    clearInterval(this.state.refreshAssetTypesTimer);
  }

  render() {
    return (
      <div className="createAssetType content">
        <div className="m-t-20 container-fluid container-fixed-lg bg-white">
          <div className="row dashboard">
            <div className="col-lg-12">
              <div className="card card-transparent">
                <div className="card-header ">
                  <div className="card-title">
                    <Link to={'/app/networks/' + this.props.match.params.id}>
                      {' '}
                      Control Panel <i className="fa fa-angle-right" />
                    </Link>{' '}
                    Audit Trail
                  </div>
                </div>
                <div className="card-block">
                  <div className="card card-transparent ">
                    {this.props.network.length === 1 && (
                      <div>
                        {this.props.network[0].assetsContractAddress === '' && <div>Please deploy smart contract</div>}
                        {this.props.network[0].assetsContractAddress !== undefined && this.props.network[0].assetsContractAddress !== '' && (
                          <div
                            onSubmit={e => {
                              this.downloadReport(e, this.props.network[0].instanceId);
                            }}
                          >
                            <form role="form">
                              <div className="form-group">
                                <label>Asset Name</label>
                                <span className="help"> e.g. "License"</span>
                                <select
                                  className="form-control"
                                  required
                                  ref={input => {
                                    this['_auditReport_assetName'] = input;
                                  }}
                                >
                                  {this.state.assetTypes.map(item => {
                                    if (item.type === 'solo') {
                                      return (
                                        <option key={item.assetName} value={item.assetName}>
                                          {item.assetName}
                                        </option>
                                      );
                                    }
                                  })}
                                </select>
                              </div>
                              <div className="form-group">
                                <label>Unique Identifier</label>
                                <span className="help"> e.g. "213213"</span>
                                <input
                                  type="text"
                                  className="form-control"
                                  required
                                  ref={input => {
                                    this['_auditReport_uniqueIdentifier'] = input;
                                  }}
                                />
                              </div>

                              {this.state['_auditReport_formSubmitError'] && (
                                <div className="row m-t-30">
                                  <div className="col-md-12">
                                    <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                                      <button className="close" data-dismiss="alert" />
                                      {this.state['_auditReport_formSubmitError']}
                                    </div>
                                  </div>
                                </div>
                              )}

                              <LaddaButton
                                loading={this.state._auditReport_formloading}
                                data-size={S}
                                data-style={SLIDE_UP}
                                data-spinner-size={30}
                                data-spinner-lines={12}
                                className="btn btn-success m-t-10"
                                type="submit"
                              >
                                <i className="fa fa-download" aria-hidden="true" />
                                &nbsp;&nbsp;Download Report
                              </LaddaButton>
                            </form>
                          </div>
                        )}
                      </div>
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

export default withTracker(props => {
  return {
    network: Networks.find({ instanceId: props.match.params.id, active: true }).fetch(),
    subscriptions: [
      Meteor.subscribe('networks', {
        onReady: function() {
          if (Networks.find({ instanceId: props.match.params.id, active: true }).fetch().length !== 1) {
            props.history.push('/app/networks');
          }
        },
      }),
    ],
  };
})(withRouter(AssetsAudit));
