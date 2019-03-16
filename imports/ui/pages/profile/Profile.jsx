import React from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter } from 'react-router-dom';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';
import notifications from '../../../modules/notifications';

class Profile extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  onSubmit = () => {
    if (!(this.firstName.value && this.email.value && this.mobile.value)) {
      return false;
    }
    this.setState({
      loading: true,
    });
    Meteor.call('updateProfile', { firstName: this.firstName.value, lastName: this.lastName.value, mobile: this.mobile.value }, (err, data) => {
      this.setState({
        loading: false,
      });
      if (err) {
        return notifications.error(err.reason);
      }
      notifications.success('Updated');
    });
  };

  render() {
    const { user } = this.props;

    if (!user) {
      return null;
    }
    return (
      <div className="content">
        <div className="m-t-20 container-fluid container-fixed-lg bg-white m-l-20 m-r-20">
          <div className="row p-t-50 p-b-50">
            <div className="col-md-4 col-sm-12">
              <div className="row">
                <div className="col-md-12 text-center">
                  <img src="/assets/img/icons/profile.png" className="p-t-25 p-b-25 p-l-25 p-r-25" />
                </div>
              </div>
            </div>
            <div className="col-md-8 col-sm-12">
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group form-group-default required">
                    <label>First Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="userName"
                      defaultValue={user.profile.firstName}
                      required
                      ref={input => {
                        this.firstName = input;
                      }}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group form-group-default required">
                    <label>Last Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="userName"
                      defaultValue={user.profile.lastName}
                      ref={input => {
                        this.lastName = input;
                      }}
                    />
                  </div>
                </div>
                <div className="col-md-12">
                  <div className="form-group form-group-default required">
                    <label>Email</label>
                    <input
                      type="text"
                      className="form-control"
                      name="userEmail"
                      defaultValue={user.emails[0].address}
                      required
                      disabled
                      ref={input => {
                        this.email = input;
                      }}
                    />
                  </div>
                </div>
                <div className="col-md-12">
                  <div className="form-group form-group-default required">
                    <label>Mobile</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="userName"
                      defaultValue={user.profile.mobiles && user.profile.mobiles[0].number}
                      required
                      ref={input => {
                        this.mobile = input;
                      }}
                    />
                  </div>
                </div>
                <div className="col-md-12">
                  <LaddaButton
                    loading={this.state.loading}
                    data-size={S}
                    data-style={SLIDE_UP}
                    data-spinner-size={30}
                    data-spinner-lines={12}
                    onClick={this.onSubmit}
                    className="btn btn-success"
                  >
                    <i className="fa fa-save" aria-hidden="true" />
                    &nbsp;&nbsp;Save
                  </LaddaButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withTracker(props => {
  return {
    user: Meteor.user(),
  };
})(withRouter(Profile));
