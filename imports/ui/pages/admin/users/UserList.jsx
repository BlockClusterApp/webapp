import React, {Component} from "react";
import {withTracker} from "meteor/react-meteor-data";
import {withRouter} from 'react-router-dom'
import moment from 'moment';


const PAGE_LIMIT = 10;
class UserList extends Component {

    constructor(props){
        super(props);

        this.state = {
            locations: [],
            page: 0,
            users: []
        }

        this.query = {};
    }

    componentWillUnmount() {
        this.props.subscriptions.forEach((s) =>{
            s.stop();
        });
        this.userSubscription.stop();
    }


	componentDidMount(){
    this.search();
  }


  search = () => {
    this.userSubscription = Meteor.subscribe("users.search", {
      query: this.query
    }, {
      onReady: () => {
        this.setState({
          users: Meteor.users.find(this.query).fetch(),
        });
      }
    })
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
        {"profile.firstName": {$regex: `${searchQuery}*`, $options: "i"} },
        {"profile.lastName": {$regex: `${searchQuery}*`, $options: "i"} },
        {_id: {$regex: `${searchQuery}*`, $options: "i"} },
        {"emails.address": {$regex: `${searchQuery}*`, $options: "i"} }
      ];
    this.search();
  }


  onEmailVerificationChange = (e) => {
    const value = e.target.value;
    if(value === "all"){
      delete this.query["emails.verified"];
    } else if(value === "verified") {
      this.query["emails.verified"] = true;
    } else if(value === "unverified") {
      this.query["emails.verified"] = false;
    }
    this.search();
  }

  changePage = (pageOffset) => {
    if(this.state.page + pageOffset < 0){
      return;
    }
    this.userSubscription.stop();
    this.userSubscription =  Meteor.subscribe("users.all", {page: this.state.page + pageOffset}, {
      onReady: () => {
        const page = this.state.page + pageOffset;
        this.setState({
          users: Meteor.users.find({/*createdAt: {$ne: null}*/}, {limit: PAGE_LIMIT, skip: 10 * page}).fetch(),
          page
        });
      }
    })
  }


  openUser = (userId) => {
    this.props.history.push("/admin/app/users/" + userId);
}

  getEmailVerificationLabel = (verification) => {
    if(verification) {
      return <span className="label label-success">Yes</span>
    } else {
      return <span className="label label-important">No</span>
    }
  };


	render(){
		return (
            <div className="content networksList">
                <div className="m-t-20 container-fluid container-fixed-lg bg-white" style={{marginLeft: '25px', marginRight: '25px'}}>
                    <div className="row">
                        <div className="col-lg-12">
                            <div className="card card-transparent">
                                <div className="card-header ">
                                    <div className="card-title">Users
                                    </div>
                                    <div className="row">
                                    <div className="col-md-9">
                                    <div className="input-group transparent">
                                      <span className="input-group-addon">
                                          <i className="fa fa-search"></i>
                                      </span>
                                      <input type="text" placeholder="User name, email or id" className="form-control" onChange={this.onSearch} />
                                    </div>
                                    </div>
                                    <div className="col-md-3">
                                      <div className="form-group ">
                                        <select className="full-width select2-hidden-accessible" data-init-plugin="select2" tabIndex="-1" aria-hidden="true" onChange={this.onEmailVerificationChange}>
                                            <option value="all">Email: All</option>
                                            <option value="verified">Verified</option>
                                            <option value="unverified">Not Verified</option>
                                        </select>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="card-block">
                                    <div className="table-responsive">
                                        <table className="table table-hover" id="basicTable">
                                            <thead>
                                                <tr>
                                                    <th style={{width: "5%"}}>S.No</th>
                                                    {/* <th style={{width: "15%"}}>Id</th> */}
                                                    <th style={{width: "30%"}}>Name</th>
                                                    <th style={{width: "33%"}}>Email</th>
                                                    <th style={{width: "12%"}}>Email Verified</th>
                                                    <th style={{width: "20%"}}>Created on</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                              {
                                                this.state.users.map((user, index) => {
                                                  return (
                                                    <tr key={index+1} onClick={() => this.openUser(user._id)}>
                                                      <td>{this.state.page * PAGE_LIMIT + index+1}</td>
                                                      <td>{user.profile.firstName} {user.profile.lastName}</td>
                                                      <td>{user.emails[0].address}</td>
                                                      <td>{this.getEmailVerificationLabel(user.emails[0].verified)}</td>
                                                      <td>{moment(user.createdAt).format('DD-MMM-YYYY HH:mm:SS')}</td>
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
    return {
      users: Meteor.users.find({}).fetch(),
      subscriptions: [
        Meteor.subscribe("users.all", {page: 0})
      ]
    }
})(withRouter(UserList))
