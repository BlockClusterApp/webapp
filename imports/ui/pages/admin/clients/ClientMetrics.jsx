import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter, Link } from 'react-router-dom';
import axios from 'axios';

import moment from 'moment';
import GraphSet from './components/CpuRamGraphSet';

class ClientMetrics extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  fetchMetrics = () => {
    axios.get(`/client/metrics?clientId=${this.props.match.params.id}`).then(res => {
      const data = res.data;
      const { nodes, pods } = data.metrics;
      const tableData = { nodes: [], pods: [] };
      Object.keys(nodes).forEach(node => {
        const graph = {
          label: node
            .split('/')
            .splice(3)
            .join('/'),
          coordinates: [],
        };
        nodes[node].forEach(entry => {
          const cpu = Number(entry.usage.cpu.replace('n', ''));
          if (!isNaN(cpu)) {
            cpu = Math.floor(cpu / (1000 * 1000));
          }
          let memory = Number(entry.usage.memory.replace('Ki', ''));
          if (!isNaN(memory)) {
            memory = Math.floor(memory / 1000);
          }
          graph.coordinates.push({
            name: moment(entry.timestamp).format('mm:ss'),
            cpu,
            memory,
          });
        });
        tableData.nodes.push(graph);
      });
      this.setState({
        nodes,
        pods,
        tableData,
      });
      Object.keys(pods).forEach(pod => {
        const graph = {
          label: pod
            .split('/')
            .splice(3)
            .join('/'),
          coordinates: [],
        };
        pods[pod].forEach(entry => {
          const cpu = Number(entry.usage.cpu.replace('n', ''));
          if (!isNaN(cpu)) {
            cpu = Math.floor(cpu / (1000 * 1000));
          }
          let memory = Number(entry.usage.memory.replace('Ki', ''));
          if (!isNaN(memory)) {
            memory = Math.floor(memory / 1000);
          }
          graph.coordinates.push({
            name: moment(entry.timestamp).format('mm:ss'),
            cpu,
            memory,
          });
        });
        tableData.pods.push(graph);
      });
      this.setState({
        nodes,
        pods,
        tableData,
      });
    });
  };

  componentWillMount() {
    clearInterval(this.timer);
  }

  componentDidMount() {
    this.fetchMetrics();
    this.timer = setInterval(this.fetchMetrics, 30 * 1000);
  }

  render() {
    const LoadingView = (
      <div className="d-flex justify-content-center flex-column full-height ">
        <div id="loader" />
        <br />
        <p style={{ textAlign: 'center', fontSize: '1.2em' }}>Fetching metrics...</p>
      </div>
    );

    if (!(this.state.tableData && this.state.tableData && this.state.tableData.nodes.length > 0)) {
      return (
        <div className="content">
          <div className="m-t-20 container-fluid container-fixed-lg">
            {LoadingView }
          </div>
        </div>
      );
    }

    return (
      <div className="content">
        <div className="m-t-20 container-fluid container-fixed-lg">
          <div className="row">
            <div className="inner">
              <ol className="breadcrumb sm-p-b-5">
                <li className="breadcrumb-item">
                  <Link to="/app/admin">Admin</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link to="/app/admin/clients">Clients</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link to={`/app/admin/clients/details/${this.props.match.params.id}`}>{this.props.match.params.id}</Link>
                </li>
                <li className="breadcrumb-item active">metrics&nbsp;<i className="fa fa-spinner fa-pulse"></i> </li>
              </ol>
            </div>
          </div>
          <div className="row payments-container">
            <div className="card card-borderless card-transparent">
              <ul className="nav nav-tabs nav-tabs-linetriangle" role="tablist" data-init-reponsive-tabs="dropdownfx">
                <li className="nav-item">
                  <a className="active" data-toggle="tab" role="tab" data-target="#history" href="#">
                    Node Metrics
                  </a>
                </li>
                <li className="nav-item">
                  <a href="#" data-toggle="tab" role="tab" data-target="#create">
                    Pod Metrics
                  </a>
                </li>
              </ul>
              <div className="tab-content">
                <div className="tab-pane active" id="history">
                  <div className="m-t-20 m-l-20 container-fluid container-fixed-lg bg-white">
                    {this.state.tableData &&
                      this.state.tableData.nodes.map(data => {
                        return <GraphSet data={data} />;
                      })}
                  </div>
                </div>
                <div className="tab-pane " id="create">
                  <div className="m-t-20 m-l-20 container-fluid container-fixed-lg bg-white">
                    {this.state.tableData &&
                      this.state.tableData.pods.map(data => {
                        return <GraphSet data={data} />;
                      })}
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
  return {};
})(withRouter(ClientMetrics));
