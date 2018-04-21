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

	componentDidMount() {
		$.Pages.init();
	}

	componentDidUpdate() {
		$.Pages.init();
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
	                    	<Link to={"/app/networks"} className="detailed">
	                    		<span className="title">Networks</span>
	                        	<span className="details">List of Nodes</span>
	                    	</Link>
	                        <span className="icon-thumbnail"><i className="fa fa-list"></i></span>
	                    </li>
	                    <li className="">
		                    <Link to={"http://blockcluster.io:5001/ipfs/QmPhnvn747LqwPYMJmQVorMaGbMSgA7mRRoyyZYz3DoZRQ/#/home"} target="_blank" className="detailed">
	                    		<span className="title">IPFS</span>
	                        	<span className="details">Store Files</span>
	                    	</Link>
	                        <span className="icon-thumbnail"><i className="fa fa-database"></i></span>
	                    </li>
						<li className="">
			            	<a href="javascript:;"><span className="title">Security</span>
			              	<span className="arrow"></span></a>
			              	<span className="icon-thumbnail"><i className="fa fa-lock"></i></span>
			              	<ul className="sub-menu">
								<li>
									<Link to={"/app/security/peers"}>
			                    		Peers
			                    	</Link>
			                  		<span className="icon-thumbnail"><i className="fa fa-globe"></i></span>
			                	</li>
								<li>
									<Link to={"/app/security/apis-creds"}>
			                    		APIs Creds
			                    	</Link>
			                  		<span className="icon-thumbnail"><i className="fa fa-unlock-alt"></i></span>
			                	</li>
			              	</ul>
			            </li>
						<li className="">
			            	<a href="javascript:;"><span className="title">Assets</span>
			              	<span className="arrow"></span></a>
			              	<span className="icon-thumbnail"><i className="fa fa-connectdevelop"></i></span>
			              	<ul className="sub-menu">
			                	<li>
									<Link to={"/app/assets/create"}>
			                    		Create Asset Type
			                    	</Link>
			                  		<span className="icon-thumbnail"><i className="fa fa-plus-square"></i></span>
			                	</li>
								<li>
									<Link to={"/app/assets/management"}>
			                    		Management
			                    	</Link>
			                  		<span className="icon-thumbnail"><i className="fa fa-braille"></i></span>
			                	</li>
								<li>
									<Link to={"/app/assets/stats"}>
			                    		Stats
			                    	</Link>
			                  		<span className="icon-thumbnail"><i className="fa fa-signal"></i></span>
			                	</li>
								<li>
									<Link to={"/app/assets/exchange"}>
			                    		Exchange
			                    	</Link>
			                  		<span className="icon-thumbnail"><i className="fa fa-exchange"></i></span>
			                	</li>
								<li className="">
									<Link to={"/app/assets/apis"}>
			                    		APIs
			                    	</Link>
			                  		<span className="icon-thumbnail"><i className="fa fa-code"></i></span>
			                	</li>
								<li className="">
									<Link to={"/app/assets/events"}>
			                    		Events
			                    	</Link>
			                  		<span className="icon-thumbnail"><i className="fa fa-bell"></i></span>
			                	</li>
			              	</ul>
			            </li>
						<li className="">
	                    	<Link to={"/app/explorer"} className="detailed">
								<span className="title">Explorer</span>
								<span className="details">View Blockchain Txns</span>
	                    	</Link>
	                        <span className="icon-thumbnail"><i className="fa fa-eye"></i></span>
	                    </li>
						{(this.props.kuberREST_IP[0] !== undefined) &&
	                    	<li className="">
		                    	<Link target="_blank" to={"http://" + this.props.kuberREST_IP[0].value + ":8000/api/v1/namespaces/kube-system/services/https:kubernetes-dashboard:/proxy/#!/overview?namespace=default"} className="detailed">
		                    		<span className="title">Kubernetes</span>
		                        	<span className="details">View Infrastructure</span>
		                    	</Link>
		                        <span className="icon-thumbnail"><i className="fa fa-cubes"></i></span>
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
        kuberREST_IP: Utilities.find({"name": "kuberREST_IP"}).fetch(),
        subscriptions: [Meteor.subscribe("utilities")]
    }
})(Navbar)
