import React from 'react';

import { withRouter, Route, Redirect } from 'react-router-dom';

import FeatureList from './components/FeatureList';
import FeatureCreate from './components/FeatureCreate';

class Features extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  showDetails = prop => {
    this.props.history.replace(`/app/admin/clients/features/${prop}`);
  };

  render() {
    return (
      <div className="content">
        <div className="m-t-20 container-fluid container-fixed-lg bg-white">
          <div className="row">
            <div className="col-md-12">
              <div className="card card-transparent p-t-25">
                <div className="card-header">
                  <h3 className="text-success">Client Features</h3>
                </div>
                <div>
                  <div>
                    <ul className="nav nav-tabs nav-tabs-fillup" data-init-reponsive-tabs="dropdownfx">
                      <li className="nav-item">
                        <a
                          href="#"
                          className={window.location.pathname.includes('/list') ? 'active' : ''}
                          data-toggle="tab"
                          onClick={() => {
                            this.showDetails('list');
                          }}
                        >
                          <span>List</span>
                        </a>
                      </li>
                      <li className="nav-item">
                        <a
                          href="#"
                          className={window.location.pathname.includes('/create') ? 'active' : ''}
                          data-toggle="tab"
                          onClick={() => {
                            this.showDetails('create');
                          }}
                        >
                          <span>Create</span>
                        </a>
                      </li>
                    </ul>
                    <div className="tab-content p-l-0 p-r-0">
                      <div className="tab-pane slide-left active">
                        <Route exact path="/app/admin/clients/features" render={() => <Redirect to={'/app/admin/clients/features/list'} />} />
                        <Route exact path="/app/admin/clients/features/list" component={FeatureList} />
                        <Route exact path="/app/admin/clients/features/create" component={FeatureCreate} />
                      </div>
                    </div>
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

export default withRouter(Features);
