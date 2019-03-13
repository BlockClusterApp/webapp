import React from 'react';
import { StripeProvider, Elements } from 'react-stripe-elements';
import { withRouter, Switch, BrowserRouter, Route } from 'react-router-dom';
import moment from 'moment';

import './Components/Styles.scss';

const API_KEY = 'pk_test_M9GRhEchj7TJtLXAgFXRL9kO';

import CardVerification from './Components/CardVerification';
import Collect from './Components/CollectPayment';

class Checkout extends React.Component {
  constructor(props) {
    super(props);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.state = {
      user,
    };
  }

  paymentRequestLoaded = request => {
    this.setState({
      request: request.paymentRequest,
      user: { name: `${request.user.profile.firstName} ${request.user.profile.lastName}`, email: request.user.emails[0].address },
    });
  };

  render() {
    return (
      <div className="stripe-wrapper" style={{ display: 'flex' }}>
        <div className="container m-t-50">
          <div className="row">
            <div className="col-md-12">
              <div className="stripe-form" style={{ background: '#fff', padding: '50px', borderRadius: '10px' }}>
                <center>
                  <img src="https://app.blockcluster.io/assets/img/logo/blockcluster.png" />
                  <span style={{ fontSize: '18px', fontWeight: 'bold', verticalAlign: 'middle' }}>
                    {this.props.location.pathname.includes('/card-verification') ? ' | Card Verification' : ''}
                  </span>
                </center>

                {this.state.request && (
                  <div className="row">
                    <div className="col-md-5 b-r b-grey p-10">
                      <input type="text" className="full-width" value={this.state.user.name} disabled />
                      <input type="email" className="full-width" value={this.state.user.email} disabled />
                    </div>
                    <div className="col-md-7 p-t-10" style={{ fontSize: '18px' }}>
                      <div className="row">
                        <div className="col-md-4">
                          <b>Charge for: </b>
                        </div>
                        <div className="col-md-8">{this.state.request.reason}</div>
                        <div className="col-md-4">
                          <b>Amount: </b>
                        </div>
                        <div className="col-md-8">$ {this.state.request.amount}</div>
                        {[2, 3].includes(this.state.request.paymentStatus) && (
                          <div className="col-md-12">
                            <div className="row">
                              <div className="col-md-4">
                                <b>Paid At:</b>
                              </div>
                              <div className="col-md-8">{moment(this.state.request.updatedAt).format('DD-MMM-YYYY kk:mm:ss')}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {!this.state.request && (
                  <div>
                    <input type="text" className="full-width" value={this.state.user.name} disabled />
                    <input type="email" className="full-width" value={this.state.user.email} disabled />
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="row m-t-20">
            <div className="col-md-12">
              <div className="stripe-form" style={{ background: '#fff', padding: '50px', borderRadius: '10px' }}>
                <StripeProvider apiKey={API_KEY} betas={['payment_intent_beta_3']}>
                  <Elements>
                    <BrowserRouter>
                      <Switch>
                        <Route exact path="/payments/card-verification" render={props => <CardVerification user={this.state.user} {...props} />} />
                        <Route
                          exact
                          path="/payments/collect/:id"
                          render={props => <Collect user={this.state.user} paymentRequestLoadListener={this.paymentRequestLoaded} {...props} />}
                        />
                      </Switch>
                    </BrowserRouter>
                  </Elements>
                </StripeProvider>
              </div>
            </div>
          </div>
          <div className="row m-t-20">
            <div className="col-md-12" style={{ textAlign: 'center' }}>
              <small style={{ color: '#fff' }}>All work copyright of respective owner, otherwise © 2017-2019 BlockCluster.</small>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(Checkout);
