import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter } from 'react-router-dom';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';
import PrivateHive from '../../../../collections/privatehive';
import notification from '../../../../modules/notifications';

const invalidChars = ['!', '#', '$', '%', '^', '&', '*', '(', ')', '-', ' ', '{', '}', '|', '~', '`', ','];
function isEmailValid(email) {
  if (!email) {
    return false;
  }
  if (!email.includes('@')) {
    return false;
  }
  const firstHalf = email.split('@')[0];
  const secondHalf = email.split('@')[1];

  if (firstHalf.includes('@') || secondHalf.includes('@')) {
    return false;
  }
  let isError = false;
  invalidChars.forEach(char => {
    isError = isError || firstHalf.includes(char) || secondHalf.includes(char);
  });

  return !isError;
}

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

  inviteUser = () => {
    let error = '';
    if (!this.networkNameInvite.value) {
      error = 'Select the network for which invite is to be sent';
    }
    if (!isEmailValid(this.email.value)) {
      error = 'Invalid email id';
    }

    if (error) {
      return this.setState({
        inviteFormSubmitError: error,
      });
    }
    this.setState({
      inviteFormSubmitError: '',
      inviteLoading: true,
    });

    Meteor.call('inviteUserToNetwork', { instanceId: this.networkNameInvite.value, nodeType: '', email: this.email.value, userId: Meteor.userId(), type: 'privatehive' }, err => {
      if (!err) {
        this.setState({
          inviteFormSubmitError: '',
          inviteLoading: false,
        });

        this.props.history.push('/app/privatehive/list');
        notifications.success('Invited Successfully');
      } else {
        this.setState({
          inviteFormSubmitError: err.reason,
          inviteLoading: false,
        });
      }
    });
  };

  render() {
    return (
      <div className="">
        <div className="m-t-20 container-fixed-lg bg-white">
          <div className="row">
            <div className="col-md-5">
              <div className="card card-transparent">
                <div className="card-block">
                  <h3>Invite to a Hyperledeger Fabric Network</h3>
                  <p>Here you can invite an another organisation to join the network. </p>
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
                            onChange={() => {
                              this.setState({
                                inviteFormSubmitError: '',
                              });
                            }}
                            className="form-control"
                            ref={input => {
                              this.networkNameInvite = input;
                            }}
                          >
                            {this.props.networks.map((item, index) => {
                              return (
                                <option value={item.instanceId} key={item.instanceId}>
                                  {item.name} - {item.instanceId}
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
                            onChange={() => {
                              this.setState({
                                inviteFormSubmitError: '',
                              });
                            }}
                            type="email"
                            className="form-control"
                            name="email"
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
                    disabled={!!this.state.inviteFormSubmitError}
                    data-size={S}
                    data-style={SLIDE_UP}
                    data-spinner-size={30}
                    data-spinner-lines={12}
                    className="btn btn-success"
                    onClick={this.inviteUser}
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
    networks: PrivateHive.find({ userId: Meteor.userId(), deletedAt: null, active: true, status: 'running', isJoin: { $ne: true } }).fetch(),
    subscriptions: [Meteor.subscribe('privatehive')],
  };
})(withRouter(Join));
