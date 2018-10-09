import React, {Component} from "react";
import {withTracker} from "meteor/react-meteor-data";
import {withRouter} from 'react-router-dom'
import moment from 'moment';
import axios from 'axios';
import config from '../../../../modules/config/client'

axios.defaults.baseURL = config.licensingMicroserviceBase;

axios.defaults.headers.common['x-access-key']=0+new Date().setHours(new Date().getHours(), 0,0,0).toString()+1+Date.now()+000;

const PAGE_LIMIT = 10;
class ClientList extends Component {

    constructor(props){
        super(props);

        this.state = {
            page: 0,
            clients: []
        }

        this.query = {};
    }

    // componentWillUnmount() {
    //     this.props.subscriptions.forEach((s) =>{
    //         s.stop();
    //     });
    //     this.userSubscription.stop();
    // }


	componentWillMount(){
    this.search();
  }


  search = () => {
   return axios.get('/client/filter?query='+JSON.stringify(this.query)).then(data=>{
      this.setState({
        clients: data.data,
      },()=>{
        console.log(data)
        return;
      });
    }).catch(error=>{
      console.log(error)
    });
  }


  onSearch = (e) => {
    const searchQuery = e.target.value;
    if(!searchQuery) {
      delete this.query.$or;
      return this.changePage(0);
    }
    if(searchQuery.length <= 3){
      delete this.query.$or;
      return this.changePage(0);
    }
    this.query.$or = [
      {"clientDetails.clientName": {$regex: `${searchQuery}*`, $options: "i"} },
      {"clientDetails.emailId": {$regex: `${searchQuery}*`, $options: "i"} },
      {"licenseDetails.licenseKey": {$regex: `${searchQuery}*`, $options: "i"} },
      ];
    this.search();
  }


  changePage = (pageOffset) => {
    if(this.state.page + pageOffset < 0){
      return;
    }
    const page = this.state.page + pageOffset;
    axios.get('/client/filter?query='+JSON.stringify(this.query)+'&page='+page+'&limit='+PAGE_LIMIT)
    .then(data=>{
      this.setState({
        clients: data.data,
        page
      });
    }).catch(error=>{
      console.log(error)
    })
  }


  openUser = (clientId) => {
    this.props.history.push("/app/admin/clients/details/" + clientId);
}
getExpiryBadge = (client) => {
  if(client.licenseDetails && client.licenseDetails.licenseExpiry && new Date(client.licenseDetails.licenseExpiry) >= new Date()) {
    return <span className="label label-success">ACTIVE</span>
  } else if(client.licenseDetails && client.licenseDetails.licenseExpiry && new Date(client.licenseDetails.licenseExpiry) <= new Date()) {
    return <span className="label label-important">Expired</span>
  }else{
    return <span> - </span>
  }
};

	render(){
		return (
            <div className="content networksList">
                <div className="m-t-20 container-fluid container-fixed-lg bg-white" >
                    <div className="row">
                        <div className="col-lg-12">
                            <div className="card card-transparent">
                                <div className="card-header ">
                                    <div className="card-title">Clients
                                    </div>
                                    <div className="row">
                                    <div className="col-md-9">
                                    <div className="input-group transparent">
                                      <span className="input-group-addon">
                                          <i className="fa fa-search"></i>
                                      </span>
                                      <input type="text" placeholder="Client name, email or License Key" className="form-control" onChange={this.onSearch} />
                                    </div>
                                    </div>
                                    {/* can put some select bx here may be */}
                                  </div>
                                </div>
                                <div className="card-block">
                                    <div className="table-responsive">
                                        <table className="table table-hover" id="basicTable">
                                            <thead>
                                                <tr>
                                                    <th style={{width: "5%"}}>S.No</th>
                                                    {/* <th style={{width: "15%"}}>Id</th> */}
                                                    <th style={{width: "25%"}}>Name</th>
                                                    <th style={{width: "25%"}}>Email</th>
                                                    <th style={{width: "20%"}}>License Key</th>
                                                    <th style={{width: "10%"}}>License Status</th>
                                                    <th style={{width: "25%"}}>Created on</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                              {
                                                this.state.clients.map((client, index) => {
                                                  return (
                                                    <tr key={index+1} onClick={() => this.openUser(client._id)}>
                                                      <td>{this.state.page * PAGE_LIMIT + index+1}</td>
                                                      <td>{client.clientDetails.clientName}</td>
                                                      <td>{client.clientDetails.emailId}</td>
                                                      <td>{client.licenseDetails ? client.licenseDetails.licenseKey : '-'}</td>
                                                      <td>{this.getExpiryBadge(client)}</td>
                                                      <td>{moment(client.createdAt).format('DD-MMM-YYYY HH:mm:SS')}</td>
                                                    </tr>
                                                  )
                                                })
                                              }
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="pagination pull-right" style={{marginTop: '5px'}}>
                                      <nav aria-label="Page navigation example">
                                        <ul className="pagination">
                                          <li className="page-item"  onClick={ () => this.changePage(-1) }><a className="page-link">Previous</a></li>
                                          <li className="page-item" onClick={ () => this.changePage(1) }><a className="page-link">Next</a></li>
                                        </ul>
                                      </nav>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
		)
	}
}

export default withTracker(() => {
    return {};
})(withRouter(ClientList))
