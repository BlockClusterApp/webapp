import React, {Component} from "react";
import {withTracker} from "meteor/react-meteor-data";
import {Networks} from "../../../../collections/networks/networks.js"
import helpers from "../../../../modules/helpers"
import {withRouter} from 'react-router-dom'
import { ReactiveVar } from 'meteor/reactive-var'
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
    }

    componentWillUnmount() {
        this.props.subscriptions.forEach((s) =>{
            s.stop();
        });
        this.userSubscription.stop();
    }


	componentDidMount(){
		Meteor.call("getClusterLocations", (err, res) => {
			this.setState({
			  locations: res
			});
    });


    this.userSubscription = Meteor.subscribe("users.all", {page: this.state.page}, {
      onReady: () => {
        this.setState({
          users: Meteor.users.find().fetch()
        });
      }
    });
  }

  changePage = (pageOffset) => {
    if(this.state.page + pageOffset < 0){
      return;
    }
    this.userSubscription.stop();
    this.userSubscription =  Meteor.subscribe("users.all", {page: this.state.page + pageOffset}, {
      onReady: () => {
        const page = this.state.page + pageOffset;
        const users = Meteor.users.find({/*createdAt: {$ne: null}*/}, {limit: PAGE_LIMIT, skip: 10 * page}).fetch();
        const allUsers = Meteor.users.find({}).fetch();
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
                                </div>
                                <div className="card-block">
                                    <div className="table-responsive">
                                        <table className="table table-hover" id="basicTable">
                                            <thead>
                                                <tr>
                                                    <th style={{width: "5%"}}>S.No</th>
                                                    <th style={{width: "15%"}}>Id</th>
                                                    <th style={{width: "25%"}}>Name</th>
                                                    <th style={{width: "23%"}}>Email</th>
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
                                                      <td>{user._id}</td>
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
