import React from 'react';
import axios from 'axios';
import Toggle from 'react-toggle';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';

import 'react-toggle/style.css';
import notifications from '../../../../../modules/notifications';

export default class FeatureList extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  createFeature = () => {
    this.setState({
      loading: true,
    });
    const path = '/client/features';

    axios({
      method: 'POST',
      url: path,
      data: {
        name: this.featureName.value,
        activated: this.featureActivated,
      },
    })
      .then(res => {
        this.setState({
          loading: false,
        });
        notifications.success('Feature created');
      })
      .catch(error => {
        this.setState({
          loading: false,
        });
        notifications.error(error);
      });
  };

  handleToggleChange = e => {
    this.featureActivated = e.target.checked;
  };

  render() {
    return (
      <div className="row">
        <div className="col-md-12">
          <div className="row">
            <div className="col-md-5">
              <div className="form-group form-group-default required">
                <label>Feature Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="projectName"
                  required
                  ref={input => {
                    this.featureName = input;
                  }}
                />
              </div>
            </div>
            <div className="col-md-3">
              <div className="form-group form-group-default required">
                <label>Default Activated Status</label>
                <Toggle name="customCode" className="form-control" onChange={this.handleToggleChange} />
              </div>
            </div>
            <div className="col-md-4">
              <LaddaButton
                disabled={this.state.loading}
                loading={this.state.loading}
                data-size={S}
                data-style={SLIDE_UP}
                data-spinner-size={30}
                data-spinner-lines={12}
                className="btn btn-success m-t-10"
                onClick={this.createFeature}
              >
                <i className="fa fa-plus-circle" aria-hidden="true" />
                &nbsp;&nbsp;Add
              </LaddaButton>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
