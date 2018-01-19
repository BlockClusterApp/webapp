import React, {Component} from "react";
import {Meteor} from "meteor/meteor";
import {BrowserRouter, Route, Switch, Redirect} from "react-router-dom"
import {withTracker} from "meteor/react-meteor-data";

import Networks from "../networks/Networks.jsx"

import Login from "../../pages/login/Login.jsx"
import Register from "../../pages/register/Register.jsx"

import "./App.css"

class App extends Component {
	requireAuth = (RouteComponent) => {
		return () => {
			return (
				this.props.userId ? (
				    <RouteComponent />
				) : (
				    <Redirect to="/" />
				)
			)
		}
	}

	requireNotLoggedIn = (RouteComponent) => {
		return () => {
			return (
				this.props.userId ? (
				    <Redirect to="/networks" />
				) : (
				    <RouteComponent />
				)
			)
		}
	}

	render(){
		return (
			<BrowserRouter>
				<Switch>
					<Route exact path="/" render={this.requireNotLoggedIn(Login)} />
					<Route exact path="/register" render={this.requireNotLoggedIn(Register)} />
					<Route path="/networks" render={this.requireAuth(Networks)} />
					{/*<Route component={Notfound} />*/}
				</Switch>
			</BrowserRouter>
		)
	}
}

export default withTracker(() => {
	return {
		userId: Meteor.userId()
	}
})(App)

/*
Notes:

import createHistory from "history/createBrowserHistory";
createHistory().push("/");

$(".page-container").pgNotification({
        style: "simple",
        message: "Logged In",
        position: "top-right",
        timeout: 5000,
        type: "success"
    }).show();

<LaddaButton
    loading={this.state.loading}
    data-size={S}
    data-style={SLIDE_UP}
    data-spinner-size={30}
    data-spinner-lines={12}
    className="btn btn-success"
    type="submit"
>
    <i className="fa fa-plus-circle" aria-hidden="true"></i>&nbsp;&nbsp;Submit
</LaddaButton>
this.setState({
    loading: false,
    formSubmitError: ''
});
*/
