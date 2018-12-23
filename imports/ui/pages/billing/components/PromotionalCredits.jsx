import React, { Component } from 'react';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';
import { Meteor } from 'meteor/meteor';

import notifications from '../../../../modules/notifications';

class PromotionalCredits extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }
  componentDidMount() {
    this.fetchBalanceCredits();
  }

  fetchBalanceCredits = () => {
    Meteor.call('fetchBalanceCredits', { userId: Meteor.userId() }, (err, res) => {
      if (err) {
        return console.log('Some error', err);
      }
      this.setState({
        balanceCredits: res,
      });
    });
  };

  redeemVoucher = () => {
    this.setState({
      loading: true,
    });
    Meteor.call('applyPromotionalCode', { code: this.promotionalCode.value, userId: Meteor.userId() }, (err, res) => {
      this.setState({
        loading: false,
      });
      if (err) {
        return notifications.error(err.reason);
      }
      notifications.success('Code redeemed');
      this.promotionalCode.value = '';
      this.fetchBalanceCredits();
    });
  };

  render() {
    return (
      <div className="card-block">
        <div className="row">
          <div className="col-md-12">
            <h3 className="text-primary">Promotional Credits</h3>
          </div>
        </div>
        <div className="row">
          <div className="col-md-4 col-sm-6 b-r b-dashed">
            <div className="row">
              <div className="col-md-12 form-input-group">
                <label>Redeem Promotional Code</label>
                <input name="code" type="text" placeholder="CODE100" className="form-control" ref={input => (this.promotionalCode = input)} required />
              </div>
            </div>
            <div className="row m-t-10">
              <div className="col-md-12">
                <LaddaButton
                  loading={this.state.loading}
                  data-size={S}
                  data-style={SLIDE_UP}
                  data-spinner-size={30}
                  data-spinner-lines={12}
                  className="btn btn-success m-t-10"
                  onClick={this.redeemVoucher}
                  style={{ marginTop: 0 }}
                >
                  <i className="fa fa-check" /> &nbsp;Redeem
                </LaddaButton>
              </div>
            </div>
          </div>
          <div className="col-md-8 col-sm-6">
            <p>Balance credits: $ {this.state.balanceCredits || '0.00'}</p>
          </div>
        </div>
      </div>
    );
  }
}

export default PromotionalCredits;
