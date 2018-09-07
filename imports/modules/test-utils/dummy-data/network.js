if (!Meteor.isTest) {
  return;
}

import { Networks } from '../../../collections/networks/networks';

const data = [
  {
    _id: 'zjcpkK7hYFy8F76s4',
    instanceId: 'meteortest',
    name: 'License',
    type: 'new',
    peerType: 'authority',
    workerNodeIP: '18.237.94.215',
    user: 'wH4LtZQbxKcZ7a5iN',
    createdOn: 1534856400000,
    totalENodes: [],
    locationCode: 'us-west-2',
    voucherId: null,
    networkConfigId: '8aoacQXfHyJkfzwj9',
    metadata: {
      voucher: null,
      networkConfig: {
        _id: '8aoacQXfHyJkfzwj9',
        name: 'Light',
        cpu: 0.5,
        ram: 1,
        disk: 5,
        isDiskChangeable: false,
        createdAt: '2018-07-28T21:34:13.111Z',
        active: true,
      },
    },
    networkConfig: {
      cpu: 500,
      ram: 1,
      disk: 5,
    },
    createdAt: '2018-08-13T10:08:39.948Z',
    active: false,
    apisPort: 32392,
    clusterIP: '100.66.179.6',
    ethNodePort: 32086,
    impulsePort: 32001,
    impulseURL: 'http://18.237.94.215:32001',
    realAPIsPort: 6382,
    realEthNodePort: 23000,
    realImpulsePort: 7558,
    realRPCNodePort: 8545,
    rpcNodePort: 31420,
    updatedAt: '2018-08-13T10:30:08.515Z',
    'api-password': 'tsuigzax',
    status: 'down',
    impulseStatus: 'down',
    assetsContractAddress: '0xa6c39dbd8b86789ca1f44a48ecc84c84f7f40e50',
    atomicSwapContractAddress: '0x32095802d7026f4ac0eb65d02384d1d1c93034df',
    currentValidators: ['0x4d28348c8616eb25ddeeabce624f43d24add2298'],
    genesisBlock:
      '{\n  "config": {\n    "chainId": 2017,\n    "homesteadBlock": 1,\n    "eip150Block": 2,\n    "eip150Hash": "0x0000000000000000000000000000000000000000000000000000000000000000",\n    "eip155Block": 3,\n    "eip158Block": 3,\n    "istanbul": {\n      "epoch": 30000,\n      "policy": 0\n    }\n  },\n  "nonce": "0x0",\n  "timestamp": "0x5b715969",\n  "extraData": "0x0000000000000000000000000000000000000000000000000000000000000000f85ad5944d28348c8616eb25ddeeabce624f43d24add2298b8410000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c0",\n  "gasLimit": "0xde0b6b3a763ffff",\n  "difficulty": "0x1",\n  "mixHash": "0x63746963616c2062797a616e74696e65206661756c7420746f6c6572616e6365",\n  "coinbase": "0x0000000000000000000000000000000000000000",\n  "alloc": {\n    "4d28348c8616eb25ddeeabce624f43d24add2298": {\n      "balance": "0x446c3b15f9926687d2c40534fdb564000000000000"\n    }\n  },\n  "number": "0x0",\n  "gasUsed": "0x0",\n  "parentHash": "0x0000000000000000000000000000000000000000000000000000000000000000"\n}\n',
    genesisBlockHash: '0xbfbe6987ec9a2ceb9b592799093b2231cd1add2226a2b16a0120f4736eda4afe',
    impulse: {
      privateKey: '11a33ccd1812f0c645406d0ce87dda218df4a6d745733d1ea678272053eae164',
      publicKey: '037d414747fc7a09da93243f190e25b2b2251700c4f6d0964b97f0303ad0b97b3b',
    },
    nodeEthAddress: '0x4d28348c8616eb25ddeeabce624f43d24add2298',
    nodeId: '46693f3916c620bf102f31e4673a52f536534b284dd92fe35b48bfdb839176f1e23bd61a5e7efbd1c2bc21d3c948e07cc5a71698b50d5ba38b2e162989147697',
    nodeKey: '5c8cc08c7bbe4e2ddb64a99eff7ccdec3e65e62dcddb07fcbe033b074c5f1c02',
    staticPeers: [
      'enode://46693f3916c620bf102f31e4673a52f536534b284dd92fe35b48bfdb839176f1e23bd61a5e7efbd1c2bc21d3c948e07cc5a71698b50d5ba38b2e162989147697@0.0.0.0:30303?discport=0',
    ],
    streamsContractAddress: '0x5030fde50dae9f9287fa89ca1d25d4c2bd438f5a',
    whitelistedNodes: [],
    blockToScan: 1103,
    connectedPeers: [],
    diskSize: {
      gethSize: 5905882,
      constellationSize: null,
    },
    totalSmartContracts: 3,
    deletedAt: 1535587200000,
  },
  {
    _id: 'yDG8dLYtjnoXevSJ2',
    instanceId: 'meteortestpower',
    name: 'jjkkj',
    type: 'new',
    peerType: 'authority',
    workerNodeIP: '35.161.9.16',
    user: 'wH4LtZQbxKcZ7a5iN',
    createdOn: 1534809600000,
    totalENodes: [],
    locationCode: 'us-west-2',
    voucherId: null,
    networkConfigId: '8aoacQXfHyJkfzwj9',
    metadata: {
      voucher: null,
      networkConfig: {
        _id: '8aoacQXfHyJkfzwj9',
        name: 'Light',
        cpu: 2,
        ram: 7.5,
        disk: 200,
        isDiskChangeable: false,
        createdAt: '2018-07-28T21:34:13.111Z',
        active: true,
      },
    },
    networkConfig: {
      cpu: 2000,
      ram: 7.5,
      disk: 200,
    },
    createdAt: '2018-08-19T11:21:05.048Z',
    active: false,
    apisPort: 31397,
    clusterIP: '100.69.105.242',
    ethNodePort: 32040,
    impulsePort: 31709,
    impulseURL: 'http://35.161.9.16:31709',
    realAPIsPort: 6382,
    realEthNodePort: 23000,
    realImpulsePort: 7558,
    realRPCNodePort: 8545,
    rpcNodePort: 31173,
    updatedAt: '2018-08-19T11:23:31.000Z',
    'api-password': 'gooqstfx',
    status: 'down',
    impulseStatus: 'down',
    assetsContractAddress: '0x580b61f36f894becf1307507b352710ade542357',
    atomicSwapContractAddress: '0xc1f9fb643e7e0b6766a8e95a761b9705cba917af',
    currentValidators: ['0x7d37f1afce24b34e19bfab26b4201edf229067ec'],
    genesisBlock:
      '{\n  "config": {\n    "chainId": 2017,\n    "homesteadBlock": 1,\n    "eip150Block": 2,\n    "eip150Hash": "0x0000000000000000000000000000000000000000000000000000000000000000",\n    "eip155Block": 3,\n    "eip158Block": 3,\n    "istanbul": {\n      "epoch": 30000,\n      "policy": 0\n    }\n  },\n  "nonce": "0x0",\n  "timestamp": "0x5b7952bb",\n  "extraData": "0x0000000000000000000000000000000000000000000000000000000000000000f85ad5947d37f1afce24b34e19bfab26b4201edf229067ecb8410000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c0",\n  "gasLimit": "0xde0b6b3a763ffff",\n  "difficulty": "0x1",\n  "mixHash": "0x63746963616c2062797a616e74696e65206661756c7420746f6c6572616e6365",\n  "coinbase": "0x0000000000000000000000000000000000000000",\n  "alloc": {\n    "7d37f1afce24b34e19bfab26b4201edf229067ec": {\n      "balance": "0x446c3b15f9926687d2c40534fdb564000000000000"\n    }\n  },\n  "number": "0x0",\n  "gasUsed": "0x0",\n  "parentHash": "0x0000000000000000000000000000000000000000000000000000000000000000"\n}\n',
    genesisBlockHash: '0x0475cd7737bbebae4ebce2ef0caeeae8240d5e8bc79a11a22dfc9883e396df4a',
    impulse: {
      privateKey: 'f0b11e48735bdf0b1e5cfc125305239dca2dd63aa30657295608cb3cf2d5c87c',
      publicKey: '0341070dd12b13e3d63e941520d20eeded54cbd694a799344676e02cabd5e4e5be',
    },
    nodeEthAddress: '0x7d37f1afce24b34e19bfab26b4201edf229067ec',
    nodeId: '109332fb3f28db9cf0c3b595bff75c1ffe9aa0de0026312d31e6bd76f260af3144cbce47c07d6571f198fb9e9366c77e6019bfb2189d4762f4e575d189e15827',
    nodeKey: 'e6229d912f8de1f59fdedc03b00bf21692c088c49670eacaf077dc97bbadc500',
    staticPeers: [
      'enode://109332fb3f28db9cf0c3b595bff75c1ffe9aa0de0026312d31e6bd76f260af3144cbce47c07d6571f198fb9e9366c77e6019bfb2189d4762f4e575d189e15827@0.0.0.0:30303?discport=0',
    ],
    streamsContractAddress: '0x5546f947dab824d2cc98b4c186ee1dca6fa6f83a',
    whitelistedNodes: [],
    blockToScan: 127,
    connectedPeers: [],
    diskSize: {
      gethSize: 1389115,
      constellationSize: null,
    },
    totalSmartContracts: 3,
    deletedAt: 1535587200000,
  },
];

export default function createUsers() {
  Networks.remove({});
  data.forEach(network => {
    Networks.insert(network);
  });
}
