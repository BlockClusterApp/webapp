import React, { Component } from 'react';

export default class ConfirmationButton extends Component {
  constructor(props) {
    super(props);

    this.state = {
      countdown: 0,
    };
    this.timeout = props.timeout || 5000;
    this.cooldown = props.cooldown || 3000;
  }

  buttonTrigger = () => {
    if (!this.state.confirmationAsked) {
      this.setState({
        confirmationAsked: true,
        cooldown: true,
      });

      this.interval = setInterval(() => {
        this.setState({
          countdown: this.state.countdown + 1,
        });
      }, 1000);
      this.timer = setTimeout(() => {
        clearInterval(this.interval);
        this.setState({
          cooldown: false,
          countdown: 0,
        });
        this.timer = setTimeout(() => {
          this.setState({
            confirmationAsked: false,
            cooldown: false,
          });
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
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  render() {
    const className = this.props.className || 'btn-danger';
    return (
      <button
        className={`btn ${className}`}
        style={this.props.style}
        onClick={this.buttonTrigger}
        disabled={this.state.cooldown || this.props.disabled || this.props.completed || this.props.loading}
      >
        {this.props.loading && <i className="fa fa-spin fa-spinner">&nbsp;</i>}
        &nbsp;
        {this.props.loading
          ? this.props.loadingText || 'Processing'
          : this.props.completed
          ? this.props.completedText
          : this.state.confirmationAsked
          ? `${this.props.confirmationText || 'Are you sure? This is irreversible'} ${this.state.cooldown ? `(${this.cooldown / 1000 - this.state.countdown})` : ''}`
          : this.props.actionText || 'Delete Node'}
      </button>
    );
  }
}
