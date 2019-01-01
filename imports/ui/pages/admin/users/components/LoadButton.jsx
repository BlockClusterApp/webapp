import React, { Component } from 'react';
import LaddaButton, { S, SLIDE_UP } from 'react-ladda';

export default class LoadButton extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  load = () => {
    this.setState({
      loading: true,
    });
    this.props.onLoad && this.props.onLoad(this.props.subscription);
  };

  render() {
    return (
      <LaddaButton
        loading={this.state.loading}
        data-size={S}
        data-style={SLIDE_UP}
        data-spinner-size={30}
        data-spinner-lines={12}
        onClick={this.load}
        className="btn btn-success"
        type="submit"
      >
        <i className="fa fa-plus-circle" aria-hidden="true" />
        &nbsp;&nbsp;{this.props.buttonText}
      </LaddaButton>
    );
  }
}
