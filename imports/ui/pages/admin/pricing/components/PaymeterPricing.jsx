import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter } from 'react-router-dom';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';

import PaymeterPricing from '../../../../../collections/pricing/paymeter';
import notifications from '../../../../../modules/notifications';

class Pricing extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: false,
    };
  }

  save() {
    this.setState({
      loading: true,
    });
    Meteor.call(
      'updatePaymeterPricing',
      {
        minimumMonthlyCost: this.minimumMonthlyCost.value || 0,
        perApiCost: this.perApiCost.value || 0,
        perWalletCost: this.perWalletCost.value || 0,
        perTransactionCost: this.perTransactionCost.value || 0,
        perTransactionCostFlat: this.perTransactionCostFlat.value || 0,
      },
      (err, data) => {
        this.setState({
          loading: false,
        });
        if (err) {
          return notifications.error(err.reason);
        }
        notifications.success('Pricing updated');
      }
    );
  }

  render() {
    let { paymeter } = this.props;

    if (!paymeter) {
      paymeter = {};
    }

    return (
      <div className="inner-content p-l-10 m-l-0">
        <div className="m-t-20 container-fluid container-fixed-lg">
          <div className="row">
            <div className="col-sm-12">
              <div className="card bg-white">
                <div className="card-header ">
                  <div className="card-title full-width">
                    <h5 className="text-primary m-b-0 m-t-0" style={{ display: 'inline' }}>
                      Paymeter Pricing
                    </h5>
                  </div>
                </div>
                <div className="card-block">
                  <div className="row" style={{ marginTop: '10px' }}>
                    <div className="col-md-12">
                      <i className="fa fa-joomla" />
                      &nbsp;Minimum Monthly Cost &nbsp;($)
                      <input type="number" className="form-control" placeholder="$" defaultValue={paymeter.minimumMonthlyCost} ref={input => (this.minimumMonthlyCost = input)} />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-12" style={{ marginTop: '10px' }}>
                      <i className="fa fa-joomla" />
                      &nbsp;Per API Cost &nbsp;($)
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Logic not implemented yet"
                        disabled
                        defaultValue={paymeter.perApiCost}
                        ref={input => (this.perApiCost = input)}
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-12" style={{ marginTop: '10px' }}>
                      <i className="fa fa-joomla" />
                      &nbsp;Per wallet cost&nbsp;($)
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Logic not implemented yet"
                        disabled
                        defaultValue={paymeter.perWalletCost}
                        ref={input => (this.perWalletCost = input)}
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-12" style={{ marginTop: '10px' }}>
                      <i className="fa fa-joomla" />
                      &nbsp;Per transaction Cost (If price available on coinmarketcap)&nbsp;(%)
                      <input type="number" className="form-control" placeholder="%" defaultValue={paymeter.perTransactionCost} ref={input => (this.perTransactionCost = input)} />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-12" style={{ marginTop: '10px' }}>
                      <i className="fa fa-joomla" />
                      &nbsp;Per transaction cost (If price not on coinmarketcap)&nbsp;($)
                      <input
                        type="number"
                        className="form-control"
                        placeholder="$"
                        defaultValue={paymeter.perTransactionCostFlat}
                        ref={input => (this.perTransactionCostFlat = input)}
                      />
                    </div>
                  </div>
                  <div className="row" style={{ marginTop: '20px' }}>
                    <div className="col-md-12">
                      <LaddaButton
                        data-size={S}
                        data-style={SLIDE_UP}
                        data-spinner-size={30}
                        data-spinner-lines={12}
                        className="btn btn-success pull-left "
                        onClick={this.save.bind(this)}
                        loading={this.state.loading}
                      >
                        <i className="fa fa-save" /> &nbsp;&nbsp;Save
                      </LaddaButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withTracker(() => {
  return {
    paymeter: PaymeterPricing.find({ active: true }).fetch()[0],
    subscriptions: [Meteor.subscribe('pricing')],
  };
})(withRouter(Pricing));
