import React, {Component} from "react";
import "./EditableText.scss"
class EditableText extends Component {

  state = {
    isInEditMode: false
  }

  changeEditMode = () => {
    this.setState({
      isInEditMode: !this.state.isInEditMode
    })
  }

  updateComponentValue = () => {
    this.setState({
      isInEditMode: false,
    })

    this.props.valueChanged ? this.props.valueChanged(this.refs.theTextInput.value) : null;
  }

  renderEditView = () => {
    return <div className="editableTextEditView">
      <div className="row">
        <div className="col-md-4">
          <input
            type="text"
            className="form-control"
            defaultValue={this.props.value}
            ref="theTextInput"
          />
        </div>
        <div className="col-md-8">
            <button className="btn btn-danger" onClick={this.changeEditMode}>X</button>
            <button className="btn btn-success" onClick={this.updateComponentValue}>OK</button>
        </div>
      </div>


    </div>
  }

  renderDefaultView = () => {
    return <div className="editableTextDefaultView" onClick={this.changeEditMode}>
      {this.props.value} <i className="fa fa-edit"></i>
    </div>
  }

  render() {
    return this.state.isInEditMode ?
    this.renderEditView() :
    this.renderDefaultView()

  }
}

export default EditableText;
