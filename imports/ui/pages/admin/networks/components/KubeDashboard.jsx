import React, { Component } from "react";
import helpers from "../../../../../modules/helpers";
import moment from "moment";

import './KubeDashboard.scss';

export default class KubeDashboard extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount(){
    Meteor.call("fetchPodStatus", this.props.networkId, (err, res) => {
      console.log("Pod status", res);
      this.setState({
        pod: res
      })
    });
  }

  getPodView = () => {
    let pod = this.state.pod;
    if(!pod) {
      return <p>Pods Status Loading</p>;
    }

    pod = pod.pods[0];

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
          <p className="font-montserrat  no-margin fs-12">Since {moment(Object.values(containerStatus.state)[0].startedAt).format('DD-MMM-YY HH:mm:SS')}</p>
          <br />
          <p className="hint-text font-montserrat small no-margin  all-caps fs-14">Resources</p>
          <p className="no-margin text-primary ">Requests</p>
          <p className="font-montserrat  no-margin fs-11">{containerSpec.resources.requests.cpu} | {containerSpec.resources.requests.memory}</p>
          <p className="no-margin text-danger fs-12">Limits</p>
          <p className="font-montserrat  no-margin fs-11">{containerSpec.resources.limits.cpu} | {containerSpec.resources.limits.memory}</p>
          <br />
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
            <p><span className="label-custom">Namespace:</span> {pod.namespace}</p>
            <p><span className="label-custom">Node name:</span> {pod.spec.nodeName}</p>
            <p><span className="label-custom">Restart policy:</span> {pod.spec.restartPolicy}</p>
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
            <a href="#" data-toggle="tab" role="tab" data-target="#tab2Service">
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
              <p>Deployments Coming soon</p>
            </div>
          </div>
          <div className="tab-pane" id="tab2Volumes">
            <div className="row column-seperation">
              <p>Volumes Coming soon</p>
            </div>
          </div>
          <div className="tab-pane" id="tab2Services">
            <div className="row column-seperation">
              <p>Services Coming soon</p>
            </div>
          </div>
          <div className="tab-pane" id="tab2Ingress">
            <div className="row column-seperation">
              <p>Ingress Coming soon</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
