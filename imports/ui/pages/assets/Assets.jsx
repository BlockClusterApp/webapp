import React, {Component} from "react";
import { withRouter } from 'react-router-dom'

class AssetsList extends Component {
    constructor() {
        super()

    }

	render(){
		return (
            <div className="content full-height">
                <nav className="secondary-sidebar">
                    <div className=" m-b-30 m-l-30 m-r-30 hidden-sm-down">
                        <a href="email_compose.html" className="btn btn-complete btn-block btn-compose">Compose</a>
                    </div>
                    <p className="menu-title">BROWSE</p>
                    <ul className="main-menu">
                        <li className="active">
                            <a href="#">
                            <span className="title"><i className="pg-inbox"></i> Inbox</span>
                            <span className="badge pull-right">5</span>
                            </a>
                        </li>
                        <li className="">
                            <a href="#">
                            <span className="title"><i className="pg-folder"></i> All mail</span>
                            </a>
                            <ul className="sub-menu no-padding">
                                <li>
                                    <a href="#">
                                    <span className="title">Important</span>
                                    </a>
                                </li>
                                <li>
                                    <a href="#">
                                    <span className="title">Labeled</span>
                                    </a>
                                </li>
                            </ul>
                        </li>
                        <li>
                            <a href="#">
                            <span className="title"><i className="pg-sent"></i> Sent</span>
                            </a>
                        </li>
                        <li>
                            <a href="#">
                            <span className="title"><i className="pg-spam"></i> Spam</span>
                            <span className="badge pull-right">10</span>
                            </a>
                        </li>
                    </ul>
                    <p className="menu-title m-t-20 all-caps">Quick view</p>
                    <ul className="sub-menu no-padding">
                        <li>
                            <a href="#">
                            <span className="title">Documents</span>
                            </a>
                        </li>
                        <li>
                            <a href="#">
                            <span className="title">Flagged</span>
                            <span className="badge pull-right">5</span>
                            </a>
                        </li>
                        <li>
                            <a href="#">
                            <span className="title">Images</span>
                            </a>
                        </li>
                    </ul>
                </nav>
                <div className="inner-content full-height">
                    <div className="split-view">
                        <div className="split-list">
                            <div data-email="list" className=" boreded no-top-border">
                            </div>
                        </div>
                        <div data-email="opened" className="split-details">
                            <div className="email-content-wrapper">
                            </div>
                        </div>
                        <div className="compose-wrapper hidden-md-up">
                            <a className="compose-email text-info pull-right m-r-10 m-t-10" href="email_compose.html"><i className="fa fa-pencil-square-o"></i></a>
                        </div>
                    </div>
                </div>
            </div>
		)
	}
}

export default withRouter(AssetsList)
