import React, { Component } from 'react';

class Overview extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="content paymeterDashboard">
        <div className="m-t-20 container-fluid container-fixed-lg bg-white">
          <div className="row">
            <div className="col-md-12">
              <iframe
                src={`https://metabase.blockcluster.io/embed/dashboard/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNvdXJjZSI6eyJkYXNoYm9hcmQiOjV9LCJwYXJhbXMiOnt9LCJpYXQiOjE1NTI5OTc3MTZ9.0fHjUkVtsfTAZVc-ZAFzMYnLGYppnvNVy9XqU99FQ0o#bordered=false&titled=false&refresh=60${
                  window.theme === 'theme-dark' ? '&theme=night' : ''
                }`}
                frameBorder="0"
                width="100%"
                height="900px"
                allowtransparency="true"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Overview;
