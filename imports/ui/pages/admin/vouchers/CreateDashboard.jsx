import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter, Link, Route, Redirect } from 'react-router-dom';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';

import Network from './components/NetworkCreate';
import Campaign from './components/CampaignCreate';
import Hyperion from './components/HyperionCreate';
import Paymeter from './components/PaymeterCreate';
import CreditsCreate from './components/CreditsCreate';
import PrivateHiveCreate from './components/PrivateHiveCreate';

class VoucherDashboard extends Component {
  constructor(props) {
    super(props);

    this.state = {
      page: 0,
      invoices: [],
      locations: [],
    };
  }

  componentDidMount = () => {
    Meteor.call('getClusterLocations', {}, (err, res) => {
      this.setState({
        locations: res,
      });
    });
  };

  create = () => {
    this.props.history.push('/app/admin/vouchers/');
  };

  render() {
    return (
      <div className="content">
        <style>{'\
                .footer{\
                  display:none;\
                }\
              '}</style>
        <div className="full-height">
          <nav className="secondary-sidebar light" style={{ backgroundColor: 'rgb(251,251,251)' }}>
            <p className="menu-title fs-16">Create Vouchers</p>
            <ul className="main-menu">
              <li className="active">
                <Link to={'/app/admin/voucher/create/campaign'}>
                  <span className="title">
                    <i className="fa fa-file" />
                    Campaign
                  </span>
                </Link>
              </li>
              <li className="">
                <Link to={'/app/admin/voucher/create/credits'}>
                  <span className="title">
                    <i className="fa fa-file" />
                    Credits
                  </span>
                </Link>
              </li>
              <li>
                <Link to={'/app/admin/voucher/create/networks'}>
                  <span className="title">
                    <i className="fa fa-cube" />
                    Dynamo
                  </span>
                </Link>
              </li>
              <li>
                <Link to={'/app/admin/voucher/create/privatehive'}>
                  <span className="title">
                    <i className="fa fa-cube" />
                    Private Hive
                  </span>
                </Link>
              </li>
              <li>
                <Link to={'/app/admin/voucher/create/hyperion'}>
                  <span className="title">
                    <i className="fa fa-cube" />
                    Hyperion
                  </span>
                </Link>
              </li>
              <li>
                <Link to={'/app/admin/voucher/create/paymeter'}>
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
                className="btn btn-danger m-t-10 m-l-20"
                onClick={this.create}
              >
                &nbsp;&nbsp;Back to list
              </LaddaButton>
            </p>
          </nav>
          <div className="inner-content full-height">
            <Route exact path="/app/admin/voucher/create" render={() => <Redirect to="/app/admin/voucher/create/campaign" />} />
            <Route exact path="/app/admin/voucher/create/campaign" render={props => <Campaign locations={this.state.locations} {...props} />} />
            <Route exact path="/app/admin/voucher/create/credits" render={props => <CreditsCreate locations={this.state.locations} {...props} />} />
            <Route exact path="/app/admin/voucher/create/networks" render={props => <Network locations={this.state.locations} {...props} />} />
            <Route exact path="/app/admin/voucher/create/hyperion" render={props => <Hyperion locations={this.state.locations} {...props} />} />
            <Route exact path="/app/admin/voucher/create/paymeter" render={props => <Paymeter locations={this.state.locations} {...props} />} />
            <Route exact path="/app/admin/voucher/create/privatehive" render={props => <PrivateHiveCreate locations={this.state.locations} {...props} />} />
          </div>
        </div>
      </div>
    );
  }
}

export default withTracker(() => {
  return {};
})(withRouter(VoucherDashboard));
