import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter } from 'react-router-dom';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';

class Join extends Component {
  constructor(props) {
    super(props);

    this.state = {
      locations: [],
      inviteFormSubmitError: '',
    };
  }

  componentWillUnmount() {
    this.props.subscriptions.forEach(s => {
      s.stop();
    });
  }

  componentDidMount() {}

  render() {
    return (
      <div className="">
        <div className="m-t-20 container-fixed-lg bg-white">
          <div className="row">
            <div className="col-md-5">
              <div className="card card-transparent">
                <div className="card-block">
                  <h3>Invite to a Hyperledeger Fabric Network</h3>
                  <p>Lorem ipsum</p>
                  <ul>
                    <li>
                      <i>Voucher Code</i>: enter voucher code if you have one to get discount and other benefits
                    </li>
                    <li>
                      <i>Node Type</i>: select either development or production grade node i.e., light or power node
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-md-7">
              <div className="card card-transparent">
                <form id="form-project" role="form" onSubmit={this.onInviteSubmit} autoComplete="off">
                  <p>Basic Information</p>
                  <div className="form-group-attached">
                    <div className="row clearfix">
                      <div className="col-md-12">
                        <div className="form-group form-group-default required">
                          <label>Network name</label>
                          <select
                            className="form-control"
                            ref={input => {
                              this.networkNameInvite = input;
                            }}
                          >
                            {this.props.networks.map((item, index) => {
                              return (
                                <option value={item.instanceId} key={item.instanceId}>
                                  {item.name}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="row clearfix">
                      <div className="col-md-12">
                        <div className="form-group form-group-default required">
                          <label>User Email</label>
                          <input
                            ref={input => {
                              this.email = input;
                            }}
                            type="email"
                            className="form-control"
                            name="firstName"
                            required
                            placeholder="admin@blockcluster.io"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <br />
                  {this.state.inviteFormSubmitError != '' && (
                    <div className="row">
                      <div className="col-md-12">
                        <div className="m-b-20 alert alert-danger m-b-0" role="alert">
                          <button className="close" data-dismiss="alert" />
                          {this.state.inviteFormSubmitError}
                        </div>
                      </div>
                    </div>
                  )}

                  <LaddaButton
                    loading={this.state.inviteLoading}
                    data-size={S}
                    data-style={SLIDE_UP}
                    data-spinner-size={30}
                    data-spinner-lines={12}
                    className="btn btn-success"
                    type="submit"
                  >
                    <i className="fa fa-plus-circle" aria-hidden="true" />
                    &nbsp;&nbsp;Invite
                  </LaddaButton>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withTracker(() => {
  return {
    networks: [],
    subscriptions: [],
  };
})(withRouter(Join));
