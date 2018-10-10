import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter } from 'react-router-dom';
import notifications from '../../../../modules/notifications';
import Vouchers from '../../../../collections/vouchers/voucher';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';
import Toggle from 'react-toggle';
import 'react-toggle/style.css';
import Axios from 'axios';
import config from '../../../../modules/config/client'

Axios.defaults.baseURL = config.licensingMicroserviceBase;

Axios.defaults.headers.common['x-access-key']=0+new Date().setHours(new Date().getHours(), 0,0,0).toString()+1+Date.now()+000;

class ClientCreate extends Component {
  constructor(props) {
    super(props);

    this.state = {
        clientName:'',
        emailId:'',
        phone:'',
        genLicense:true,
        expire:3
    };
  }

  handleChanges = e => {
    this.setState({
      [e.target.name]: e.target.value,
    });
  };
  handleChangesToggle = e => {
    this.setState({
      [e.target.name]: e.target.checked,
    });
  };
  resetFrom = ()=>{
    this.setState({
        clientName:'',
        emailId:'',
        phone:'',
        genLicense:true,
        expire:3
    },()=>{
        notifications.success('resetting form');
    });
  };
  createClient =e =>{
    this.setState({
        createClient_formSubmitError: '',
        createClient_formloading: true,
      });
      const data = {
            "clientDetails": {
            "clientName": this.state.clientName,
            "emailId": this.state.emailId,
            "phone": this.state.phone
          },
          "license":{
              "gen_license":this.state.genLicense,
              "expire":this.state.expire
          }
      };
      
   Axios.post('/client/create_client',data).then(saved=>{
    this.setState({
        ['createClient_formloading']: false,
        ['createClient_formSubmitError']: '',
      });
    console.log(saved);
    this.resetFrom()
    notifications.success('Client Added');
   }).catch(error=>{
    this.setState({
        ['createClient_formloading']: false,
        ['createClient_formSubmitError']: '',
      });
       console.log(error);
    notifications.error('Error occured')
   });
  }
  render() {
    return (
      <div className="content VoucherCreate">
        <div className="m-t-20 container-fluid container-fixed-lg bg-white">
          <div className="row">
            <div className="card-block">
              <div className="form-group">
              <label>Client Details</label>
                <div className="row">
                  <div className="col-md-4 form-input-group">
                    <label>Client Name</label>
                    <input
                      name="clientName"
                      type="text"
                      placeholder="Full Name"
                      className="form-control"
                      onChange={this.handleChanges.bind(this)}
                      value={this.state.clientName}
                      required
                    />
                  </div>
                  <div className="col-md-4 form-input-group">
                    <label>Client Email</label>
                    <span className="help"> e.g. joe@blockcluster.io </span>
                    <input
                      name="emailId"
                      type="text"
                      placeholder="Email"
                      className="form-control"
                      onChange={this.handleChanges.bind(this)}
                      value={this.state.emailId}
                      required
                    />
                  </div>
                  <div className="col-md-4 form-input-group">
                    <label>Client Phone</label>
                    <span className="help"> e.g. +1 8373886873  </span>
                    <input
                      name="phone"
                      type="text"
                      placeholder="phone"
                      className="form-control"
                      onChange={this.handleChanges.bind(this)}
                      value={this.state.phone}
                      required
                      // value={this.state.networkConfig.cpu}
                    />
                  </div>
                </div>
                <br />
                <label>License</label>
                <div className="row">
                <div className="col-md-4 form-input-group">
                    <label>License Generate Now</label>
                    <Toggle name="genLicense" className="form-control" icons={false} checked={this.state.genLicense} onChange={this.handleChangesToggle.bind(this)} />
                </div>{this.state.genLicense && (
                  <div className="col-md-4 form-input-group">
                    <label>License Expiry After </label>
                    <span className="help">  [in Months]</span>
                    <input
                      name="expire"
                      type="number"
                      placeholder="no of months"
                      className="form-control"
                      onChange={this.handleChanges.bind(this)}
                      value={this.state.expire}
                      required
                      // value={this.state.networkConfig.cpu}
                    />
    </div>)}
                </div>
              </div>
              <LaddaButton
                disabled={(this.state.clientName.length > 0  && this.state.emailId.length>0 && this.state.phone.length>0) ? false : true}
                loading={this.state.createClient_formloading ? this.state.createClient_formloading : false}
                data-size={S}
                data-style={SLIDE_UP}
                data-spinner-size={30}
                data-spinner-lines={12}
                className="btn btn-success m-t-10"
                onClick={this.createClient.bind(this)}
              >
                <i className="fa fa-plus-circle" aria-hidden="true" />
                &nbsp;&nbsp;Create
              </LaddaButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

}
export default withTracker(() => {
    return {
    };
  })(withRouter(ClientCreate));