import React, {Component} from "react";
import {Route, Redirect} from "react-router-dom"

import Navbar from "../../components/navbar/Admin.jsx"
import Header from "../../components/header/Header.jsx"
import Footer from "../../components/footer/Footer.jsx"

import UserList from "../../pages/admin/userList/UserList.jsx";

export default class Main extends Component {
	render() {
		return (
			<div>
				<Navbar />
				  <div className="page-container">
					  <Header />
					  <div className="page-content-wrapper">
              <Route exact path="/admin/app" render={() => <Redirect to="/admin/app/users" />} />
              <Route exact path="/admin/app/users" component={UserList} />
		        </div>
				  </div>
				<Footer />
			</div>
		)
	}
}
