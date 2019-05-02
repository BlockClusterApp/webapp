import React, { Component } from 'react';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';

export default class PaymentModal extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.isModalShowing = false;
  }

  open = () => {
    $('#modalAddCluster').modal('show');
    this.isModalShowing = true;
  };
  close = () => {
    $('#modalAddCluster').modal('hide');
    this.isModalShowing = true;
  };

  componentDidMount = () => {
    this.props.modalEventFns && this.props.modalEventFns(this.open, this.close);
  };

  render() {
    return (
      <div className="modal fade slide-right" id="modalAddCluster" tabIndex="-1" role="dialog" aria-hidden="true">
        <div className="modal-dialog modal-md">
          <div className="modal-content-wrapper">
            <div className="modal-content">
              <button type="button" className="close" data-dismiss="modal" aria-hidden="true">
                <i className="pg-close fs-14" />
              </button>
              <div className="container-md-height full-height">
                <div className="row-md-height">
                  <div className="modal-body col-md-height col-middle">
                    <h3 className="text-primary ">Add Cluster</h3>
                    <br />
                    <div className="form-group form-group-default required">
                      <label>Cluster Identifier</label>
                      <input
                        type="text"
                        className="form-control"
                        name="cluster-identifier"
                        placeholder="Unique cluster identifier"
                        required
                        ref={input => {
                          this.identifier = input;
                        }}
                      />
                    </div>
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
                    <div className="form-group form-group-default required">
                      <label>Master API Server host</label>
                      <input
                        type="text"
                        className="form-control"
                        name="master-api"
                        placeholder="API Host of kubernetes API server"
                        required
                        ref={input => {
                          this.masterAPIHost = input;
                        }}
                      />
                    </div>
                    <div className="form-group form-group-default required">
                      <label>Location Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="location-code"
                        placeholder="Name of location to be displayed"
                        required
                        ref={input => {
                          this.locationName = input;
                        }}
                      />
                    </div>
                    <div className="form-group form-group-default required">
                      <label>Worker Node IP</label>
                      <input
                        type="text"
                        className="form-control"
                        name="worker-node"
                        placeholder="IP of the cluster worker nodes"
                        required
                        ref={input => {
                          this.workerNodeIP = input;
                        }}
                      />
                    </div>
                    <div className="form-group form-group-default required">
                      <label>Ingress Domain</label>
                      <input
                        type="text"
                        className="form-control"
                        name="ingress-domain"
                        placeholder="Domain where ingress controller is reachable"
                        required
                        ref={input => {
                          this.ingress = input;
                        }}
                      />
                    </div>
                    <div className="form-group form-group-default required">
                      <label>API Host</label>
                      <input
                        type="text"
                        className="form-control"
                        name="api-host"
                        placeholder="Host name where dashboard is running"
                        required
                        ref={input => {
                          this.apiHost = input;
                        }}
                      />
                    </div>

                    <button
                      type="button"
                      className="btn btn-default m-t-15"
                      data-dismiss="modal"
                      onClick={() => {
                        $('#modalAddCluster').modal('hide');
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
