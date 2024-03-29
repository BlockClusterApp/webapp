import React, { Component } from 'react';
import { Meteor } from 'meteor/meteor';
import { BrowserRouter, Route, Switch, Redirect } from 'react-router-dom';
import { withTracker } from 'meteor/react-meteor-data';

import Main from '../main/Main.jsx';
import PaymentsMain from '../main/Payments';

import Login from '../../pages/login/Login.jsx';
import Register from '../../pages/register/Register.jsx';
import EmailVerify from '../../pages/email-verify/EmailVerification.jsx';
import RequestPasswordReset from '../../pages/reset-password/RequestLink.jsx';
import ResetPassword from '../../pages/reset-password/ResetPassword.jsx';
import AcceptInvitation from '../../pages/userInvitation/AcceptInvitation.jsx';
import config from '../../../modules/config/client';

import './App.scss';

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
    let redirectTo = '/app/networks';
    if (window.isAdminWindow) {
      redirectTo = '/app/admin/users';
    }
    return () => {
      return this.props.userId ? <Redirect to={redirectTo} /> : <RouteComponent />;
    };
  };

  componentDidMount() {
    const script = document.createElement('script');

    script.src = 'https://checkout.razorpay.com/v1/checkout.js';

    document.body.appendChild(script);
    window.addEventListener('theme-changed', theme => {
      if (window.theme === 'theme-dark') {
        document.querySelector('body').style = 'background: #222';
      } else {
        document.querySelector('body').style = 'background: #f0f0f0';
      }

      this.setState({});
    });
    window.theme = this.props.user && this.props.user.profile.theme;
    if (window.location.origin.includes('admin.blockcluster.io')) {
      window.isAdminWindow = true;
    }
    this.setState({});
  }

  componentWillReceiveProps(newProps, oldProps) {
    let didChange = false;
    if (newProps.user) {
      if (!(oldProps.user && oldProps.user)) {
        window.theme = newProps.user.profile.theme;
        didChange = true;
      }
      if (oldProps.user && newProps.user.profile.theme !== oldProps.user.profile.theme) {
        window.theme = newProps.user.profile.theme;
        didChange = true;
      }
    }
    if (didChange) {
      if (window.theme === 'theme-dark') {
        document.querySelector('body').style = 'background: #222';
      } else {
        document.querySelector('body').style = 'background: #f0f0f0';
      }

      this.setState({});
    }
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
          <Route path="/payments" component={PaymentsMain} />
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
