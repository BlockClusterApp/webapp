import React, { Component } from "react";
import helpers from "../../../../../modules/helpers";
import moment from "moment";
import ReactHtmlParser from "react-html-parser";

import './KubeDashboard.scss';

export default class KubeDashboard extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount(){
    Meteor.call("fetchPodStatus", this.props.networkId, (err, res) => {
      if(err){
        return console.log(err);
      }
      this.setState({
        pod: res
      });
    });
    Meteor.call("fetchServiceStatus", this.props.networkId, (err, res) => {
      if(err){
        return console.log(err);
      }
      this.setState({
        service: res
      });
    });

    Meteor.call("fetchDeploymentStatus", this.props.networkId, (err, res) => {
      if(err){
        return console.log(err);
      }
      this.setState({
        deployments: res
      });
    })

    Meteor.call("fetchPVCStatus", this.props.networkId, (err, res) => {
      if(err){
        return console.log(err);
      }
      this.setState({
        pvc: res
      });
    })

    Meteor.call("fetchIngressStatus", this.props.networkId, (err, res) => {
      if(err){
        return console.log(err);
      }
      this.setState({
        ingress: res
      });
    })
  }

  getPodView = () => {
    let pod = this.state.pod;
    if(!pod) {
      return <p>Pods Status Loading</p>;
    }

    pod = pod.pods[0];
    if(!pod) {
      return <p>No data available</p>;
    }

    const containerNames = [];
    const containersHeaders = pod.spec.containers.map(container => {
      containerNames.push(container.name);
      return (
        <li className="" aria-expanded="false" key={container.name}>
          <a href={`#${container.name}`} data-toggle="tab" role="tab" className="b-a b-grey text-master active" aria-expanded="true">
            {helpers.firstLetterCapital(container.name)}
          </a>
        </li>
      )
    });

    const containerContents = containerNames.map((containerName, index) => {
      const containerSpec = pod.spec.containers.find(i => i.name === containerName);
      const containerStatus = pod.status.containerStatuses.find(i => i.name === containerName);
      return (
        <div className="col-md-4 padding-25  d-flex flex-column" id={`${containerName}`} key={containerName}>
          <h5>{helpers.firstLetterCapital(containerName)}</h5>
          <p className="hint-text all-caps font-montserrat small no-margin text-success " ><b>{helpers.firstLetterCapital(Object.keys(containerStatus.state)[0])}</b></p>
          <p className="font-montserrat  no-margin fs-12">Since {moment(Object.values(containerStatus.state)[0].startedAt).format('DD-MMM-YY kk:ss')}</p>
          <br />
          {containerSpec.resources && containerSpec.resources.requests && <div><p className="hint-text font-montserrat small no-margin  all-caps fs-14">Resources</p>
          <p className="no-margin text-primary ">Requests</p>
          <p className="font-montserrat  no-margin fs-11">{containerSpec.resources.requests.cpu} | {containerSpec.resources.requests.memory}</p>
          <p className="no-margin text-danger fs-12">Limits</p>
          <p className="font-montserrat  no-margin fs-11">{containerSpec.resources.limits.cpu} | {containerSpec.resources.limits.memory}</p>
          <br /></div>
          }
          <p className="hint-text all-caps font-montserrat small no-margin ">Image</p>
          <textarea className="font-montserrat  no-margin " style={{border: 'none', fontSize: '11px'}} disabled>{containerStatus.imageID}</textarea>
        </div>
      )
    });

    const volumes = pod.spec.volumes.map(vol => {
      return (
        <p style={{margin: '0px'}} key={vol.name}>{vol.name} | {vol.persistentVolumeClaim && <span className="label-custom">{vol.persistentVolumeClaim.claimName}</span>} {vol.secret && <span className="label-custom">{vol.secret.secretName}</span>}</p>
      )
    })

    return (
      <div className="full-width">
        <div className="row" style={{paddingLeft: '25px', paddingRight: '25px'}}>
          <div className="col-md-6 d-flex flex-column">
            <h5>{pod.name}</h5>
            <p><span className="label-custom no-margin">Namespace:</span> {pod.namespace}</p>
            <p><span className="label-custom no-margin">Node name:</span> {pod.spec.nodeName}</p>
            <p><span className="label-custom no-margin">Restart policy:</span> {pod.spec.restartPolicy}</p>
            <p><span className="label-custom">Created At:</span> {pod.createdAt}</p>
          </div>
          <div className="col-md-6 d-flex flex-column">
            <h6>Volumes</h6>
              {volumes}
          </div>
        </div>
        <div className="row">
          {containerContents}
        </div>
      </div>
    )
  }

  getServiceView = () => {
    let service = this.state.service;
    if(!service) {
      return <p>Service Status Loading</p>;
    }

    const leftPorts = [];
    const rightPorts = [];

    service.ports.forEach((port, index) => {
      const view =  (
        <div key={index+1}>
          <p className="hint-text font-montserrat small no-margin  all-caps fs-14 text-primary"><b>{port.name}</b></p>
          <p className="all-caps no-margin text-default ">{port.protocol} | {port.port}</p>
          <p className="all-caps text-default ">{port.targetPort} -> {port.nodePort}</p>
        </div>
      )
      if(index % 2 === 0 ){
        leftPorts.push(view)
      } else {
        rightPorts.push(view);
      }
    });

    return (
      <div className="full-width">
        <div className="row" style={{paddingLeft: '25px', paddingRight: '25px'}}>
          <div className="col-md-6 d-flex flex-column">
            <h5>{service.name}</h5>
            <p><span className="label-custom no-margin">Namespace:</span> {service.namespace}</p>
            <p><span className="label-custom no-margin">Created At:</span> {service.createdAt}</p>
          </div>
          <div className="col-md-6 d-flex flex-column">
            <h5 className="all-caps font-montserrat ">Ports</h5>
            <div className="row">
              <div className="col-md-6 d-flex flex-column">
                {leftPorts}
              </div>
              <div className="col-md-6 d-flex flex-column">
                {rightPorts}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  getDeploymentView = () => {
    let deployments = this.state.deployments;
    if(!deployments) {
      return <p>Deployments Status Loading</p>;
    }

    return (
      <div className="full-width">
        <div className="row" style={{paddingLeft: '25px', paddingRight: '25px'}}>
          <div className="col-md-6 d-flex flex-column">
            <h5>{deployments.name}</h5>
            <p><span className="label-custom no-margin">Namespace:</span> {deployments.namespace}</p>
            <p><span className="label-custom no-margin">Created At:</span> {deployments.createdAt}</p>
            <p><span className="label-custom no-margin">Replicas:</span> {deployments.status.readyReplicas}/{deployments.status.replicas}</p>
          </div>
          <div className="col-md-6 d-flex flex-column">
            <h6>Strategy</h6>
            <p><span className="label-custom no-margin">Type:</span> {deployments.strategy.type}</p>
          </div>
        </div>
      </div>
    )
  }

  getPVCView = () => {
    let pvc = this.state.pvc;
    if(!pvc) {
      return <p>PVC Status Loading</p>;
    }

    return (
      <div className="full-width">
        <div className="row" style={{paddingLeft: '25px', paddingRight: '25px'}}>
          <div className="col-md-6 d-flex flex-column">
            <h5>{pvc.name}</h5>
            <p><span className="label-custom no-margin">Namespace:</span> {pvc.namespace}</p>
            <p><span className="label-custom no-margin">Created At:</span> {pvc.createdAt}</p>
            <p><span className="label-custom no-margin">Storage Provisioner:</span> {pvc.provisioner}</p>
            <br />
            <h6>Status</h6>
            <p><span className="label-custom no-margin">Phase:</span> {pvc.status.phase}</p>
            <p><span className="label-custom no-margin">Access Mode:</span> {pvc.status.accessModes.join(', ')}</p>
            <p><span className="label-custom no-margin">Capacity:</span> {pvc.status.capacity.storage}</p>
          </div>

          <div className="col-md-6 d-flex flex-column">
            <h6>Specs</h6>
            <p><b>{pvc.spec.volumeName}</b></p>
            <p><span className="label-custom no-margin">Storage Class:</span> {pvc.spec.storageClassName}</p>
            <p><span className="label-custom no-margin">Storage Request:</span> {pvc.spec.resources.requests.storage}</p>
            <p><span className="label-custom no-margin">Access Modes:</span> {pvc.spec.accessModes.join(', ')}</p>
          </div>
        </div>
      </div>
    )
  }



  getIngressView = () => {
    let ingress = this.state.ingress;
    if(!ingress) {
      return <p>Ingress Status Loading</p>;
    }

    const rules = ingress.rules.map((rule, index) => {
      const paths = rule.http.paths;
      const pathView = paths.map((path, index) => {
        return (<div key={index+1} style={{background: ''}}>
          <p className="no-margin" style={{fontFamily: 'monospace'}}>{path.path}</p>
          <p className="label-custom no-margin">{path.backend.serviceName}:{path.backend.servicePort}</p>
          <br />
        </div>);
      });
      return (
        <div key={index+1}>
          <h6 className="font-montserrat  all-caps text-primary">{rule.host}</h6>
          {pathView}
        </div>
      )
    });

    return (
      <div className="full-width">
        <div className="row" style={{paddingLeft: '25px', paddingRight: '25px'}}>
          <div className="col-md-6 d-flex flex-column">
            <h5>{ingress.name}</h5>
            <p><span className="label-custom no-margin">Namespace:</span> {ingress.namespace}</p>
            <p><span className="label-custom no-margin">Created At:</span> {ingress.createdAt}</p>
            <br />
            <h6 className="font-montserrat  all-caps">Rules</h6>
            {rules}
          </div>

          <div className="col-md-6 d-flex flex-column">
            <h6 className="font-montserrat  all-caps">Configuration</h6>
            <textarea style={{padding: '5px', background: '#efefef', border: 'none', minHeight: '400px', fontSize: '12px', fontFamily: 'monospace'}} disabled>
              {ReactHtmlParser(ingress.configuration)}
            </textarea>
          </div>
        </div>
      </div>
    )
  }

  render() {
    return (
      <div className="card card-borderless kube-dashboard">
        <ul
          className="nav nav-tabs nav-tabs-simple hidden-sm-down"
          role="tablist"
          data-init-reponsive-tabs="dropdownfx"
        >
          <li className="nav-item">
            <a
              className="active"
              data-toggle="tab"
              role="tab"
              data-target="#tab2Pods"
              href="#"
            >
              Pods
            </a>
          </li>
          <li className="nav-item">
            <a
              href="#"
              data-toggle="tab"
              role="tab"
              data-target="#tab2Deployments"
            >
              Deployments
            </a>
          </li>
          <li className="nav-item">
            <a href="#" data-toggle="tab" role="tab" data-target="#tab2Volumes">
              Volumes
            </a>
          </li>
          <li className="nav-item">
            <a href="#" data-toggle="tab" role="tab" data-target="#tab2Services">
              Services
            </a>
          </li>
          <li className="nav-item">
            <a href="#" data-toggle="tab" role="tab" data-target="#tab2Ingress">
              Ingress
            </a>
          </li>
        </ul>
        <div className="nav-tab-dropdown cs-wrapper full-width hidden-md-up">
          <div className="cs-select cs-skin-slide full-width" tabIndex="0">
            <span className="cs-placeholder">Pods</span>
            <div className="cs-options">
              <ul>
                <li data-option="" data-value="#tab2Pods">
                  <span>Pods</span>
                </li>
                <li data-option="" data-value="#tab2Deployments">
                  <span>Deployments</span>
                </li>
                <li data-option="" data-value="#tab2Volumes">
                  <span>Volumes</span>
                </li>
                <li data-option="" data-value="#tab2Services">
                  <span>Services</span>
                </li>
                <li data-option="" data-value="#tab2Ingress">
                  <span>Ingress</span>
                </li>
              </ul>
            </div>
            <select
              className="cs-select cs-skin-slide full-width"
              data-init-plugin="cs-select"
            >
              <option defaultValue="#tab2Pods" selected="">
                Pods
              </option>
              <option defaultValue="#tab2Deployments">Deployments</option>
              <option defaultValue="#tab2Volumes">Volumes</option>
              <option defaultValue="#tab2Services">Services</option>
              <option defaultValue="#tab2Ingress">Ingress</option>
            </select>
            <div className="cs-backdrop" />
          </div>
        </div>
        <div className="tab-content">
          <div className="tab-pane active" id="tab2Pods">
            <div className="row column-seperation">
              {this.getPodView()}
            </div>
          </div>
          <div className="tab-pane" id="tab2Deployments">
            <div className="row column-seperation">
              {this.getDeploymentView()}
            </div>
          </div>
          <div className="tab-pane" id="tab2Volumes">
            <div className="row column-seperation">
              {this.getPVCView()}
            </div>
          </div>
          <div className="tab-pane" id="tab2Services">
            <div className="row column-seperation">
              {this.getServiceView()}
            </div>
          </div>
          <div className="tab-pane" id="tab2Ingress">
            <div className="row column-seperation">
              {this.getIngressView()}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
