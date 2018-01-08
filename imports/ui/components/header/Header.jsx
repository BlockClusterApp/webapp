import React, {Component} from "react";
import {Link} from "react-router-dom"
import createHistory from "history/createBrowserHistory";
import {withTracker} from "meteor/react-meteor-data";

class Navbar extends Component {
    logout = () => {
        Meteor.logout()
    }

	render(){
		return (
			<div className="header ">
                <a href="#" className="btn-link toggle-sidebar hidden-lg-up pg pg-menu" data-toggle="sidebar">
                </a>
                <div className="">
                    <div className="brand inline  m-l-10 m-r-5">
                        <img src="/assets/img/logo/black_left_img.png" alt="logo" height="35" />
                    </div>
                    <ul className="hidden-md-down notification-list no-margin hidden-sm-down b-grey b-l no-style p-l-30 p-r-20">
                        <li className="p-r-10 inline">
                            <Link to={"/app/create"} className="header-icon fa fa-plus"></Link>
                        </li>
                        <li className="p-r-10 inline">
                            <a href="#" className="header-icon fa fa-group"></a>
                        </li>
                        <li className="p-r-10 inline">
                            <a href="#" className="header-icon fa fa-book"></a>
                        </li>
                    </ul>
                </div>
                <div className="d-flex align-items-center">
                    <div className="pull-left p-r-10 fs-14 font-heading hidden-md-down">
                        <span className="semi-bold">{this.props.user?this.props.user.profile.firstName:''}</span> <span className="text-master">{this.props.user?this.props.user.profile.lastName:''}</span>
                    </div>
                    <div className="dropdown pull-right hidden-md-down">
                        <button className="profile-dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                            <span className="thumbnail-wrapper d32 circular inline">
                                <img src="/assets/img/icons/profile.png" alt="" width="32" height="32" />
                            </span>
                        </button>
                    </div>
                    <a href="#" onClick={this.logout} className="header-icon pg pg-power btn-link m-l-10 sm-no-margin d-inline-block" data-toggle="quickview" data-toggle-element="#quickview"></a>
                </div>
            </div>
		)
	}
}

export default withTracker(() => {
    return {
        user: Meteor.user()
    }
})(Navbar)