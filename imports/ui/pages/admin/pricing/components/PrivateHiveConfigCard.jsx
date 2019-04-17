import React from 'react';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';
import { invalid } from 'moment';

export default class PrivateHiveConfigCard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isInEditMode: props.isInEditMode || false,
      peerCount: 2,
      ordererCount: 3,
      version: '1.1',
      isFolded: true,
      category: props.config.category || 'peer',
      ordererType: props.config.ordererType || 'solo',
    };
    this.locationMapping = {};
  }

  edit = () => {
    this.setState({
      isInEditMode: true,
    });
  };

  save = () => {
    this.setState({
      loading: true,
    });

    let cpu, ram, disk, isDiskChangeable, kafka, zookeeper;

    const networkConfig = {};
    // if (this.typeSelector.value === 'peer' || (this.state.category === 'orderer' && this.state.ordererType === 'solo')) {
      cpu = this.peerCpu.value || 1;
      ram = this.peerMemory.value || 1;
      disk = this.peerDisk.value || 10;
      isDiskChangeable = this.peerDiskChangeable;
    // }

    if (this.state.category === 'orderer' && this.state.ordererType === 'kafka') {
      kafka = {
        cpu: this.kafkaCpu.value || 1,
        ram: this.kafkaMemory.value || 1,
        disk: this.kafkaDisk.value || 10,
      };
      zookeeper = {
        cpu: this.zkCpu.value || 1,
        ram: this.zkMemory.value || 1,
        disk: this.zkDisk.value || 10,
      };
    }

    Meteor.call(
      'upsertPrivateHiveNetworkConfig',
      {
        params: {
          _id: this.config._id,
          cpu,
          ram,
          disk,
          isDiskChangeable,
          networkConfig,
          kafka,
          zookeeper,
          ordererType: this.state.ordererType,
          name: this.configName.value,
          'cost.monthly': this.configMonthlyCost.value,
          'cost.hourly': this.state.costHourly,
          showInNetworkSelection: this.showInNetworkSelection,
          locationMapping: this.locationMapping,
          category: this.typeSelector.value,
        },
        userId: Meteor.userId(),
        type: 'privatehive',
      },
      () => {
        this.setState({
          loading: false,
          isInEditMode: false,
        });
      }
    );
  };

  delete = () => {
    this.setState({
      loading: true,
    });
    Meteor.call('deleteNetworkConfig', { _id: this.config._id }, (err, res) => {
      this.setState({
        loading: false,
        isInEditMode: false,
      });
    });
  };

  calculateHourly = () => {
    const monthly = Number(this.configMonthlyCost.value);

    this.setState({
      costHourly: monthly ? Number(monthly / (30 * 24)).toFixed(4) : 0,
    });
  };

  render() {
    let { config, locations } = this.props;
    const isInEditMode = this.props.isInEditMode || this.state.isInEditMode;

    if (!config) {
      config = {};
    }

    if (!config.cost) {
      config.cost = {};
    }

    if (!config.kafka) {
      config.kafka = {};
    }

    if (!config.zookeeper) {
      config.zookeeper = {};
    }

    const typeSelector = (
      <select
        ref={input => (this.typeSelector = input)}
        className="form-control form-group-default"
        onChange={() => {
          this.setState({
            category: this.typeSelector.value,
          });
        }}
      >
        <option value="peer" selected={config.category === 'peer'}>
          Peer
        </option>
        <option value="orderer" selected={config.category === 'orderer'}>
          Orderer
        </option>
      </select>
    );

    this.config = config;

    let locationEditView = [];
    let locationsEnabled = [];
    if (!config.locations) {
      locations.forEach(loc => {
        locationsEnabled.push(loc.locationCode);
        this.locationMapping[loc.locationCode] = this.locationMapping[loc.locationCode] === false ? false : true;
        locationEditView.push(
          <div className="col-md-4 col-lg-3 col-sm-6">
            <label htmlFor={`label_${loc.locationCode}`} style={{ cursor: 'pointer' }}>
              {loc.locationCode}
            </label>
            &nbsp;
            <input
              type="checkbox"
              id={`label_${loc.locationCode}`}
              defaultChecked={true}
              onClick={e => {
                this.locationMapping[loc.locationCode] = e.target.checked;
              }}
            />
          </div>
        );
      });
    } else {
      locations.forEach(loc => {
        const isChecked = config.locations.includes(loc.locationCode);
        this.locationMapping[loc.locationCode] = isChecked;
        if (isChecked) {
          locationsEnabled.push(loc.locationCode);
        }
        locationEditView.push(
          <div className="col-md-4 col-lg-3 col-sm-6">
            <label htmlFor={`label_${loc.locationCode}`} style={{ cursor: 'pointer' }}>
              {loc.locationCode}
            </label>
            &nbsp;
            <input
              type="checkbox"
              id={`label_${loc.locationCode}`}
              defaultChecked={isChecked}
              onClick={e => {
                this.locationMapping[loc.locationCode] = e.target.checked;
              }}
            />
          </div>
        );
      });
    }

    const FoldedMode = (
      <div className="card bg-white" onClick={() => this.setState({ isFolded: false })}>
        <div className="card-header">
          <div className="card-title full-width">
            <h5 className="text-primary m-b-0 m-t-0" style={{ display: 'inline' }}>
              {config.name} | {config.category}
            </h5>
            <i className="fa fa-close pull-right p-t-5 fs-16" style={{ cursor: 'pointer' }} onClick={() => this.setState({ isFolded: true })} />
            <i className="fa fa-pencil pull-right p-t-5 fs-16" style={{ cursor: 'pointer' }} onClick={() => this.setState({ isFolded: false, isInEditMode: true })} />
          </div>
        </div>
        <div className="card-block">
          <div className="row">
            <div className="col-md-12">
              <b>Available in: </b> {locationsEnabled.join(', ')}
            </div>
          </div>
          <div className="row">
            <div className="col-md-12 fs-16">
              <b>$ {config.cost.monthly} / month</b>
            </div>
          </div>
        </div>
      </div>
    );

    const EditMode = (
      <div className="card bg-white">
        <div className="card-header ">
          <div className="card-title full-width">
            <div className="row">
              <div className={`${this.props.isInEditMode ? 'col-md-10' : 'col-md-8'}`}>
                <h5 className="text-primary m-b-0 m-t-0" style={{ display: 'inline' }}>
                  <input type="text" className="form-control" placeholder="Config name" defaultValue={config.name} ref={input => (this.configName = input)} />
                </h5>
              </div>
              <div className="col-md-2">
                <label htmlFor="showInNetworkSelection" style={{ textTransform: 'none' }}>
                  Public
                </label>
                &nbsp;
                <input
                  type="checkbox"
                  name={`public_${config._id}`}
                  defaultChecked={config.showInNetworkSelection}
                  onClick={e => {
                    this.showInNetworkSelection = e.target.checked;
                  }}
                />
              </div>
              {!this.props.isInEditMode && (
                <div className="col-md-1">
                  <i className="fa fa-trash  p-t-5 fs-16" title="Delete Config" style={{ cursor: 'pointer' }} onClick={this.delete} />
                </div>
              )}
              {!this.props.isInEditMode && (
                <div className="col-md-1">
                  <i
                    className="fa fa-remove  p-t-5 fs-16"
                    title="Cancel"
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      this.setState({ isInEditMode: false });
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="card-block">
          <div className="row">
            <div className="col-md-12">
              <div className="form-group form-group-default ">
                <label>Node Type</label>
                {typeSelector}
              </div>
            </div>
          </div>

          {this.state.category === 'orderer' && (
            <div className="row p-t-10">
              <div className="col-md-12">
                <label>Orderer Type</label>
                <select
                  ref={input => (this.ordererTypeSelector = input)}
                  className="form-control form-group-default"
                  onChange={() => {
                    this.setState({
                      ordererType: this.ordererTypeSelector.value,
                    });
                  }}
                >
                  <option value="solo" selected={config.ordererType === 'solo'}>
                    Solo
                  </option>
                  <option value="kafka" selected={config.ordererType === 'kafka'}>
                    Kafka
                  </option>
                </select>
              </div>
            </div>
          )}
          <div className="row">
            <div className="col-md-12" style={{ fontWeight: 'bold', fontSize: '14px', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
              Resource Allocation {this.state.category === 'orderer' && '- Orderer Pod'}
            </div>
          </div>

          <div className="row p-t-10">
            <div className="col-md-4">
              <i className="fa fa-save" />
              &nbsp;CPU&nbsp;
              <input type="number" className="form-control" placeholder="Peer CPU" defaultValue={config.cpu} ref={input => (this.peerCpu = input)} />
            </div>
            <div className="col-md-4">
              <i className="fa fa-save" />
              &nbsp;Memory&nbsp;
              <input type="number" className="form-control" placeholder="Peer Memory" defaultValue={config.ram} ref={input => (this.peerMemory = input)} />
            </div>
            <div className="col-md-4">
              <i className="fa fa-save" />
              &nbsp;Disk Space &nbsp;
              <input type="number" className="form-control" placeholder="Peer Disk" defaultValue={config.disk} ref={input => (this.peerDisk = input)} />
              <br />
              <label htmlFor="peerDiskChangeable fs-12">Disk Changeable?</label>&nbsp;
              <input
                type="checkbox"
                name="peerDiskChangeable"
                defaultChecked={config.isDiskChangeable}
                onClick={e => {
                  this.peerDiskChangeable = e.target.checked;
                }}
              />
            </div>
          </div>

          {this.state.category === 'orderer' && this.state.ordererType === 'kafka' && (
            <div className="row">
              <div className="col-md-12" style={{ fontWeight: 'bold', fontSize: '14px', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                Resource Allocation {this.state.category === 'orderer' && '- Kafka'}
              </div>
            </div>
          )}

          {this.state.category === 'orderer' && this.state.ordererType === 'kafka' && (
            <div className="row p-t-10">
              <div className="col-md-4">
                <i className="fa fa-save" />
                &nbsp;CPU&nbsp;
                <input type="number" className="form-control" placeholder="Kafka CPU" defaultValue={config.kafka.cpu} ref={input => (this.kafkaCpu = input)} />
              </div>
              <div className="col-md-4">
                <i className="fa fa-save" />
                &nbsp;Memory&nbsp;
                <input type="number" className="form-control" placeholder="Kafka Memory" defaultValue={config.kafka.ram} ref={input => (this.kafkaMemory = input)} />
              </div>
              <div className="col-md-4">
                <i className="fa fa-save" />
                &nbsp;Disk Space &nbsp;
                <input type="number" className="form-control" placeholder="Kafka Disk" defaultValue={config.kafka.disk} ref={input => (this.kafkaDisk = input)} />
              </div>
            </div>
          )}

          {this.state.category === 'orderer' && this.state.ordererType === 'kafka' && (
            <div className="row">
              <div className="col-md-12" style={{ fontWeight: 'bold', fontSize: '14px', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                Resource Allocation {this.state.category === 'orderer' && '- Zookeper'}
              </div>
            </div>
          )}

          {this.state.category === 'orderer' && this.state.ordererType === 'kafka' && (
            <div className="row p-t-10">
              <div className="col-md-4">
                <i className="fa fa-save" />
                &nbsp;CPU&nbsp;
                <input type="number" className="form-control" placeholder="Zookeeper CPU" defaultValue={config.zookeeper.cpu} ref={input => (this.zkCpu = input)} />
              </div>
              <div className="col-md-4">
                <i className="fa fa-save" />
                &nbsp;Memory&nbsp;
                <input type="number" className="form-control" placeholder="Zookeeper Memory" defaultValue={config.zookeeper.ram} ref={input => (this.zkMemory = input)} />
              </div>
              <div className="col-md-4">
                <i className="fa fa-save" />
                &nbsp;Disk Space &nbsp;
                <input type="number" className="form-control" placeholder="Zookeeper Disk" defaultValue={config.zookeeper.disk} ref={input => (this.zkDisk = input)} />
              </div>
            </div>
          )}
          <div className="row">
            <div className="col-md-12 bold">Availibility:</div>
            {locationEditView}
          </div>
        </div>
        {/* <div className="card-block">
          <div className="row">
            <div className="col-md-12" style={{ fontWeight: 'bold', fontSize: '16px', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
              Fabric Core configs
            </div>
          </div>
          <div className="row p-t-10">
            <div className="col-md-4">
              <i className="fa fa-joomla" />
              &nbsp;Orderers &nbsp;
              <input
                type="number"
                className="form-control"
                placeholder="orderer"
                defaultValue={config.fabric.orderers || this.state.ordererCount}
                ref={input => (this.ordererCount = input)}
                disabled
              />
              <br />
            </div>
            <div className="col-md-4">
              <i className="fa fa-keyboard-o" />
              &nbsp;Peers &nbsp;
              <input
                type="number"
                className="form-control"
                placeholder="peers"
                defaultValue={config.fabric.peers || this.state.peerCount}
                ref={input => (this.peerCount = input)}
                disabled
              />
            </div>
            <div className="col-md-4">
              <i className="fa fa-keyboard-o" />
              &nbsp;Version &nbsp;
              <input
                type="text"
                className="form-control"
                placeholder="peers"
                defaultValue={config.fabric.version || this.state.version}
                ref={input => (this.version = input)}
                disabled
              />
            </div>
          </div>
          <div className="row">
            <div className="col-md-12" style={{ fontWeight: 'bold', fontSize: '16px', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
              Resource Allocation
            </div>
          </div>
          <div className="row p-t-10">
            <div className="col-md-4">
              <i className="fa fa-save" />
              &nbsp;Kafka CPU (vCPUs)&nbsp;
              <input type="number" className="form-control" placeholder="Kafka CPU" defaultValue={config.kafka.cpu} ref={input => (this.kafkaCpu = input)} />
            </div>
            <div className="col-md-4">
              <i className="fa fa-save" />
              &nbsp;Orderer CPU (vCPUs)&nbsp;
              <input type="number" className="form-control" placeholder="Orderer CPU" defaultValue={config.orderer.cpu} ref={input => (this.ordererCpu = input)} />
            </div>
            <div className="col-md-4">
              <i className="fa fa-save" />
              &nbsp;Peer CPU (vCPUs) &nbsp;
              <input type="number" className="form-control" placeholder="Peer CPU" defaultValue={config.peer.cpu} ref={input => (this.peerCpu = input)} />
            </div>
          </div>
          <div className="row p-t-10">
            <div className="col-md-4">
              <i className="fa fa-save" />
              &nbsp;Kafka RAM (GB)&nbsp;
              <input type="number" className="form-control" placeholder="Kafka RAM" defaultValue={config.kafka.ram} ref={input => (this.kafkaRAM = input)} />
            </div>
            <div className="col-md-4">
              <i className="fa fa-save" />
              &nbsp;Orderer RAM (GB)&nbsp;
              <input type="number" className="form-control" placeholder="Orderer RAM" defaultValue={config.orderer.ram} ref={input => (this.ordererRAM = input)} />
            </div>
            <div className="col-md-4">
              <i className="fa fa-save" />
              &nbsp;Peer RAM (GB) &nbsp;
              <input type="number" className="form-control" placeholder="Peer RAM" defaultValue={config.peer.ram} ref={input => (this.peerRAM = input)} />
            </div>
          </div>
          <div className="row p-t-10">
            <div className="col-md-4">
              <i className="fa fa-save" />
              &nbsp;Kafka Disk Space (GB)&nbsp;
              <input type="number" className="form-control" placeholder="Kafka Disk Space" defaultValue={config.kafka.disk} ref={input => (this.kafkaDiskSpace = input)} />
              <br />
              <label htmlFor="kafkaDiskChangeable">Changeable?</label>&nbsp;
              <input
                type="checkbox"
                name={`kafkaDiskChangeable_${config._id}`}
                defaultChecked={config.kafka.isDiskChangeable}
                onClick={e => {
                  this.isKafkaDiskChangeable = e.target.checked;
                }}
              />
            </div>
            <div className="col-md-4">
              <i className="fa fa-save" />
              &nbsp;Orderer Disk Space (GB)&nbsp;
              <input type="number" className="form-control" placeholder="Orderer Disk Space" defaultValue={config.orderer.disk} ref={input => (this.ordererDiskSpace = input)} />
              <br />
              <label htmlFor="ordererDiskChangeable">Changeable?</label>&nbsp;
              <input
                type="checkbox"
                name={`ordererDiskChangeable_${config._id}`}
                defaultChecked={config.orderer.isDiskChangeable}
                onClick={e => {
                  this.isOrdererDiskChangeable = e.target.checked;
                }}
              />
            </div>
            <div className="col-md-4">
              <i className="fa fa-save" />
              &nbsp;Data Disk Space (GB)&nbsp;
              <input type="number" className="form-control" placeholder="Data Disk Space" defaultValue={config.data.disk} ref={input => (this.dataDiskSpace = input)} />
              <br />
              <label htmlFor="dataDiskChangeable">Changeable?</label>&nbsp;
              <input
                type="checkbox"
                name={`dataDiskChangeable_${config._id}`}
                defaultChecked={config.data.isDiskChangeable}
                onClick={e => {
                  this.isDataDiskChangeable = e.target.checked;
                }}
              />
            </div>
          </div>
          <div className="row">
            <div className="col-md-12 bold">Availibility:</div>
            {locationEditView}
          </div>
        </div> */}
        <div className="card-footer clearfix">
          <div className="row">
            <div className="col-md-3">
              <input
                type="number"
                className="form-control"
                placeholder="Monthly Cost"
                defaultValue={config.cost.monthly}
                ref={input => (this.configMonthlyCost = input)}
                onChange={this.calculateHourly}
              />
            </div>
            <div className="col-md-2 p-t-10">/ month</div>
            <div className="col-md-3 p-t-10">= $ {this.state.costHourly} / hr</div>
            <div className="col-md-4">
              <LaddaButton
                data-size={S}
                data-style={SLIDE_UP}
                data-spinner-size={30}
                data-spinner-lines={12}
                className="btn btn-success pull-right "
                onClick={this.save}
                loading={this.state.loading}
              >
                <i className="fa fa-save" /> &nbsp;&nbsp;Save
              </LaddaButton>
            </div>
          </div>
        </div>
      </div>
    );

    if (isInEditMode) return EditMode;
    // if (this.state.isFolded) return FoldedMode;
    // return DisplayMode;
    return FoldedMode;
  }
}
