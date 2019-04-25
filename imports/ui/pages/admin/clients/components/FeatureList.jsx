import React from 'react';
import moment from 'moment';
import axios from 'axios';

import notifications from '../../../../../modules/notifications';

export default class FeatureList extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      features: [],
    };
  }

  componentDidMount() {
    this.fetchFeatures();
  }

  fetchFeatures = () => {
    const path = '/client/features';

    axios
      .get(path)
      .then(res => {
        this.setState({
          features: res.data.data || [],
        });
      })
      .catch(error => {
        notifications.error(error);
      });
  };

  render() {
    const { features } = this.state;
    return (
      <div className="row">
        <div className="col-md-12">
          <div className=" card no-border card-condensed no-margin widget-loader-circle align-self-stretch d-flex flex-column">
            <div className="auto-overflow -table">
              <table className="table table-condensed table-hover">
                {features && (
                  <thead>
                    <tr>
                      <th style={{ width: '5%' }}>S.No</th>
                      <th style={{ width: '50%' }}>Feature</th>
                      <th style={{ width: '25%' }}>Added On</th>
                      <th style={{ width: '20%' }}>Activation Status</th>
                    </tr>
                  </thead>
                )}
                <tbody>
                  {features &&
                    features.map((feature, index) => {
                      return (
                        <tr key={index + 1}>
                          <td>{index + 1}</td>
                          <td>{feature.name}</td>
                          <td className="fs-12">{moment(feature.createdAt).format('DD-MMM-YYYY kk:mm')}</td>
                          <td className="fs-12">{feature.active ? 'Active' : '-'}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
