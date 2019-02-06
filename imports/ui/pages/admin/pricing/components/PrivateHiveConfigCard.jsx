import React from 'react';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';

export default class PrivateHiveConfigCard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isInEditMode: props.isInEditMode || false,
      peerCount: 2,
      ordererCount: 3,
      version: '1.1',
    };
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

    Meteor.call(
      'upsertPrivateHiveNetworkConfig',
      {
        params: {
          _id: this.config._id,
          fabric: {
            orderers: this.ordererCount.value,
            peers: this.peerCount.value,
            version: this.version.value,
          },
          kafka: {
            cpu: this.kafkaCpu.value,
            ram: this.kafkaRAM.value,
            disk: this.kafkaDiskSpace.value,
            isDiskChangeable: this.isKafkaDiskChangeable,
          },
          orderer: {
            cpu: this.ordererCpu.value,
            ram: this.ordererRAM.value,
            disk: this.ordererDiskSpace.value,
            isDiskChangeable: this.isOrdererDiskChangeable,
          },
          peer: {
            cpu: this.peerCpu.value,
            ram: this.peerRAM.value,
          },
          data: {
            disk: this.dataDiskSpace.value,
            isDiskChangeable: this.isDataDiskChangeable,
          },
          name: this.configName.value,
          'cost.monthly': this.configMonthlyCost.value,
          'cost.hourly': this.state.costHourly,
          showInNetworkSelection: this.showInNetworkSelection,
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
    let { config } = this.props;
    const isInEditMode = this.props.isInEditMode || this.state.isInEditMode;

    if (!config) {
      config = {};
    }

    if (!config.cost) {
      config.cost = {};
    }

    this.config = config;

    const DisplayMode = (
      <div className="card bg-white">
        <div className="card-header ">
          <div className="card-title full-width">
            <h5 className="text-primary m-b-0 m-t-0" style={{ display: 'inline' }}>
              {config.name}
            </h5>
            <i className="fa fa-wrench pull-right p-t-5 fs-16" style={{ cursor: 'pointer' }} onClick={this.edit} />
          </div>
        </div>
        <div className="card-block">
          <div className="row">
            <div className="col-md-12" style={{ fontWeight: 'bold', fontSize: '16px', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
              Fabric Core configs
            </div>
          </div>
          <div className="row p-t-10">
            <div className="col-md-4">
              <i className="fa fa-joomla" />
              &nbsp;Orderers &nbsp;
              <input type="number" className="form-control" placeholder="orderer" defaultValue={this.state.ordererCount} ref={input => (this.ordererCount = input)} disabled />
              <br />
            </div>
            <div className="col-md-4">
              <i className="fa fa-keyboard-o" />
              &nbsp;Peers &nbsp;
              <input type="number" className="form-control" placeholder="peers" defaultValue={this.state.peerCount} ref={input => (this.peerCount = input)} disabled />
            </div>
            <div className="col-md-4">
              <i className="fa fa-keyboard-o" />
              &nbsp;Version &nbsp;
              <input type="text" className="form-control" placeholder="peers" defaultValue={this.state.version} ref={input => (this.version = input)} disabled />
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
              <input type="number" className="form-control" placeholder="Kafka CPU" defaultValue={config.kafkaCpu} ref={input => (this.kafkaCpu = input)} />
            </div>
            <div className="col-md-4">
              <i className="fa fa-save" />
              &nbsp;Orderer CPU (vCPUs)&nbsp;
              <input type="number" className="form-control" placeholder="Orderer CPU" defaultValue={config.ordererCpu} ref={input => (this.ordererCpu = input)} />
            </div>
            <div className="col-md-4">
              <i className="fa fa-save" />
              &nbsp;Peer CPU (vCPUs) &nbsp;
              <input type="number" className="form-control" placeholder="Peer CPU" defaultValue={config.peerCpu} ref={input => (this.peerCpu = input)} />
            </div>
          </div>
          <div className="row p-t-10">
            <div className="col-md-4">
              <i className="fa fa-save" />
              &nbsp;Kafka RAM (GB)&nbsp;
              <input type="number" className="form-control" placeholder="Kafka RAM" defaultValue={config.kafkaRAM} ref={input => (this.kafkaRAM = input)} />
            </div>
            <div className="col-md-4">
              <i className="fa fa-save" />
              &nbsp;Orderer RAM (GB)&nbsp;
              <input type="number" className="form-control" placeholder="Orderer RAM" defaultValue={config.ordererRAM} ref={input => (this.ordererRAM = input)} />
            </div>
            <div className="col-md-4">
              <i className="fa fa-save" />
              &nbsp;Peer RAM (GB) &nbsp;
              <input type="number" className="form-control" placeholder="Peer RAM" defaultValue={config.peerRAM} ref={input => (this.peerRAM = input)} />
            </div>
          </div>
          <div className="row p-t-10">
            <div className="col-md-4">
              <i className="fa fa-save" />
              &nbsp;Kafka Disk Space (GB)&nbsp;
              <input type="number" className="form-control" placeholder="Kafka Disk Space" defaultValue={config.kafkaDiskSpace} ref={input => (this.kafkaDiskSpace = input)} />
              <br />
              <label htmlFor="kafkaDiskChangeable">Changeable?</label>&nbsp;
              <input
                type="checkbox"
                name={`kafkaDiskChangeable_${config._id}`}
                defaultChecked={config.isKafkaDiskChangeable}
                onClick={e => {
                  this.isKafkaDiskChangeable = e.target.checked;
                }}
              />
            </div>
            <div className="col-md-4">
              <i className="fa fa-save" />
              &nbsp;Orderer Disk Space (GB)&nbsp;
              <input
                type="number"
                className="form-control"
                placeholder="Orderer Disk Space"
                defaultValue={config.ordererDiskSpace}
                ref={input => (this.ordererDiskSpace = input)}
              />
              <br />
              <label htmlFor="ordererDiskChangeable">Changeable?</label>&nbsp;
              <input
                type="checkbox"
                name={`ordererDiskChangeable_${config._id}`}
                defaultChecked={config.isOrdererDiskChangeable}
                onClick={e => {
                  this.isOrdererDiskChangeable = e.target.checked;
                }}
              />
            </div>
            <div className="col-md-4">
              <i className="fa fa-save" />
              &nbsp;Data Disk Space (GB)&nbsp;
              <input type="number" className="form-control" placeholder="Data Disk Space" defaultValue={config.dataDiskSpace} ref={input => (this.dataDiskSpace = input)} />
              <br />
              <label htmlFor="dataDiskChangeable">Changeable?</label>&nbsp;
              <input
                type="checkbox"
                name={`dataDiskChangeable_${config._id}`}
                defaultChecked={config.isDataDiskChangeable}
                onClick={e => {
                  this.isDataDiskChangeable = e.target.checked;
                }}
              />
            </div>
          </div>
        </div>
        <div className="card-footer clearfix">
          <h4 className="m-b-0 m-t-0" style={{ display: 'inline' }}>
            $ {config.cost.monthly || 0}
          </h4>{' '}
          / month
          <div className="clearfix" />
        </div>
      </div>
    );

    const EditMode = (
      <div className="card bg-white">
        <div className="card-header ">
          <div className="card-title full-width">
            <div className="row">
              <div className={`${this.props.isInEditMode ? 'col-md-10' : 'col-md-18'}`}>
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
            <div className="col-md-12" style={{ fontWeight: 'bold', fontSize: '16px', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
              Fabric Core configs
            </div>
          </div>
          <div className="row p-t-10">
            <div className="col-md-4">
              <i className="fa fa-joomla" />
              &nbsp;Orderers &nbsp;
              <input type="number" className="form-control" placeholder="orderer" defaultValue={this.state.ordererCount} ref={input => (this.ordererCount = input)} disabled />
              <br />
            </div>
            <div className="col-md-4">
              <i className="fa fa-keyboard-o" />
              &nbsp;Peers &nbsp;
              <input type="number" className="form-control" placeholder="peers" defaultValue={this.state.peerCount} ref={input => (this.peerCount = input)} disabled />
            </div>
            <div className="col-md-4">
              <i className="fa fa-keyboard-o" />
              &nbsp;Version &nbsp;
              <input type="text" className="form-control" placeholder="peers" defaultValue={this.state.version} ref={input => (this.version = input)} disabled />
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
              <input type="number" className="form-control" placeholder="Kafka CPU" defaultValue={config.kafkaCpu} ref={input => (this.kafkaCpu = input)} />
            </div>
            <div className="col-md-4">
              <i className="fa fa-save" />
              &nbsp;Orderer CPU (vCPUs)&nbsp;
              <input type="number" className="form-control" placeholder="Orderer CPU" defaultValue={config.ordererCpu} ref={input => (this.ordererCpu = input)} />
            </div>
            <div className="col-md-4">
              <i className="fa fa-save" />
              &nbsp;Peer CPU (vCPUs) &nbsp;
              <input type="number" className="form-control" placeholder="Peer CPU" defaultValue={config.peerCpu} ref={input => (this.peerCpu = input)} />
            </div>
          </div>
          <div className="row p-t-10">
            <div className="col-md-4">
              <i className="fa fa-save" />
              &nbsp;Kafka RAM (GB)&nbsp;
              <input type="number" className="form-control" placeholder="Kafka RAM" defaultValue={config.kafkaRAM} ref={input => (this.kafkaRAM = input)} />
            </div>
            <div className="col-md-4">
              <i className="fa fa-save" />
              &nbsp;Orderer RAM (GB)&nbsp;
              <input type="number" className="form-control" placeholder="Orderer RAM" defaultValue={config.ordererRAM} ref={input => (this.ordererRAM = input)} />
            </div>
            <div className="col-md-4">
              <i className="fa fa-save" />
              &nbsp;Peer RAM (GB) &nbsp;
              <input type="number" className="form-control" placeholder="Peer RAM" defaultValue={config.peerRAM} ref={input => (this.peerRAM = input)} />
            </div>
          </div>
          <div className="row p-t-10">
            <div className="col-md-4">
              <i className="fa fa-save" />
              &nbsp;Kafka Disk Space (GB)&nbsp;
              <input type="number" className="form-control" placeholder="Kafka Disk Space" defaultValue={config.kafkaDiskSpace} ref={input => (this.kafkaDiskSpace = input)} />
              <br />
              <label htmlFor="kafkaDiskChangeable">Changeable?</label>&nbsp;
              <input
                type="checkbox"
                name={`kafkaDiskChangeable_${config._id}`}
                defaultChecked={config.isKafkaDiskChangeable}
                onClick={e => {
                  this.isKafkaDiskChangeable = e.target.checked;
                }}
              />
            </div>
            <div className="col-md-4">
              <i className="fa fa-save" />
              &nbsp;Orderer Disk Space (GB)&nbsp;
              <input
                type="number"
                className="form-control"
                placeholder="Orderer Disk Space"
                defaultValue={config.ordererDiskSpace}
                ref={input => (this.ordererDiskSpace = input)}
              />
              <br />
              <label htmlFor="ordererDiskChangeable">Changeable?</label>&nbsp;
              <input
                type="checkbox"
                name={`ordererDiskChangeable_${config._id}`}
                defaultChecked={config.isOrdererDiskChangeable}
                onClick={e => {
                  this.isOrdererDiskChangeable = e.target.checked;
                }}
              />
            </div>
            <div className="col-md-4">
              <i className="fa fa-save" />
              &nbsp;Data Disk Space (GB)&nbsp;
              <input type="number" className="form-control" placeholder="Data Disk Space" defaultValue={config.dataDiskSpace} ref={input => (this.dataDiskSpace = input)} />
              <br />
              <label htmlFor="dataDiskChangeable">Changeable?</label>&nbsp;
              <input
                type="checkbox"
                name={`dataDiskChangeable_${config._id}`}
                defaultChecked={config.isDataDiskChangeable}
                onClick={e => {
                  this.isDataDiskChangeable = e.target.checked;
                }}
              />
            </div>
          </div>
        </div>
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
    return DisplayMode;
  }
}
