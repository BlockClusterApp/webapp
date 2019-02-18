import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter } from 'react-router-dom';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';

import HyperionPricing from '../../../../../collections/pricing/hyperion';
import notifications from '../../../../../modules/notifications';
import ServiceLocation from '../../../../components/Selectors/ServiceLocation';

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
      'updateHyperionPricing',
      {
        minimumMonthlyCost: this.minimumMonthlyCost.value || 0,
        perApiCost: this.perApiCost.value || 0,
        perGBCost: this.perGBCost.value || 0,
        perGBDataTransferCost: this.perGBDataTransferCost.value || 0,
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
    let { hyperion } = this.props;

    if (!hyperion) {
      hyperion = {};
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
                      Hyperion Pricing
                    </h5>
                  </div>
                </div>

                <div className="card-block">
                  <ServiceLocation service="hyperion" />
                  <div className="row" style={{ marginTop: '10px' }}>
                    <div className="col-md-12">
                      <i className="fa fa-joomla" />
                      &nbsp;Minimum Monthly Cost &nbsp;($)
                      <input type="number" className="form-control" placeholder="$" defaultValue={hyperion.minimumMonthlyCost} ref={input => (this.minimumMonthlyCost = input)} />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-12" style={{ marginTop: '10px' }}>
                      <i className="fa fa-joomla" />
                      &nbsp;Per GB Cost per month&nbsp;($)
                      <input type="number" className="form-control" placeholder="$" defaultValue={hyperion.perGBCost} ref={input => (this.perGBCost = input)} />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-12" style={{ marginTop: '10px' }}>
                      <i className="fa fa-joomla" />
                      &nbsp;Per API Cost &nbsp;($)
                      <input type="number" className="form-control" placeholder="$" defaultValue={hyperion.perApiCost} ref={input => (this.perApiCost = input)} />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-12" style={{ marginTop: '10px' }}>
                      <i className="fa fa-joomla" />
                      &nbsp;Data Transfer Cost per GB&nbsp;($)
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Logic not implemented yet"
                        disabled
                        defaultValue={hyperion.perGBDataTransferCost}
                        ref={input => (this.perGBDataTransferCost = input)}
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
    hyperion: HyperionPricing.find({ active: true }).fetch()[0],
    subscriptions: [Meteor.subscribe('pricing')],
  };
})(withRouter(Pricing));
