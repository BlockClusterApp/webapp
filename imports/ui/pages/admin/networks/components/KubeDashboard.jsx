import React, { Component } from "react";
import helpers from "../../../../../modules/helpers";
import moment from "moment";

export default class KubeDashboard extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <div class="card card-borderless">
        <ul
          class="nav nav-tabs nav-tabs-simple hidden-sm-down"
          role="tablist"
          data-init-reponsive-tabs="dropdownfx"
        >
          <li class="nav-item">
            <a
              class="active"
              data-toggle="tab"
              role="tab"
              data-target="#tab2Pods"
              href="#"
            >
              Pods
            </a>
          </li>
          <li class="nav-item">
            <a
              href="#"
              data-toggle="tab"
              role="tab"
              data-target="#tab2Deployments"
            >
              Deployments
            </a>
          </li>
          <li class="nav-item">
            <a href="#" data-toggle="tab" role="tab" data-target="#tab2Volumes">
              Volumes
            </a>
          </li>
          <li class="nav-item">
            <a href="#" data-toggle="tab" role="tab" data-target="#tab2Service">
              Services
            </a>
          </li>
          <li class="nav-item">
            <a href="#" data-toggle="tab" role="tab" data-target="#tab2Ingress">
              Ingress
            </a>
          </li>
        </ul>
        <div class="nav-tab-dropdown cs-wrapper full-width hidden-md-up">
          <div class="cs-select cs-skin-slide full-width" tabindex="0">
            <span class="cs-placeholder">Pods</span>
            <div class="cs-options">
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
              class="cs-select cs-skin-slide full-width"
              data-init-plugin="cs-select"
            >
              <option value="#tab2Pods" selected="">
                Pods
              </option>
              <option value="#tab2Deployments">Deployments</option>
              <option value="#tab2Volumes">Volumes</option>
              <option value="#tab2Services">Services</option>
              <option value="#tab2Ingress">Ingress</option>
            </select>
            <div class="cs-backdrop" />
          </div>
        </div>
        <div class="tab-content">
          <div class="tab-pane active" id="tab2Pods">
            <div class="row column-seperation">
              <p>Pods Coming soon</p>
            </div>
          </div>
          <div class="tab-pane" id="tab2Deployments">
            <div class="row column-seperation">
              <p>Deployments Coming soon</p>
            </div>
          </div>
          <div class="tab-pane" id="tab2Volumes">
            <div class="row column-seperation">
              <p>Volumes Coming soon</p>
            </div>
          </div>
          <div class="tab-pane" id="tab2Services">
            <div class="row column-seperation">
              <p>Services Coming soon</p>
            </div>
          </div>
          <div class="tab-pane" id="tab2Ingress">
            <div class="row column-seperation">
              <p>Ingress Coming soon</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
