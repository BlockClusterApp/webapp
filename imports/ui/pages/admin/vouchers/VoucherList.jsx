import React, {Component} from "react";
import {withTracker} from "meteor/react-meteor-data";
import Vouchers from "../../../../collections/vouchers/voucher"
import helpers from "../../../../modules/helpers"
import {withRouter} from 'react-router-dom'
import ReactHtmlParser from "react-html-parser";
import moment from 'moment';


const PAGE_LIMIT = 20;
class VoucherList extends Component {

    constructor(props){
        super(props);

        this.state = {
            page: 0,
            vouchers: []
        }

      this.query = {
      };
    }


    componentWillUnmount() {
        this.props.subscriptions.forEach((s) =>{
            s.stop();
        });
        this.voucherSubscription.stop();
    }


	componentDidMount(){
    this.search();
  }

  search = () => {
    this.voucherSubscription = Meteor.subscribe("vouchers.search", {
      query: this.query
    }, {
      onReady: () => {
        this.setState({
          vouchers: Vouchers.find(this.query).fetch(),
        });
      }
    })
  }

  changePage = (pageOffset) => {
    if(this.state.page + pageOffset < 0){
      return;
    }
    this.voucherSubscription.stop();
    this.voucherSubscription =  Meteor.subscribe("vouchers.all", {query: this.query, page: this.state.page + pageOffset}, {
      onReady: () => {
        const page = this.state.page + pageOffset;
        this.setState({
          vouchers: Vouchers.find(this.query,{limit: PAGE_LIMIT, skip: 10 * page}).fetch(),
          page
        });
      }
    })
  }

  onSearch = (e) => {
    const searchQuery = e.target.value;
    if(!searchQuery) {
      delete this.query.$or;
      return this.changePage(0);
    }
    if(searchQuery.length <= 2){
      delete this.query.$or;
      return this.changePage(0);
    }
    this.query.$or = [
        {code: {$regex: `${searchQuery}*`, $options: "i"} },
        {_id: {$regex: `${searchQuery}*`, $options: "i"} }
      ];
    this.search();
  }

  onInstanceStateChange = (e) => {
    this.query.status = e.target.value;
    if(this.query.status === "all"){
      delete this.query.status;
    }
    this.search();
  }

  getClaimStatus = (claimed) => {
    if(claimed){
      return <span className="label label-success">Claimed</span>
    }
    return <span className="">-</span>
  }


  openVoucher = (voucherId) => {
    this.props.history.push("/app/admin/vouchers/" + voucherId);
  }


  getNetworkType = config => {
    if (!config) {
      return null;
    }
    return `${config.cpu >= 100 ? config.cpu / 100 : config.cpu} vCPU | ${config.ram} GB | ${config.disk} GB`;
  };

  onClaimChange = (e) => {
    const value = e.target.value;
    if(value === "all") {
      delete this.query.claimed;
    } else if (value === "claimed") {
      this.query.claimed = true;
    } else {
      this.query.claimed = false;
    }
    this.search();
  }


	render(){
		return (
            <div className="content voucherList">
                <div className="m-t-20 container-fluid container-fixed-lg bg-white" style={{marginLeft: '25px', marginRight: '25px'}}>
                    <div className="row">
                        <div className="col-lg-12">
                            <div className="card card-transparent">
                                <div className="card-header ">
                                    <div className="card-title">Vouchers
                                    </div>
                                </div>
                                <div className="card-block">
                                  <div className="row">
                                    <div className="col-md-4">
                                    <div className="input-group transparent">
                                      <span className="input-group-addon">
                                          <i className="fa fa-search"></i>
                                      </span>
                                      <input type="text" placeholder="Voucher code or Id" className="form-control" onChange={this.onSearch} />
                                    </div>
                                    </div>
                                    <div className="col-md-3">
                                      <div className="form-group ">
                                        <select className="full-width select2-hidden-accessible" data-init-plugin="select2" tabIndex="-1" aria-hidden="true" onChange={this.onClaimChange}>
                                            <option value="running">States: All</option>
                                            <option value="claimed">Claimed</option>
                                            <option value="unclaimed">Not Claimed</option>
                                        </select>
                                      </div>
                                    </div>
                                  </div>
                                    <div className="table-responsive">
                                        <table className="table table-hover" id="basicTable">
                                            <thead>
                                                <tr>
                                                    <th style={{width: "5%"}}>S.No</th>
                                                    {/* <th style={{width: "15%"}}>Id</th> */}
                                                    <th style={{width: "30%"}}>Voucher Code</th>
                                                    <th style={{width: "12%"}}>Claim Status</th>
                                                    <th style={{width: "30%"}}>Config</th>
                                                    <th style={{width: "20%"}}>Created At</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                              {
                                                this.state.vouchers.map((voucher, index) => {
                                                  return (
                                                    <tr key={index+1} onClick={() => this.openVoucher(voucher._id)}>
                                                      <td>{this.state.page * PAGE_LIMIT + index+1}</td>
                                                      <td>{voucher.code}</td>
                                                      <td>{this.getClaimStatus(voucher.claimed)}</td>
                                                      <td>{this.getNetworkType(voucher.networkConfig)}</td>
                                                      <td>{moment(voucher.createdAt).format('DD-MMM-YYYY')}</td>
                                                    </tr>
                                                  )
                                                })
                                              }
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="pagination pull-right" style={{marginTop: '5px'}}>
                                      <nav aria-label="Page navigation example">
                                        <ul className="pagination">
                                          <li className="page-item"  onClick={ () => this.changePage(-1) }><a className="page-link">Previous</a></li>
                                          <li className="page-item" onClick={ () => this.changePage(1) }><a className="page-link">Next</a></li>
                                        </ul>
                                      </nav>
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
      subscriptions: [
        Meteor.subscribe("vouchers.all", {page: 0})
      ]
    }
})(withRouter(VoucherList))