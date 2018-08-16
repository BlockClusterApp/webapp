import React, { Component } from 'react';
import ReactHtmlParser from "react-html-parser";
import moment from 'moment';
import './Conversation.scss';

export default class Conversation extends Component {
  render() {
    const customerMessageView =  (
    <div className="row padding-25 conversation">
      <div className="col-md-3 text-right" style={{paddingTop: '10px'}}>
        {this.props.extra && this.props.extra.time && moment(this.props.extra.time).format('DD-MMM-YY hh:mm A')}
      </div>
      <div className="col-md-9 message padding-10">
        { ReactHtmlParser(this.props.message) }
      </div>
    </div>
    );

    const adminMessageView = (
    <div className="row padding-25 conversation">
      <div className="col-md-9 message padding-10">
        { ReactHtmlParser(this.props.message) }
      </div>
      <div className="col-md-3 text-left" style={{paddingTop: '10px'}}>
      {this.props.extra && this.props.extra.time && moment(this.props.extra.time).format('DD-MMM-YY hh:mm A')}
      </div>
    </div>
    );

    if(this.props.isCustomerMessage) {
      return customerMessageView;
    } else {
      return adminMessageView;
    }
  }
}
