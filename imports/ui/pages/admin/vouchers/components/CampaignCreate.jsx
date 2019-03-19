import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter } from 'react-router-dom';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';
import 'react-toggle/style.css';
import { Meteor } from 'meteor/meteor';
import notification from '../../../../../modules/notifications/index';

import './style.scss';

class VoucherCreate extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  save = () => {
    this.setState({
      loading: true,
    });
    Meteor.call('createCampaign', { description: this.description.value, live: true }, (err, res) => {
      this.setState({
        loading: false,
      });
      if (err) {
        return notification.error(err.reason);
      }
      notification.success('Campaign created');
    });
  };

  render() {
    return (
      <div className="VoucherCreate">
        <div className="m-t-20 container-fluid container-fixed-lg">
          <div className="row  bg-white p-l-25 p-r-25">
            <div className="col-md-12">
              <div className="card-title">
                <h3>Create Campaign</h3>
              </div>
            </div>
          </div>
          <div className="card-block">
            <div className="row">
              <div className="col-md-12 form-input-group">
                <label>Title</label>
                <input name="description" type="text" placeholder="What is this campaign for?" className="form-control" ref={input => (this.description = input)} required />
              </div>
            </div>
            <div className="row">
              <div className="col-md-4">
                <LaddaButton
                  loading={this.state.loading}
                  data-size={S}
                  data-style={SLIDE_UP}
                  data-spinner-size={30}
                  data-spinner-lines={12}
                  className="btn btn-success m-t-10"
                  onClick={this.save}
                >
                  <i className="fa fa-plus-circle" aria-hidden="true" />
                  &nbsp;&nbsp;Save
                </LaddaButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
export default withTracker(() => {
  return {};
})(withRouter(VoucherCreate));
