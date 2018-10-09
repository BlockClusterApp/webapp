import React, { Component } from "react";
import { Link } from "react-router-dom";
import { withTracker } from "meteor/react-meteor-data";
import Config from "../../../modules/config/client";

class Navbar extends Component {
    componentWillUnmount() {
        this.props.subscriptions.forEach(s => {
            s.stop();
        });
    }

    componentDidMount() {
        $.Pages.init();
    }

    componentDidUpdate() {
        $.Pages.init();
    }

    render() {
        return (
            <nav className="page-sidebar" data-pages="sidebar">
                <div className="sidebar-overlay-slide from-top" id="appMenu">
                    <div className="row">
                        <div className="col-xs-6 no-padding">
                            <a href="#" className="p-l-40">
                                <img
                                    src="assets/img/demo/social_app.svg"
                                    alt="socail"
                                />
                            </a>
                        </div>
                        <div className="col-xs-6 no-padding">
                            <a href="#" className="p-l-10">
                                <img
                                    src="assets/img/demo/email_app.svg"
                                    alt="socail"
                                />
                            </a>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-xs-6 m-t-20 no-padding">
                            <a href="#" className="p-l-40">
                                <img
                                    src="assets/img/demo/calendar_app.svg"
                                    alt="socail"
                                />
                            </a>
                        </div>
                        <div className="col-xs-6 m-t-20 no-padding">
                            <a href="#" className="p-l-10">
                                <img
                                    src="assets/img/demo/add_more.svg"
                                    alt="socail"
                                />
                            </a>
                        </div>
                    </div>
                </div>
                <div className="sidebar-header">
                    <img
                        src="assets/img/logo/blockcluster-bw.png"
                        alt="logo"
                        className="brand"
                        width="78"
                        height="22"
                    />
                    <div className="sidebar-header-controls">
                        <button
                            type="button"
                            className="btn btn-xs sidebar-slide-toggle btn-link m-l-20 hidden-md-down"
                            data-pages-toggle="#appMenu"
                        >
                            <i className="fa fa-angle-down fs-16" />
                        </button>
                        <button
                            type="button"
                            className="btn btn-link hidden-md-down"
                            data-toggle-pin="sidebar"
                        >
                            <i className="fa fs-12" />
                        </button>
                    </div>
                </div>
                <div className="sidebar-menu">
                    <ul className="menu-items">
                        <li className="m-t-30 ">
                            <Link to={"/app/networks"} className="detailed">
                                <span className="title">Networks</span>
                                <span className="details">Dynamo Management</span>
                            </Link>
                            <span className="icon-thumbnail">
                                <i className="fa fa-list" />
                            </span>
                        </li>
                        <li>
                            <Link to={"/app/hyperion"} className="detailed">
                                <span className="title">Files</span>
                                <span className="details">Upload on Hyperion</span>
                            </Link>
                            <span className="icon-thumbnail">
                                <i className="fa fa-file" />
                            </span>
                        </li>
                        {/* {(this.props.kuberREST_IP[0] !== undefined) &&
							<li className="">
			                    <Link to={this.props.kuberREST_IP.split("://")[1].split(":")[0] + ":5001/ipfs/QmPhnvn747LqwPYMJmQVorMaGbMSgA7mRRoyyZYz3DoZRQ/#/home"} target="_blank" className="detailed">
		                    		<span className="title">IPFS</span>
		                        	<span className="details">Store Files</span>
		                    	</Link>
		                        <span className="icon-thumbnail"><i className="fa fa-database"></i></span>
		                    </li>
						} */}
                        <li className="">
                            <a href="javascript:;">
                                <span className="title">Settings</span>
                                <span className="arrow" />
                            </a>
                            <span className="icon-thumbnail">
                                <i className="fa fa-cogs" />
                            </span>
                            <ul className="sub-menu">
                                <li>
                                    <Link to={"/app/notifications"}>
                                        Notifications
                                    </Link>
                                    <span className="icon-thumbnail">
                                        <i className="fa fa-bell" />
                                    </span>
                                </li>
                            </ul>
                        </li>
                        <li>
                            <a href="javascript:;">
                                <span className="title">Billing</span>
                                <span className="arrow" />
                            </a>
                            <span className="icon-thumbnail">
                                <i className="fa fa-credit-card" />
                            </span>
                            <ul className="sub-menu">
                                <li>
                                    <Link to="/app/payments">Payments</Link>
                                    <span className="icon-thumbnail">
                                        <i className="fa fa-money" />
                                    </span>
                                </li>
                                <li>
                                    <Link to="/app/billing">Bills</Link>
                                    <span className="icon-thumbnail">
                                        <i className="fa fa-list-alt" />
                                    </span>
                                </li>
                                <li>
                                    <Link to="/app/support">Support</Link>
                                    <span className="icon-thumbnail">
                                        <i className="fa fa-ticket" />
                                    </span>
                                </li>
                            </ul>
                        </li>
                        {this.props.user &&
                            this.props.user.admin >= 1 && (
                                <li>
                                    <a href="javascript:;">
                                        <span className="title">Admin</span>
                                        <span className="arrow" />
                                    </a>
                                    <span className="icon-thumbnail">
                                        <i className="fa fa-user-md" />
                                    </span>
                                    <ul className="sub-menu">
                                        <li>
                                            <Link to="/app/admin/users">Users</Link>
                                            <span className="icon-thumbnail">
                                                <i className="fa fa-users" />
                                            </span>
                                        </li>
                                        <li>
                                            <Link to="/app/admin/networks">Networks</Link>
                                            <span className="icon-thumbnail">
                                                <i className="fa fa-desktop" />
                                            </span>
                                        </li>
                                        <li>
                                            <Link to="/app/admin/vouchers">Vouchers</Link>
                                            <span className="icon-thumbnail">
                                                <i className="fa fa-tags" />
                                            </span>
                                        </li>
                                        <li>
                                            <Link to="/app/admin/support">Support</Link>
                                            <span className="icon-thumbnail">
                                                <i className="fa fa-ticket" />
                                            </span>
                                        </li>
                                        <li>
                                            <Link to="/app/admin/clients">Clients</Link>
                                            <span className="icon-thumbnail">
                                                <i className="fa fa-users" />
                                            </span>
                                        </li>
                                    </ul>
                                </li>
                            )
                        }

                        {/* (this.props.kuberREST_IP[0] !== undefined) &&
	                    	<li className="">
		                    	<Link target="_blank" to={this.props.kuberREST_IP + "/api/v1/namespaces/kube-system/services/https:kubernetes-dashboard:/proxy/#!/overview?namespace=default"} className="detailed">
		                    		<span className="title">Infrastructure</span>
		                        	<span className="details">View Kubernetes</span>
		                    	</Link>
		                        <span className="icon-thumbnail"><i className="fa fa-cubes"></i></span>
		                    </li>
                      */}

                    </ul>
                    <div className="clearfix" />
                </div>
            </nav>
        );
    }
}

export default withTracker(() => {
    return {
        kuberREST_IP: Config.kubeRestApiHost,
        subscriptions: [Meteor.subscribe("utilities")],
        user: Meteor.user()
    };
})(Navbar);
