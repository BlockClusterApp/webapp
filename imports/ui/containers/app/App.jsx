import React, { Component } from 'react';
import { Meteor } from 'meteor/meteor';
import { BrowserRouter, Route, Switch, Redirect } from 'react-router-dom';
import { withTracker } from 'meteor/react-meteor-data';

import Main from '../main/Main.jsx';

import Login from '../../pages/login/Login.jsx';
import Register from '../../pages/register/Register.jsx';
import EmailVerify from '../../pages/email-verify/EmailVerification.jsx';
import RequestPasswordReset from '../../pages/reset-password/RequestLink.jsx';
import ResetPassword from '../../pages/reset-password/ResetPassword.jsx';
import AcceptInvitation from '../../pages/userInvitation/AcceptInvitation.jsx';
import config from '../../../modules/config/client';

import './App.css';

import axios from 'axios';

axios.defaults.baseURL = config.licensingMicroserviceBase;

axios.interceptors.request.use(config => {
  const newConfig = Object.assign({}, config);

  newConfig.headers['x-access-key'] = 0 + new Date().setUTCHours(new Date().getUTCHours(), 0, 0, 0).toString() + 1 + Date.now() + 000;
  return newConfig;
});

class App extends Component {
  requireAuth = RouteComponent => {
    return () => {
      return this.props.userId ? <RouteComponent /> : <Redirect to="/login" />;
    };
  };

  requireAdmin = RouteComponent => {
    return () => {
      if (Number(localStorage.getItem('admin')) > 1 || this.props.user) {
        if (this.props.user && this.props.user.admin >= 1) {
          return <RouteComponent user={this.props.user} />;
        } else {
        }
        if (Number(localStorage.getItem('admin')) < 1) {
          return <Redirect to="/app/networks" />;
        }
        return <RouteComponent user={this.props.user} />;
      } else {
        return <Redirect to="/login" />;
      }
    };
  };

  requireNotLoggedIn = RouteComponent => {
    return () => {
      return this.props.userId ? <Redirect to="/app/networks" /> : <RouteComponent />;
    };
  };

  componentDidMount() {
    const script = document.createElement('script');

    script.src = 'https://checkout.razorpay.com/v1/checkout.js';

    document.body.appendChild(script);
  }

  render() {
    return (
      <BrowserRouter>
        <Switch>
          <Route exact path="/" render={() => <Redirect to="/login" />} />
          <Route exact path="/login" render={this.requireNotLoggedIn(Login)} />
          <Route exact path="/register" render={this.requireNotLoggedIn(Register)} />
          <Route exact path="/forgot-password" render={this.requireNotLoggedIn(RequestPasswordReset)} />
          <Route exact path="/reset-password" component={ResetPassword} />
          <Route exact path="/email-verify" component={EmailVerify} />
          <Route exact path="/accept-invitation" component={AcceptInvitation} />
          <Route path="/app/admin" render={this.requireAdmin(Main)} />
          <Route path="/app" render={this.requireAuth(Main)} />
          {/*<Route component={Notfound} />*/}
        </Switch>
      </BrowserRouter>
    );
  }
}

export default withTracker(() => {
  return {
    userId: Meteor.userId(),
    user: Meteor.user(),
  };
})(App);

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
