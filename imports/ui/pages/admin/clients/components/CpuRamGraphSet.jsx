import React from 'react';
import { Label, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default class GraphSet extends React.Component {
  render() {
    const {data} = this.props;
    return (
      <div className="row" style={{ borderBottom: '1px solid rgba(0,0,0,0.5)', paddingBottom: '80px' }}>
        <div className="col-md-6">
          <h5 className="text-primary pull-left">{data.label}</h5>
          <AreaChart width={this.props.width || 500} height={this.props.height || 350} data={data.coordinates} syncId={data.label} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`color${data.label}Uv`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name">
              <Label value={this.props.xLeftLabel || 'Timestamp (hh:ss)'} offset={0} position="bottom" />
            </XAxis>
            <YAxis label={{ value: this.props.yLeftLabel || 'CPU (m)', angle: -90, position: 'insideLeft', textAnchor: 'middle' }} />
            <Tooltip />
            <Area type="monotone" dataKey="cpu" stroke="#8884d8" fill={`url(#color${data.label}Uv`} />
          </AreaChart>
        </div>
        <div className="col-md-6">
          <h5 className="text-primary pull-left">&nbsp;</h5>
          <AreaChart width={this.props.width || 500} height={this.props.height || 350} data={data.coordinates} syncId={data.label} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`color${data.label}Pv`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name">
              <Label value={this.props.xRightLabel || 'Timestamp (hh:ss)'} offset={0} position="bottom" />
            </XAxis>
            <YAxis label={{ value: this.props.yRightLabel || 'Memory (Mi)', angle: -90, position: 'insideLeft', textAnchor: 'middle' }} />
            <Tooltip />
            <Area type="monotone" dataKey="memory" stroke="#82ca9d" fill={`url(#color${data.label}Pv`} />
          </AreaChart>
        </div>
      </div>
    );
  }
}
