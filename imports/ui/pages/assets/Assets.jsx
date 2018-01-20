import React, {Component} from "react";
import {withTracker} from "meteor/react-meteor-data";
import {Networks} from "../../../collections/networks/networks.js"
import helpers from "../../../modules/helpers"
import ReactHtmlParser, { processNodes, convertNodeToElement, htmlparser2 } from "react-html-parser";
import {withRouter} from 'react-router-dom'

import "./Assets.scss"

class Assets extends Component {
    componentWillUnmount() {
        this.props.subscriptions.forEach((s) =>{
            s.stop();
        });
    }

	render(){
		return (
            <div className="content ">
                <div className="m-t-20 container-fluid container-fixed-lg bg-white">
                    <div className="row dashboard">
                        <div className="col-lg-12">
                            <div className="card card-transparent">
                                <div className="card-header ">
                                    <div className="card-title">Assets
                                    </div>
                                </div>
                                <div className="card-block no-padding">
                                    <div className="row">
                                        <div className="col-xl-12">
                                            <div className="card card-transparent flex-row">
                                                <ul className="nav nav-tabs nav-tabs-simple nav-tabs-left bg-white" id="tab-3">
                                                    {this.props.networks.map((item, index) => {
                                                        return (
                                                            <li key={item.instanceId} className="nav-item">
                                                                <a href="#" className={index === 0 ? "active" : ""} data-toggle="tab" data-target={"#" + item.instanceId}>{item.name}</a>
                                                            </li>
                                                        )
                                                    })}
                                                </ul>
                                                <div className="tab-content bg-white">
                                                    {this.props.networks.map((item, index) => {
                                                        return (
                                                            <div key={index}>
                                                                {item.assetsContractAddress === '' &&
                                                                    <div className={index === 0 ? "tab-pane active" : "tab-pane "} id={"#" + item.instanceId}>
                                                                        <div className="row column-seperation">
                                                                            <div className="col-lg-6">
                                                                                <div className="card-group horizontal" id="accordion" role="tablist" aria-multiselectable="true">
                                                                                    <div className="card card-default m-b-0">
                                                                                        <div className="card-header " role="tab" id="headingOne">
                                                                                            <h4 className="card-title">
                                                                                                <a data-toggle="collapse" data-parent="#accordion" href="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
                                                                                                Collapsible Group Item
                                                                                                </a>
                                                                                            </h4>
                                                                                        </div>
                                                                                        <div id="collapseOne" className="collapse show" role="tabcard" aria-labelledby="headingOne">
                                                                                            <div className="card-block">
                                                                                                Click headers to expand/collapse content that is broken into logical sections, much like tabs. Optionally, toggle sections open/closed on mouseover.
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="card card-default m-b-0">
                                                                                        <div className="card-header " role="tab" id="headingTwo">
                                                                                            <h4 className="card-title">
                                                                                                <a className="collapsed" data-toggle="collapse" data-parent="#accordion" href="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">
                                                                                                Typography Variables
                                                                                                </a>
                                                                                            </h4>
                                                                                        </div>
                                                                                        <div id="collapseTwo" className="collapse" role="tabcard" aria-labelledby="headingTwo">
                                                                                            <div className="card-block">
                                                                                                <h1 className="light">
                                                                                                    go explore the <span className="semi-bold">world</span>
                                                                                                </h1>
                                                                                                <h4>
                                                                                                    small things in life matters the most
                                                                                                </h4>
                                                                                                <h2>
                                                                                                    Big Heading <span className="semi-bold">Body</span>,
                                                                                                    <i>Variations</i>
                                                                                                </h2>
                                                                                                <h4>
                                                                                                    <span className="semi-bold">Open Me</span>, Light , <span className=
                                                                                                        "semi-bold">Bold</span>, <i>Everything</i>
                                                                                                </h4>
                                                                                                <p>
                                                                                                    is the art and technique of arranging type in order to make language visible. The arrangement of type involves the selection of typefaces, point size, line length, leading (line spacing), adjusting the spaces between groups of letters (tracking)
                                                                                                </p>
                                                                                                <p>
                                                                                                    and adjusting the Case space between pairs of letters (kerning). Type design is a closely related craft, which some consider distinct and others a part of typography
                                                                                                </p>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="card card-default m-b-0">
                                                                                        <div className="card-header " role="tab" id="headingThree">
                                                                                            <h4 className="card-title">
                                                                                                <a className="collapsed" data-toggle="collapse" data-parent="#accordion" href="#collapseThree" aria-expanded="false" aria-controls="collapseThree">
                                                                                                Easy Edit
                                                                                                </a>
                                                                                            </h4>
                                                                                        </div>
                                                                                        <div id="collapseThree" className="collapse" role="tabcard" aria-labelledby="headingThree">
                                                                                            <div className="card-block">
                                                                                                Click headers to expand/collapse content that is broken into logical sections, much like tabs. Optionally, toggle sections open/closed on mouseover.
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="col-lg-6">
                                                                                <h3 className="semi-bold">
                                                                                    great tabs
                                                                                </h3>
                                                                                <p>Native boostrap tabs customized to Pages look and feel, simply changing class name you can change color as well as its animations</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                }
                                                                {(item.assetsContractAddress !== undefined && item.assetsContractAddress !== '') &&
                                                                    <div className={index === 0 ? "tab-pane active" : "tab-pane "} id={"#" + item.instanceId}>
                                                                        <div className="container">
                                                                            <div className="row column-seperation">
                                                                                <div className="col-lg-5">
                                                                                    <div className="card-group horizontal" id="accordion" role="tablist" aria-multiselectable="true">
                                                                                        <div className="card card-default m-b-0">
                                                                                            <div className="card-header " role="tab" id="headingOne">
                                                                                                <h4 className="card-title">
                                                                                                    <a data-toggle="collapse" data-parent="#accordion" href="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
                                                                                                    Add Asset Type
                                                                                                    </a>
                                                                                                </h4>
                                                                                            </div>
                                                                                            <div id="collapseOne" className="collapse show" role="tabcard" aria-labelledby="headingOne">
                                                                                                <div className="card-block">
                                                                                                    Click headers to expand/collapse content that is broken into logical sections, much like tabs. Optionally, toggle sections open/closed on mouseover.
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="card card-default m-b-0">
                                                                                            <div className="card-header " role="tab" id="headingTwo">
                                                                                                <h4 className="card-title">
                                                                                                    <a className="collapsed" data-toggle="collapse" data-parent="#accordion" href="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">
                                                                                                    Issue Bulk Asset
                                                                                                    </a>
                                                                                                </h4>
                                                                                            </div>
                                                                                            <div id="collapseTwo" className="collapse" role="tabcard" aria-labelledby="headingTwo">
                                                                                                <div className="card-block">
                                                                                                    <h1 className="light">
                                                                                                        go explore the <span className="semi-bold">world</span>
                                                                                                    </h1>
                                                                                                    <h4>
                                                                                                        small things in life matters the most
                                                                                                    </h4>
                                                                                                    <h2>
                                                                                                        Big Heading <span className="semi-bold">Body</span>,
                                                                                                        <i>Variations</i>
                                                                                                    </h2>
                                                                                                    <h4>
                                                                                                        <span className="semi-bold">Open Me</span>, Light , <span className=
                                                                                                            "semi-bold">Bold</span>, <i>Everything</i>
                                                                                                    </h4>
                                                                                                    <p>
                                                                                                        is the art and technique of arranging type in order to make language visible. The arrangement of type involves the selection of typefaces, point size, line length, leading (line spacing), adjusting the spaces between groups of letters (tracking)
                                                                                                    </p>
                                                                                                    <p>
                                                                                                        and adjusting the Case space between pairs of letters (kerning). Type design is a closely related craft, which some consider distinct and others a part of typography
                                                                                                    </p>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="card card-default m-b-0">
                                                                                            <div className="card-header " role="tab" id="headingThree">
                                                                                                <h4 className="card-title">
                                                                                                    <a className="collapsed" data-toggle="collapse" data-parent="#accordion" href="#collapseThree" aria-expanded="false" aria-controls="collapseThree">
                                                                                                    Issue Solo Asset
                                                                                                    </a>
                                                                                                </h4>
                                                                                            </div>
                                                                                            <div id="collapseThree" className="collapse" role="tabcard" aria-labelledby="headingThree">
                                                                                                <div className="card-block">
                                                                                                    Click headers to expand/collapse content that is broken into logical sections, much like tabs. Optionally, toggle sections open/closed on mouseover.
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="col-lg-7">
                                                                                    <div className="table-responsive">
                                                                                        <table className="table table-hover" id="basicTable">
                                                                                            <thead>
                                                                                                <tr>
                                                                                                    <th style={{width: "25%"}}>Asset Name</th>
                                                                                                    <th style={{width: "25%"}}>Asset Type</th>
                                                                                                    <th style={{width: "25%"}}>Total Units</th>
                                                                                                    <th style={{width: "25%"}}>Issuer</th>
                                                                                                </tr>
                                                                                            </thead>
                                                                                            <tbody>
                                                                                                {this.props.networks.map((item, index) => {
                                                                                                    return (
                                                                                                        <tr key={item._id}>
                                                                                                            <td className="v-align-middle ">
                                                                                                                License
                                                                                                            </td>
                                                                                                            <td className="v-align-middle">
                                                                                                                Solo
                                                                                                            </td>
                                                                                                            <td className="v-align-middle">
                                                                                                                12312
                                                                                                            </td>
                                                                                                            <td className="v-align-middle">
                                                                                                                0x78348937498327
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    )
                                                                                                })}
                                                                                            </tbody>
                                                                                        </table>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                }
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
		)
	}
}

export default withTracker(() => {
    return {
        networks: Networks.find({}).fetch(),
        subscriptions: [Meteor.subscribe("networks")]
    }
})(withRouter(Assets))
