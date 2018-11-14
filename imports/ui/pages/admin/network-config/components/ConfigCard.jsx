import React from 'react';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';

export default class ConfigCard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isInEditMode: props.isInEditMode || false,
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
      'upsertNetworkConfig',
      {
        params: {
          _id: this.config._id,
          cpu: this.configCpu.value,
          name: this.configName.value,
          ram: this.configRam.value,
          disk: this.configDisk.value,
          isDiskChangeable: this.configDiskChangeable,
          'cost.monthly': this.configMonthlyCost.value,
          'cost.hourly': this.state.costHourly,
          showInNetworkSelection: this.showInNetworkSelection
        },
        userId: Meteor.userId(),
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
            <div className="col-md-4">
              <i className="fa fa-joomla" />
              &nbsp;{config.cpu} vCPU
            </div>
            <div className="col-md-4">
              <i className="fa fa-keyboard-o" />
              &nbsp;{config.ram} GB Memory
            </div>
            <div className="col-md-4">
              <i className="fa fa-save" />
              &nbsp;{config.disk} GB Disk
              <br />
              {config.isDiskChangeable ? (
                <p>
                  <small>
                    <i>Disk Changeable</i>
                  </small>
                </p>
              ) : (
                <p>&nbsp;</p>
              )}
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
              <div className={`${this.props.isInEditMode ? 'col-md-12' : 'col-md-10'}`}>
                <h5 className="text-primary m-b-0 m-t-0" style={{ display: 'inline' }}>
                  <input type="text" className="form-control" placeholder="Node Type" defaultValue={config.name} ref={input => (this.configName = input)} />
                </h5>
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
            <div className="col-md-4">
              <i className="fa fa-joomla" />
              &nbsp;vCPU &nbsp;
              <input type="number" className="form-control" placeholder="vCPUs" defaultValue={config.cpu} ref={input => (this.configCpu = input)} />
              <br />
              <label for="showInNetworkSelection">Public</label>&nbsp;
              <input
                type="checkbox"
                name={`public_${config._id}`}
                defaultChecked={config.showInNetworkSelection}
                onClick={e => {
                  this.showInNetworkSelection = e.target.checked;
                }}
              />
            </div>
            <div className="col-md-4">
              <i className="fa fa-keyboard-o" />
              &nbsp;GB Memory &nbsp;
              <input type="number" className="form-control" placeholder="GB RAM" defaultValue={config.ram} ref={input => (this.configRam = input)} />
            </div>
            <div className="col-md-4">
              <i className="fa fa-save" />
              &nbsp;GB Disk Space &nbsp;
              <input type="number" className="form-control" placeholder="Disk Space" defaultValue={config.disk} ref={input => (this.configDisk = input)} />
              <br />
              <label for="diskChangeable">Disk Changeable</label>&nbsp;
              <input
                type="checkbox"
                name={`diskChangeable_${config._id}`}
                defaultChecked={config.isDiskChangeable}
                onClick={e => {
                  this.configDiskChangeable = e.target.checked;
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
