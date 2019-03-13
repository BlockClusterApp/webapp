import React from 'react';
import { StripeProvider, Elements } from 'react-stripe-elements';
import { withRouter } from 'react-router-dom';

import './Components/Styles.scss';

const API_KEY = 'pk_test_M9GRhEchj7TJtLXAgFXRL9kO';

import CardVerification from './Components/CardVerification';

class Checkout extends React.Component {
  constructor(props) {
    super(props);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.state = {
      user,
    };
  }

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
                    {' '}
                    &nbsp; | &nbsp;{this.props.location.pathname.includes('/card-verification') ? 'Card Verification' : ''}
                  </span>
                </center>

                <input type="text" className="full-width" value={this.state.user.name} disabled />
                <input type="email" className="full-width" value={this.state.user.email} disabled />
              </div>
            </div>
          </div>
          <div className="row m-t-20">
            <div className="col-md-12">
              <div className="stripe-form" style={{ background: '#fff', padding: '50px', borderRadius: '10px' }}>
                <StripeProvider apiKey={API_KEY}>
                  <Elements>
                    <CardVerification user={this.state.user} />
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
