import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter } from 'react-router-dom';
import axios from 'axios';

import moment from 'moment';
import { LineChart, Line, AreaChart, Area, Brush, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

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
            name: moment(entry.timestamp).format('mm:SS'),
            cpu,
            memory,
          });
        });
        tableData.nodes.push(graph);
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
            name: moment(entry.timestamp).format('mm:SS'),
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
    return (
      <div className="content">
        <div className="m-t-20 container-fluid container-fixed-lg">
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
                        return (
                          <div className="row" style={{ borderBottom: '1px solid rgba(0,0,0,0.5)', paddingBottom: '80px' }}>
                            <div className="col-md-6">
                              <h5 className="text-primary pull-left">{data.label}</h5>
                              <AreaChart width={500} height={300} data={data.coordinates} syncId={data.label} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Area type="monotone" dataKey="cpu" stroke="#8884d8" fill="url(#colorUv)" />
                              </AreaChart>
                            </div>
                            <div className="col-md-6">
                              <h5 className="text-primary pull-left">&nbsp;</h5>
                              <AreaChart width={500} height={300} data={data.coordinates} syncId={data.label} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Area type="monotone" dataKey="memory" stroke="#82ca9d" fill="url(#colorPv)" />
                              </AreaChart>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
                <div className="tab-pane " id="create">
                  <div className="m-t-20 m-l-20 container-fluid container-fixed-lg bg-white">
                    {this.state.tableData &&
                      this.state.tableData.pods.map(data => {
                        return (
                          <div className="row" style={{ borderBottom: '1px solid rgba(0,0,0,0.5)', paddingBottom: '80px' }}>
                            <div className="col-md-6">
                              <h5 className="text-primary pull-left">{data.label}</h5>
                              <AreaChart width={500} height={300} data={data.coordinates} syncId={data.label} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="colorPodUv" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Area type="monotone" dataKey="cpu" stroke="#8884d8" fill="url(#colorPodUv)" />
                              </AreaChart>
                            </div>
                            <div className="col-md-6">
                              <h5 className="text-primary pull-left">&nbsp;</h5>
                              <AreaChart width={500} height={300} data={data.coordinates} syncId={data.label} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="colorPodPv" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Area type="monotone" dataKey="memory" stroke="#82ca9d" fill="url(#colorPodPv)" />
                              </AreaChart>
                            </div>
                          </div>
                        );
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
