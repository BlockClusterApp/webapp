import React, {Component} from "react";
import {Route, Redirect} from "react-router-dom"

import Navbar from "../../components/navbar/Admin.jsx"
import Header from "../../components/header/AdminHeader.jsx"
import Footer from "../../components/footer/Footer.jsx"

import UserList from "../../pages/admin/users/UserList.jsx";
import UserDetails from "../../pages/admin/users/Details.jsx";

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
              <Route exact path="/admin/app/users/:id" component={UserDetails} />
		        </div>
				  </div>
				<Footer />
			</div>
		)
	}
}
