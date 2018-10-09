import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter, Link } from 'react-router-dom';
import axios from 'axios';
import config from '../../../../modules/config/client'

axios.defaults.baseURL = config.licensingMicroserviceBase;
axios.defaults.headers.common['x-access-key']=0+new Date().setHours(new Date().getHours(), 0,0,0).toString()+1+Date.now()+000;
class ClientDetails extends Component {
  constructor(props) {
    super(props);

    this.state = {
      formattedData: [],
    };
    this.query = {};
  }

  componentWillMount() {
    this.setState({
      voucherId: this.props.match.params.id,
    });
    this.query = { _id: this.props.match.params.id };
    this.getClientDetails();
  }
  getClientDetails() {
    return axios.get('/client/filter?query='+JSON.stringify(this.query)).then(data=>{
          const i = data.data[0];
          const formattedData = {
            'Name':i.clientDetails.clientName,
            'Email': i.clientDetails.emailId,
            'Phone': i.clientDetails.phone,
            'Licence Key': i.licenseDetails ? i.licenseDetails.licenseKey : '-',
            'Licence Created':i.licenseDetails ? new Date(i.licenseDetails.licenseCreated).toLocaleDateString() + ' ' + new Date(i.licenseDetails.licenseCreated).toLocaleTimeString(): '-',
            'License Expiry': i.licenseDetails ? new Date(i.licenseDetails.licenseExpiry).toLocaleDateString() + ' ' + new Date(i.licenseDetails.licenseExpiry).toLocaleTimeString(): '-',
          };
          const updatedData = Object.keys(formattedData).map(i => {
            return { [i]: formattedData[i] };
          });
          this.setState(
            {
              formattedData: updatedData,
            },
            () => {
              console.log(this.state.formattedData);
            }
          );
          console.log(this.state.formattedData);
        
        })
    
  }

  render() {
    return (
       <div className="page-content-wrapper">
        <div className="content sm-gutter" style={{paddingBottom: '0'}}>
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
                  <li className="breadcrumb-item active">{this.state.voucherId}</li>
                </ol>
              {/* </div> */}
            </div>
          </div></div>
          <div className="content ClientDetails" style={{paddingTop: '0'}}>
           <div
          className="m-t-20 container-fluid container-fixed-lg bg-white"
        >
            <div className="card-block">
              <div className="table-responsive">
                <table className="table table-hover table-condensed" id="condensedTable">
                  <thead>
                    <tr>
                      <th style={{ width: '30%' }}>Options</th>
                      <th style={{ width: '70%' }}>Desctiption</th>
                    </tr>
                  </thead>
                  <tbody>
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
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div></div>
    );
  }
}

export default withTracker(() => {
  return {};
})(withRouter(ClientDetails));
