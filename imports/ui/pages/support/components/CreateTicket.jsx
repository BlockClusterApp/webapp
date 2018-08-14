import React from 'react';
import { Networks } from '../../../../collections/networks/networks'
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
              <input type="radio" value="technical" name="regarding" id="technical" onChange={(e) => this.setState({regarding: 'technical'})}/>
              <label htmlFor="technical">Technical Support</label>
            </div>
          </div>
          {this.state.regarding === 'technical' && <div className="row">
            <div className="col-md-6">
              <label><b>Service:</b></label>
              <select className="form-control" ref={(input) => {this.serviceType = input;}} onChange={() => this.setState({})}>
                <option value="select">Select Service</option>
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
              </div>
            }
          </div>}
          <div className="row">
            <div class="form-group col-md-12">
              <label>Subject</label>
              <input type="text" class="form-control" ref={input => this.subject = input} required />
            </div>
          </div>
          <div className="row">
            <div class="form-group col-md-12">
              <label>Description</label>
              <textarea type="text" class="form-control" ref={input => this.description = input} required style={{minHeight: '250px'}}/>
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
})(CreateTicket);
