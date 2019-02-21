import React, { Component } from 'react';
import { Link } from 'react-router-dom';

export default class Navbar extends Component {
  render() {
    return (
      <div className="page-container footer">
        <div className="page-content-wrapper ">
          <div className="content p-t-20">
            <div className="container-fluid container-fixed-lg">
              <div className="copyright sm-text-center">
                <p className="small no-margin pull-left sm-pull-reset">
                  <span className="hint-text">Copyright &copy; 2019 </span>
                  <span className="font-montserrat">BlockCluster</span>.<span className="hint-text">&nbsp;All rights reserved. </span>
                  <span className="sm-block">
                    <a href="#" className="m-l-10 m-r-10">
                      Terms of use
                    </a>{' '}
                    <span className="muted">|</span>{' '}
                    <a href="#" className="m-l-10">
                      Privacy Policy
                    </a>
                  </span>
                </p>
                <p className="small no-margin pull-right sm-pull-reset">
                  Hand-crafted <span className="hint-text">&amp; made with Love</span>
                </p>
                <div className="clearfix" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
