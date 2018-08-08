import { Networks } from '../../collections/networks/networks';
import Voucher from '../../collections/vouchers/voucher';
import Billing from '../billing';
import LocationApi from '../locations';
import NetworkConfig from '../../collections/network-configuration/network-configuration';

const Network = {};

Network.fetchNetworkForAdmin = async (networkId) => {
  const network = Networks.find({_id: networkId}).fetch()[0];
  if(!network) {
    return {network};
  }
  const user = Meteor.users.find({_id: network.user}, {
    fields: {
      profile: 1,
      _id: 1,
      emails: 1,
      admin: 1,
      createdAt: 1
    }
  }).fetch()[0];
  const locations = LocationApi.getLocations();
  let voucher, networkType;
  if(network.voucherId) {
    voucher = Voucher.find({
      _id: network.voucherId
    }).fetch()[0];
  }


  if(network.metadata && network.metadata.networkConfig) {
    networkType = NetworkConfig.find({_id: network.metadata.networkConfig._id}).fetch()[0];
  }
  let bill;
  if(user){
    bill = await Billing.generateBill(user._id);
  }
  return {network, user, locations, voucher, networkType, bill: bill ? bill.networks.find(i => i._id === networkId) : null}
};

Meteor.methods({
  fetchNetworkForAdmin: Network.fetchNetworkForAdmin
});

export default Network;
