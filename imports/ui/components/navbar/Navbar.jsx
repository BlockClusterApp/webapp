import React, {Component} from "react";
import {Link} from "react-router-dom"
import {withTracker} from "meteor/react-meteor-data";
import {Utilities} from "../../../collections/utilities/utilities.js"

class Navbar extends Component {
	componentWillUnmount() {
    	this.props.subscriptions.forEach((s) =>{
      		s.stop();
    	});
  	}

	render(){
		return (
			<nav className="page-sidebar" data-pages="sidebar">
	            <div className="sidebar-overlay-slide from-top" id="appMenu">
	                <div className="row">
	                    <div className="col-xs-6 no-padding">
	                        <a href="#" className="p-l-40"><img src="assets/img/demo/social_app.svg" alt="socail" />
	                        </a>
	                    </div>
	                    <div className="col-xs-6 no-padding">
	                        <a href="#" className="p-l-10"><img src="assets/img/demo/email_app.svg" alt="socail" />
	                        </a>
	                    </div>
	                </div>
	                <div className="row">
	                    <div className="col-xs-6 m-t-20 no-padding">
	                        <a href="#" className="p-l-40"><img src="assets/img/demo/calendar_app.svg" alt="socail" />
	                        </a>
	                    </div>
	                    <div className="col-xs-6 m-t-20 no-padding">
	                        <a href="#" className="p-l-10"><img src="assets/img/demo/add_more.svg" alt="socail" />
	                        </a>
	                    </div>
	                </div>
	            </div>
	            <div className="sidebar-header">
	                <img src="assets/img/logo/black_left_img.png" alt="logo" className="brand" width="78" height="22" />
	                <div className="sidebar-header-controls">
	                    <button type="button" className="btn btn-xs sidebar-slide-toggle btn-link m-l-20 hidden-md-down" data-pages-toggle="#appMenu"><i className="fa fa-angle-down fs-16"></i>
	                    </button>
	                    <button type="button" className="btn btn-link hidden-md-down" data-toggle-pin="sidebar"><i className="fa fs-12"></i>
	                    </button>
	                </div>
	            </div>
	            <div className="sidebar-menu">
	                <ul className="menu-items">
	                    <li className="m-t-30 ">
	                    	<Link to={"/app"} className="detailed">
	                    		<span className="title">Dashboard</span>
	                        	<span className="details">List of Nodes</span>
	                    	</Link>
	                        <span className="icon-thumbnail"><i className="fa fa-list"></i></span>
	                    </li>
	                    <li className="">
		                    <Link to={"http://localhost:5001/ipfs/QmPhnvn747LqwPYMJmQVorMaGbMSgA7mRRoyyZYz3DoZRQ/#/home"} target="_blank" className="detailed">
	                    		<span className="title">IPFS</span>
	                        	<span className="details">Store Files</span>
	                    	</Link>
	                        <span className="icon-thumbnail"><i className="fa fa-globe"></i></span>
	                    </li>
	                    <li className="">
	                        <a href="email.html" className="detailed">
	                        <span className="title">Assets</span>
	                        <span className="details">Create and Transfer</span>
	                        </a>
	                        <span className="icon-thumbnail"><i className="pg-note"></i></span>
	                    </li>
	                    {(this.props.minikubeIP[0] !== undefined) &&
	                    	<li className="">
		                    	<Link target="_blank" to={"http://" + this.props.minikubeIP[0].value + ":30000"} className="detailed">
		                    		<span className="title">Kubernetes</span>
		                        	<span className="details">View Infrastructure</span>
		                    	</Link>
		                        <span className="icon-thumbnail"><i className="pg-servers"></i></span>
		                    </li>
	                    }
	                </ul>
	                <div className="clearfix"></div>
	            </div>
	        </nav>
		)
	}
}

export default withTracker(() => {
    return {
        minikubeIP: Utilities.find({"name": "minikube-ip"}).fetch(),
        subscriptions: [Meteor.subscribe("utilities")]
    }
})(Navbar)
