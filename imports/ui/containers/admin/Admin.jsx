import React, {Component} from "react";
import {Route, Redirect} from "react-router-dom"

import Navbar from "../../components/navbar/Admin.jsx"
import Header from "../../components/header/AdminHeader.jsx"
import Footer from "../../components/footer/Footer.jsx"

import UserList from "../../pages/admin/users/UserList.jsx";
import UserDetails from "../../pages/admin/users/Details.jsx";
import NetworkList from '../../pages/admin/networks/NetworkList.jsx';
import NetworkDetails from '../../pages/admin/networks/Details.jsx';
import Vouchers from '../../pages/admin/vouchers/VoucherList.jsx';
import VoucherList from "../../pages/admin/vouchers/VoucherList.jsx";

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
              <Route exact path="/admin/app/networks" component={NetworkList} />
              <Route exact path="/admin/app/networks/:id" component={NetworkDetails} />
              <Route exact path="/admin/app/vouchers" component={VoucherList} />
		        </div>
				  </div>
				<Footer />
			</div>
		)
	}
}
