import React from 'react';

export default class WebappConfigCard extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {
    const { config } = this.props;
    return (
      <div className="row">
        <div className="col-md-12">
          <h4 className="text-success">{config.namespace}</h4>
        </div>
        <div className="col-md-6">
          <h5 className="text-primary">Image Repositories</h5>
          <div className="table-responsive">
            <table className="table table-hover table-condensed" id="condensedTable">
              <tbody>
                <tr>
                  <td className="v-align-middle bold w-25">Dynamo</td>
                  <td className="v-align-middle">{config.dynamo}</td>
                </tr>
                <tr>
                  <td className="v-align-middle bold">Impulse</td>
                  <td className="v-align-middle">{config.impulse}</td>
                </tr>
                <tr>
                  <td className="v-align-middle bold">Webapp</td>
                  <td className="v-align-middle">{config.webapp}</td>
                </tr>
                <tr>
                  <td colSpan="2">Privatehive</td>
                </tr>
                <tr>
                  <td className="v-align-middle bold">Peer</td>
                  <td className="v-align-middle">{config.privatehive.peer}</td>
                </tr>
                <tr>
                  <td className="v-align-middle bold">Orderer</td>
                  <td className="v-align-middle">{config.privatehive.orderer}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <h5 className="text-primary">Databases</h5>
          <div className="table-responsive">
            <table className="table table-hover table-condensed" id="condensedTable">
              <tbody>
                <tr>
                  <td className="v-align-middle bold w-25">Mongo URL</td>
                  <td className="v-align-middle">{config.mongoURL}</td>
                </tr>
                <tr>
                  <td colSpan="2">Redis</td>
                </tr>
                <tr>
                  <td className="v-align-middle bold">Host</td>
                  <td className="v-align-middle">{config.redis.host}</td>
                </tr>
                <tr>
                  <td className="v-align-middle bold">Port</td>
                  <td className="v-align-middle">{config.redis.port}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="col-md-6">
          <h5 className="text-primary">Ingress</h5>
          <div className="table-responsive">
            <table className="table table-hover table-condensed" id="condensedTable">
              <tbody>
                <tr>
                  <td className="v-align-middle bold w-25">Annotations</td>
                  <td className="v-align-middle">{JSON.stringify(config.Ingress.Annotations, null, 2)}</td>
                </tr>
                <tr>
                  <td className="v-align-middle bold">SSL Secret Name</td>
                  <td className="v-align-middle">{config.Ingress.secretName}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <h5 className="text-primary">Paymeter</h5>
          <div className="table-responsive">
            <table className="table table-hover table-condensed" id="condensedTable">
              <tbody>
                <tr>
                  <td colSpan="2">API Keys</td>
                </tr>
                <tr>
                  <td className="v-align-middle bold w-25">Coinmarketcap</td>
                  <td className="v-align-middle">{config.paymeter.api_keys.coinmarketcap}</td>
                </tr>
                <tr>
                  <td className="v-align-middle bold w-25">Ethplorer</td>
                  <td className="v-align-middle">{config.paymeter.api_keys.ethplorer}</td>
                </tr>
                <tr>
                  <td colSpan="2">Infura API - ETH</td>
                </tr>
                <tr>
                  <td className="v-align-middle bold w-25">Testnet</td>
                  <td className="v-align-middle">{config.paymeter.blockchains.eth.testnet.url}</td>
                </tr>
                <tr>
                  <td className="v-align-middle bold w-25">Testnet</td>
                  <td className="v-align-middle">{config.paymeter.blockchains.eth.mainnet.url}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}
