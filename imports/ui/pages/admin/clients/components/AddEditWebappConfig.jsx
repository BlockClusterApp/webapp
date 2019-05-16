import React, { Component } from 'react';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';
import axios from 'axios';

import notifications from '../../../../../modules/notifications';

import '../ClientDetails.scss';

export default class PaymentModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      config: props.config,
    };
    this.isModalShowing = false;
  }

  open = () => {
    if (this.props.config) {
      const { config } = this.props;
      this.namespace.value = config.namespace;
      this.dynamo.value = config.dynamo;
      this.impulse.value = config.impulse;
      this.privatehiveOrderer.value = config.privatehive.orderer;
      this.privatehivePeer.value = config.privatehive.peer;
      this.mongo.value = config.mongoURL;
      this.redisHost.value = config.redis.host;
      this.redisPort.value = config.redis.port;
      this.webapp.value = config.πwebapp;
      this.root.value = config.rootUrl;
      this.ingressAnnotations.value = JSON.stringify(config.Ingress.Annotations, null, 2);
      this.ingressSecret.value = config.Ingress.secretName;
      this.ethMainnet.value = config.paymeter.blockchains.eth.mainnet.url;
      this.ethTestnet.value = config.paymeter.blockchains.eth.testnet.url;
      this.coinmarketcap.value = config.paymeter.api_keys.coinmarketcap;
      this.ethplorer.value = config.paymeter.api_keys.ethplorer;
    }
    $('#modalAddConfig').modal('show');
    this.isModalShowing = true;
  };
  close = () => {
    $('#modalAddConfig').modal('hide');
    this.isModalShowing = true;
  };

  addModal = () => {
    this.setState({
      loading: true,
    });
    axios
      .post(`/client/${this.props.clientId}/webapp-configs`, {
        namespace: this.namespace.value,
        dynamo: this.dynamo.value,
        impulse: this.impulse.value,
        privatehive: {
          peer: this.privatehivePeer.value,
          orderer: this.privatehiveOrderer.value,
        },
        mongo: this.mongo.value,
        redis: { host: this.redisHost.value, port: this.redisPort.value },
        webapp: this.webapp.value,
        rootUrl: this.root.value,
        ingress: {
          Annotations: JSON.parse(this.ingressAnnotations.value || '{}'),
          secretName: this.ingressSecret.value,
        },
        paymeter: {
          blockchains: {
            eth: {
              testnet: {
                url: this.ethTestnet.value,
              },
              mainnet: {
                url: this.ethMainnet.value,
              },
            },
          },
          api_keys: {
            coinmarketcap: this.coinmarketcap.value,
            ethplorer: this.ethplorer.value,
          },
        },
      })
      .then(res => {
        this.setState({
          loading: false,
        });
        this.props.completeListener && this.props.completeListener(res.data.data);
        notifications.success('Webapp config added');
        this.close();
      })
      .catch(error => {
        this.setState({
          loading: false,
        });
        console.log(error);
        notifications.error('cant reach server');
      });
  };

  componentDidMount = () => {
    this.props.modalEventFns && this.props.modalEventFns(this.open, this.close);
  };

  render() {
    return (
      <div className="modal fade slide-right" id="modalAddConfig" tabIndex="-1" role="dialog" aria-hidden="true">
        <div className="modal-dialog modal-md">
          <div className="modal-content-wrapper">
            <div className="modal-content">
              <button type="button" className="close" data-dismiss="modal" aria-hidden="true">
                <i className="pg-close fs-14" />
              </button>
              <div className="container-md-height full-height">
                <div className="row-md-height">
                  <div className="modal-body col-md-height col-middle">
                    <h3 className="text-primary ">Add/Edit Webapp Config</h3>
                    <br />
                    <div className="form-group form-group-default required">
                      <label>Namespace</label>
                      <input
                        type="text"
                        className="form-control"
                        name="namespace"
                        placeholder="Namespace for deployment"
                        required
                        ref={input => {
                          this.namespace = input;
                        }}
                      />
                    </div>
                    <div className="group-border">
                      <h4 className="text-primary">Image configuration</h4>

                      <div className="form-group form-group-default required">
                        <label>Webapp Image URL</label>
                        <input
                          type="text"
                          className="form-control"
                          name="api-host"
                          placeholder="URL where webapp image is hosted"
                          required
                          ref={input => {
                            this.webapp = input;
                          }}
                        />
                      </div>
                      <div className="form-group form-group-default required">
                        <label>Dynamo Image URL</label>
                        <input
                          type="text"
                          className="form-control"
                          name="master-api"
                          placeholder="URL where dynamo image is hosted"
                          required
                          ref={input => {
                            this.dynamo = input;
                          }}
                        />
                      </div>
                      <div className="form-group form-group-default required">
                        <label>Impulse Image URL</label>
                        <input
                          type="text"
                          className="form-control"
                          name="location-code"
                          placeholder="URL where impulse image is hosted"
                          required
                          ref={input => {
                            this.impulse = input;
                          }}
                        />
                      </div>
                      <h5 className="text-info">Privatehive</h5>
                      <div className="form-group form-group-default required">
                        <label>Peer Image URL</label>
                        <input
                          type="text"
                          className="form-control"
                          name="worker-node"
                          placeholder="URL where privatehive peer image is hosted"
                          required
                          ref={input => {
                            this.privatehivePeer = input;
                          }}
                        />
                      </div>
                      <div className="form-group form-group-default required">
                        <label>Orderer Image URL</label>
                        <input
                          type="text"
                          className="form-control"
                          name="ingress-domain"
                          placeholder="URL where privatehive orderer image is hosted"
                          required
                          ref={input => {
                            this.privatehiveOrderer = input;
                          }}
                        />
                      </div>
                    </div>
                    <div className="group-border">
                      <h4 className="text-primary">Databases</h4>
                      <div className="form-group form-group-default required">
                        <label>MongoDB URL</label>
                        <input
                          type="text"
                          className="form-control"
                          name="api-host"
                          placeholder="Mongo connection url"
                          required
                          ref={input => {
                            this.mongo = input;
                          }}
                        />
                      </div>
                      <div className="form-group form-group-default required">
                        <label>Redis Host</label>
                        <input
                          type="text"
                          className="form-control"
                          name="api-host"
                          placeholder="Redis host"
                          required
                          ref={input => {
                            this.redisHost = input;
                          }}
                        />
                      </div>
                      <div className="form-group form-group-default required">
                        <label>Redis Port</label>
                        <input
                          type="number"
                          className="form-control"
                          name="api-host"
                          placeholder="Redis port"
                          required
                          ref={input => {
                            this.redisPort = input;
                          }}
                        />
                      </div>
                    </div>
                    <div className="form-group form-group-default required">
                      <label>Root URL</label>
                      <input
                        type="text"
                        className="form-control"
                        name="api-host"
                        placeholder="Host name where dashboard is running"
                        required
                        ref={input => {
                          this.root = input;
                        }}
                      />
                    </div>
                    <div className="group-border">
                      <h4 className="text-primary">Ingress</h4>
                      <div className="form-group form-group-default required">
                        <label>Annotations</label>
                        <textarea
                          type="text"
                          rows="4"
                          className="form-control"
                          name="api-host"
                          style={{ minHeight: '100px' }}
                          placeholder="{}"
                          required
                          ref={input => {
                            this.ingressAnnotations = input;
                          }}
                        />
                      </div>
                      <div className="form-group form-group-default required">
                        <label>SSL Secret Name</label>
                        <input
                          type="text"
                          className="form-control"
                          name="api-host"
                          placeholder="Kube secret having SSL certs"
                          required
                          ref={input => {
                            this.ingressSecret = input;
                          }}
                        />
                      </div>
                    </div>
                    <div className="group-border">
                      <h4 className="text-primary">Paymeter</h4>
                      <h5 className="text-info">API Keys</h5>
                      <div className="form-group form-group-default required">
                        <label>Coinmarketcap</label>
                        <input
                          type="text"
                          className="form-control"
                          name="api-host"
                          placeholder="Coinmarketcap API Key"
                          required
                          ref={input => {
                            this.coinmarketcap = input;
                          }}
                        />
                      </div>
                      <div className="form-group form-group-default required">
                        <label>Ethplorer</label>
                        <input
                          type="text"
                          className="form-control"
                          name="api-host"
                          placeholder="Ethplorer API Key"
                          required
                          ref={input => {
                            this.ethplorer = input;
                          }}
                        />
                      </div>
                      <h5 className="text-info">Blockchain</h5>
                      <div className="form-group form-group-default required">
                        <label>Eth - Testnet</label>
                        <input
                          type="text"
                          className="form-control"
                          name="api-host"
                          placeholder="Infura testnet URL"
                          required
                          ref={input => {
                            this.ethTestnet = input;
                          }}
                        />
                      </div>
                      <div className="form-group form-group-default required">
                        <label>Eth - Mainnet</label>
                        <input
                          type="text"
                          className="form-control"
                          name="api-host"
                          placeholder="Infura mainnet url"
                          required
                          ref={input => {
                            this.ethMainnet = input;
                          }}
                        />
                      </div>
                    </div>
                    <LaddaButton
                      data-size={S}
                      loading={this.state.loading}
                      disabled={this.state.loading}
                      data-style={SLIDE_UP}
                      data-spinner-size={30}
                      data-spinner-lines={12}
                      className="btn btn-success pull-right "
                      onClick={() => {
                        this.addModal();
                      }}
                      style={{ marginTop: '10px' }}
                    >
                      <i className="fa fa-plus-circle" /> &nbsp;&nbsp;Add Cluster
                    </LaddaButton>
                    &nbsp;&nbsp;
                    <button
                      type="button"
                      className="btn btn-default m-t-15"
                      data-dismiss="modal"
                      onClick={() => {
                        $('#modalAddConfig').modal('hide');
                        this.isModalShowing = false;
                      }}
                    >
                      Close
                    </button>
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
