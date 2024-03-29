import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter, Link, Route, Redirect } from 'react-router-dom';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';

import VoucherList from './components/VoucherList';
import CampaignList from './components/CampaignList';

import './components/style.scss';

class VoucherDashboard extends Component {
  constructor(props) {
    super(props);

    this.state = {
      page: 0,
      invoices: [],
    };
  }

  create = () => {
    this.props.history.push('/app/admin/voucher/create');
  };

  componentWillReceiveProps() {
    this.setState({});
  }

  render() {
    return (
      <div className="content VoucherDashboard">
        <style>{'\
                .footer{\
                  display:none;\
                }\
              '}</style>
        <div className="full-height">
          <nav className="secondary-sidebar light" style={{ backgroundColor: 'rgb(251,251,251)' }}>
            <p className="menu-title fs-16">Voucher types</p>
            <ul className="main-menu">
              <li className={this.props.history.location.pathname === '/app/admin/vouchers/campaign' ? 'active-menu-item' : ''}>
                <Link to={'/app/admin/vouchers/campaign'}>
                  <span className="title">
                    <i className="fa fa-file" />
                    Campaign
                  </span>
                </Link>
              </li>
              <li className={this.props.history.location.pathname === '/app/admin/vouchers/credits' ? 'active-menu-item' : ''}>
                <Link to={'/app/admin/vouchers/credits'}>
                  <span className="title">
                    <i className="fa fa-cube" />
                    Credit Vouchers
                  </span>
                </Link>
              </li>
              <li className={this.props.history.location.pathname === '/app/admin/vouchers/networks' ? 'active-menu-item' : ''}>
                <Link to={'/app/admin/vouchers/networks'}>
                  <span className="title">
                    <i className="fa fa-cube" />
                    Dynamo
                  </span>
                </Link>
              </li>
              <li>
                <Link to={'/app/admin/vouchers/privatehive'}>
                  <span className="title">
                    <i className="fa fa-cube" />
                    Private Hive
                  </span>
                </Link>
              </li>
              <li className={this.props.history.location.pathname === '/app/admin/vouchers/hyperion' ? 'active-menu-item' : ''}>
                <Link to={'/app/admin/vouchers/hyperion'}>
                  <span className="title">
                    <i className="fa fa-cube" />
                    Hyperion
                  </span>
                </Link>
              </li>
              <li className={this.props.history.location.pathname === '/app/admin/vouchers/paymeter' ? 'active-menu-item' : ''}>
                <Link to={'/app/admin/vouchers/paymeter'}>
                  <span className="title">
                    <i className="fa fa-cube" />
                    Paymeter
                  </span>
                </Link>
              </li>
            </ul>
            <p>
              <LaddaButton
                loading={this.state.loading}
                data-size={S}
                data-style={SLIDE_UP}
                data-spinner-size={30}
                data-spinner-lines={12}
                className="btn btn-success m-t-10 m-l-20"
                onClick={this.create}
              >
                <i className="fa fa-plus-circle" aria-hidden="true" />
                &nbsp;&nbsp;Create Vouchers
              </LaddaButton>
            </p>
          </nav>
          <div className="inner-content full-height">
            <Route exact path="/app/admin/vouchers" render={() => <Redirect to="/app/admin/vouchers/campaign" />} />
            <Route exact path="/app/admin/vouchers/campaign" render={() => <CampaignList type="campaign" />} />
            <Route exact path="/app/admin/vouchers/credits" render={() => <VoucherList type="credit" />} />
            <Route exact path="/app/admin/vouchers/networks" render={() => <VoucherList type="network" />} />
            <Route exact path="/app/admin/vouchers/hyperion" render={() => <VoucherList type="hyperion" />} />
            <Route exact path="/app/admin/vouchers/paymeter" render={() => <VoucherList type="paymeter" />} />
            <Route exact path="/app/admin/vouchers/privatehive" render={() => <VoucherList type="privatehive" />} />
          </div>
        </div>
      </div>
    );
  }
}

export default withTracker(() => {
  return {};
})(withRouter(VoucherDashboard));
