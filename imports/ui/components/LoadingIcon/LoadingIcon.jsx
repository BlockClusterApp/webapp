import React, {Component} from "react";
import "./LoadingIcon.scss"
class LoadingIcon extends Component {
  render() {
    return (
      <div className="LoadingIcon">
        <div
          className="lds-wedges"
        >
          <div>
            <div>
              <div />
            </div>
            <div>
              <div />
            </div>
            <div>
              <div />
            </div>
            <div>
              <div />
            </div>
          </div>
        </div>
      </div>

    )
  }
}

export default LoadingIcon;
