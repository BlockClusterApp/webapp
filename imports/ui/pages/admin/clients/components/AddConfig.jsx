import React from 'react';
import axios from 'axios';
import { withRouter, Link } from 'react-router-dom';

import notifications from '../../../../../modules/notifications';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';

export default withRouter(
  class AddConfig extends React.Component {
    constructor(props) {
      super(props);

      this.state = {
        client: {},
      };
    }

    componentDidMount() {
      this.clientId = this.props.match.params.id;
      this.refresh();
    }

    refresh = () => {
      return axios
        .get(`/client/${this.clientId}/cluster-configs`)
        .then(res => {
          this.setState({
            client: res.data.data,
          });
        })
        .catch(error => {
          console.log(error);
          notifications.error('cant reach server');
        });
    };

    addNamespace = () => {
      if (!this.namespace.value) {
        return notifications.error('Namespace cannot be empty');
      }
      this.setState({
        loading: true,
      });
      axios
        .post(`/client/${this.clientId}/namespace`, { namespace: this.namespace.value })
        .then(res => {
          this.setState({
            client: res.data.data,
            loading: false,
          });
          notifications.success('Namespace added');
        })
        .catch(error => {
          console.log(error);
          notifications.error(error);
        });
    };

    showNamespaceInfo = () => {};

    render() {
      let clusterConfig = this.state.client;
      if (!clusterConfig) {
        clusterConfig = {};
      }
      if (!clusterConfig.clusters) {
        clusterConfig.clusters = {};
      }
      if (!clusterConfig.webapp) {
        clusterConfig.webapp = {};
      }
      return (
        <div className="card-block">
          <div className="row">
            <div className="col-md-4">
              <div className="row">
                <div className="col-md-12">
                  <h4 className="text-primary">Namespaces</h4>
                </div>
                <div className="col-md-12">
                  <ul>
                    {Object.keys(clusterConfig.clusters).map(namespace => (
                      <li key={namespace} onClick={this.showNamespaceInfo.bind(this, namespace)}>
                        <i className="fa fa-info-circle" />
                        {namespace}
                      </li>
                    ))}
                    <li>
                      <div className="input-group transparent">
                        <span className="input-group-addon" style={{ background: '#1dbb99', cursor: 'pointer', color: 'white' }} onClick={this.addNamespace}>
                          <i className="fa fa-plus" />
                        </span>
                        <input type="text" placeholder="Add new namespace" className="form-control" defaultValue="" ref={i => (this.namespace = i)} />
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }
);
