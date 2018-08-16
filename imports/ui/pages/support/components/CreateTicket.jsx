import React from 'react';
import { Networks } from '../../../../collections/networks/networks'
import {withRouter} from 'react-router-dom'
import LaddaButton, { S, SLIDE_UP } from "react-ladda";
import { withTracker } from 'meteor/react-meteor-data';

import './CreateTicket.scss';

class CreateTicket extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  componentWillUnmount() {
    this.props.subscriptions.forEach(s => s.stop());
  }

  validate(){
    const state = {
      regardingError: null,
      serviceError: null,
      subjectError: null,
      descriptionError: null
    };
    let error = false;
    if(!this.state.regarding) {
      error = true;
      state.regardingError = 'Required'
    }
    if(this.state.regarding === 'technical' && this.serviceType.value === 'network' && this.networkId.value === 'select'){
      error = true;
      state.serviceError = 'Network is required';
    }

    if(!this.subject.value) {
      error = true;
      state.subjectError = 'Required';
    } else if(this.subject.value.length >= 80) {
      error = true;
      state.subjectError = "Can be maximum of 80 characters long"
    }

    if(!this.description.value) {
      error = true;
      state.descriptionError = 'Required';
    }

    this.setState(state);

    return !error;
  }

  getServiceTypeId = () => {
    if(this.serviceType.value === 'network') {
      return this.networkId.value;
    }
    return undefined;
  }

  createTicket = () => {
    if(this.validate()){
      this.setState({
        loading: true
      });
      const details = {
        subject: this.subject.value,
        description: this.description.value,
        ticketType: this.state.regarding
      }

      if(this.state.regarding === 'technical' && this.serviceType && this.serviceType.value) {
        details.supportObject = {
          serviceType: this.serviceType.value,
          serviceTypeId: this.getServiceTypeId()
        };
      }

      Meteor.call("createSupportTicket", details, (err, res) => {
        if(err){
          return this.setState({
            loading: false,
            error: true,
            message: err.error
          });
        }
        this.setState({
          loading: false
        })
        this.props.history.push(`/app/support/${res}`);
      });
    }
  }

  render() {
    const name = this.props.user && this.props.user.profile ? `${this.props.user.profile.firstName} ${this.props.user.profile.lastName} <${this.props.user.emails[0].address}>` : null;
    const networks = this.props.networks && this.props.networks.map(network => {
      return <option value={network._id} key={network.instanceId}>{network.name} - {network.instanceId}</option>
    });
    return (
      <div className="row padding-25 createTicket">
        <div className="card card-transparent">
          <h3 style={{fontWeight: '800'}}>Create Ticket</h3>
          <p><b>User:</b> {name}</p>
          <div><label><b>Regarding:</b></label>&nbsp;&nbsp;
            <div className="radio radio-success" style={{display: "inline"}}>
              <input type="radio" value="account" name="regarding" id="accounts" onChange={(e) => this.setState({regarding: 'accounts'})}/>
              <label htmlFor="accounts">Accounts And Billing</label>
              <input type="radio" value="technical" name="regarding" id="technical" onChange={(e) => this.setState({regarding: 'technical'})} disabled/>
              <label htmlFor="technical">Technical Support &nbsp; (<span style={{fontSize: '0.8em'}}>Not available in free plan</span>)</label>
              {this.state.regardingError && <span className="form-error">{this.state.regardingError}</span>}
            </div>
          </div>
          {this.state.regarding === 'technical' && <div className="row">
            <div className="col-md-6">
              <label><b>Service:</b></label>
              <select className="form-control" ref={(input) => {this.serviceType = input;}} onChange={() => this.setState({})}>
                <option value="general">General Guidance</option>
                <option value="network">Networks</option>
                <option value="smart-contract">Smart Contracts</option>
              </select>
            </div>
            {this.serviceType && this.serviceType.value === "network" &&
              <div className="col-md-6">
                <label><b>Network Name:</b></label>
                <select className="form-control" ref={(input) => {this.networkId = input;}}>
                  <option value="select">Select Network</option>
                  {networks}
                </select>
                {this.state.serviceError && <span className="form-error">{this.state.serviceError}</span>}
              </div>
            }
          </div>}
          <div className="row">
            <div className="form-group col-md-12">
              <label>Subject</label>
              <input type="text" className="form-control" ref={input => this.subject = input} required placeholder="A one liner description" />
              {this.state.subjectError && <span className="form-error">{this.state.subjectError}</span>}
            </div>
          </div>
          <div className="row">
            <div className="form-group col-md-12">
              <label>Description</label>
              <textarea type="text" className="form-control" ref={input => this.description = input} required style={{minHeight: '250px'}} placeholder="Detailed description"/>
              {this.state.descriptionError && <span className="form-error">{this.state.descriptionError}</span>}
              {this.state.error && <span className="form-error">{this.state.message}</span>}
            </div>
          </div>
          <div className="row">
            <div className="col-md-4">
              <LaddaButton
                loading={this.state.loading}
                data-size={S}
                disabled={this.state.loading}
                data-style={SLIDE_UP}
                data-spinner-size={30}
                data-spinner-lines={12}
                className="btn btn-success"
                onClick={this.createTicket}
                type="submit"
            >
                <i className="fa fa-plus-circle" aria-hidden="true"></i>&nbsp;&nbsp;Submit
              </LaddaButton>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default withTracker(() => {
   return {
     networks: Networks.find().fetch(),
     user: Meteor.user(),
     subscriptions: [Meteor.subscribe("networks")]
   }
})(withRouter(CreateTicket));
