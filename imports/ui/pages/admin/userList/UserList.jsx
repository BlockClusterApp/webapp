import React, {Component} from "react";
import {withTracker} from "meteor/react-meteor-data";
import {Networks} from "../../../../collections/networks/networks.js"
import helpers from "../../../../modules/helpers"
import {withRouter} from 'react-router-dom'
import { ReactiveVar } from 'meteor/reactive-var'
import moment from 'moment';


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
    }


	componentDidMount(){
		Meteor.call("getClusterLocations", (err, res) => {
			this.setState({
			  locations: res
			});
    });

    Meteor.subscribe("users.all", this.state.page, {
      onReady: () => {
        this.setState({
          users: Meteor.users.find({}).fetch()
        });
      }
    });
  }


	render(){
		return (
            <div className="content networksList">
                <div className="m-t-20 container-fluid container-fixed-lg bg-white">
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
                                                    <th style={{width: "18%"}}>Email Verified</th>
                                                    <th style={{width: "17%"}}>Admin</th>
                                                    <th style={{width: "20%"}}>Created on</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                              {
                                                this.state.users.map((user, index) => {
                                                  return (
                                                    <tr key={index+1}>
                                                      <td>{index+1}</td>
                                                      <td>{user._id}</td>
                                                      <td>{user.profile.firstName} {user.profile.lastName}</td>
                                                      <td>{user.emails[0].verified ? "Yes" : "No"}</td>
                                                      <td>{user.admin}</td>
                                                      <td>{moment(user.createdAt).format('DD-MMM-YYYY HH:mm:SS')}</td>
                                                    </tr>
                                                  )
                                                })
                                              }
                                            </tbody>
                                        </table>
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
        Meteor.subscribe("users.all", 0)
      ]
    }
})(withRouter(UserList))
