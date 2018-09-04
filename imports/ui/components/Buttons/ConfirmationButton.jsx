import React, { Component } from 'react';

export default class ConfirmationButton extends Component {
  constructor(props) {
    super(props);

    this.state = {};
    this.timeout = props.timeout || 5000;
    this.cooldown = props.cooldown || 3000;
  }

  buttonTrigger = () => {
    if (!this.state.confirmationAsked) {
      this.setState({
        confirmationAsked: true,
        cooldown: true
      });
      this.timer = setTimeout(() => {
        this.setState({
          cooldown: false,
        });
        this.timer = setTimeout(() => {
          this.setState({
            confirmationAsked: false,
            cooldown: false
          })
        }, this.timeout * 2);
      }, this.cooldown);
      return;
    }

    if (this.props.onConfirm) {
      this.props.onConfirm();
    }
  };

  componentWillUnmount() {
    this.unmounted = true;
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }

  render() {
    const className = this.props.className || 'btn-danger';
    return (
      <button className={`btn ${className}`} style={this.props.style} onClick={this.buttonTrigger} disabled={this.state.cooldown || this.props.disabled || this.props.completed}>
        { this.props.loading && <i className="fa fa-spin fa-spinner">&nbsp;</i> }
        {this.props.completed
          ? this.props.completedText
          : this.state.confirmationAsked
            ? this.props.confirmationText || 'Are you sure? This is irreversible'
            : this.props.actionText || 'Delete Node'}
      </button>
    );
  }
}
