import React from 'react';

export default class ClusterConfigCard extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {
    const { config } = this.props;
    return (
      <div className="row">
        <div className="col-md-12">
          <h4 className="text-success">
            {config.namespace} - {config.locationCode}
          </h4>
        </div>
        <div className="col-md-6">
          <div className="table-responsive">
            <table className="table table-hover table-condensed" id="condensedTable">
              <tbody>
                <tr>
                  <td className="v-align-middle bold w-25">Master API Host</td>
                  <td className="v-align-middle">{config.masterAPIHost}</td>
                </tr>
                <tr>
                  <td className="v-align-middle bold">Namespace</td>
                  <td className="v-align-middle">{config.namespace}</td>
                </tr>
                <tr>
                  <td className="v-align-middle bold">Worker Node IP</td>
                  <td className="v-align-middle">{config.workerNodeIP}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="col-md-6">
          <div className="table-responsive">
            <table className="table table-hover table-condensed" id="condensedTable">
              <tbody>
                <tr>
                  <td className="v-align-middle bold w-25">Location Name</td>
                  <td className="v-align-middle">{config.locationName}</td>
                </tr>
                <tr>
                  <td className="v-align-middle bold">Ingress Host</td>
                  <td className="v-align-middle">{config.dynamoDomainName}</td>
                </tr>
                <tr>
                  <td className="v-align-middle bold">API Host</td>
                  <td className="v-align-middle">{config.apiHost}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}
