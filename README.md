# int4.js - INT Chain 4.0 JavaScript API
[![NPM Package Version][npm-image-version]][npm-url] [![NPM Package Downloads][npm-image-downloads]][npm-url] [![Coverage Status][coveralls-image]][coveralls-url] [![License][license-image]][license-url] ![GitHub top language][language-image] ![Size][size-image] ![Nodejs Package][package-image] ![Last Commit][commit-image]

## Installation

### Node

```bash
npm i int4.js
```

### Yarn

```bash
yarn add int4.js
```

## Usage


### int4
```js
const int4 = require('int4.js');
console.log(int4);

{   
    account:{},
    nat:{},
    bytes:{},
    hash:{},
    RLP:{},
    abi:{},
    transaction:{},
    rpc:{},
    desubits:{},
    passphrase:{},
    keystore:{},
    utils:{}
}
```

### const
```js
const Account = int4.account;
const RPC = int4.rpc;
const Nat = int4.nat;
const Transaction = int4.transaction;
const Utils = int4.utils;
const Abi = int4.abi;
const Keystore = int4.keystore;

const testAccount = {
    address: 'INT3NFz9R4wY4VUMbWaLbdH4tPJHAmrn',
    privateKey: '0x353d3eab4643ab04972eaa80e4b3383266fea8cfd743605c62dd0fb07768ba7a'
};
const testValidator = {
    address:     "INT3NFz9R4wY4VUMbWaLbdH4tPJHAmrn",
    consPrivKey: "0x56F2EBBF7EAA3FB044A9D7EA070D2A205E6AF091E1EDA0C95B0AB2BE39D9B4E9",
    consPubKey:  "0x0684EF4E9B6F47A0EB5430B427CB00687FBD301B695101EDB0DCC69CDDB3635239DF0B4D471F6B7F43077EA614492EC2438707FE26A8D9E64D463ACDFE806D0375B4DE3D43BC57FF2F31FA14D9A4B81E40A572E2ACD9742ED43C09A328487229678195B7F90D14A6D8493E750347C339508C8480F712369D919F747014E15C21",
};

const InterContractAddr = "INT3FFFFFFFFFFFFFFFFFFFFFFFFFFFF";

const RegisterABI = {
        "type": "function",
        "name": "Register",
        "constant": false,
        "inputs": [
            {
                "name": "pubkey",
                "type": "bytes"
            },
            {
                "name": "signature",
                "type": "bytes"
            },
            {
                "name": "commission",
                "type": "uint8"
            }
        ]
};

```

### Create Account
 
 ```js
let account = Account.create();
console.log(account)
{ 
  address: 'INT3NFz9R4wY4VUMbWaLbdH4tPJHAmrn',
  privateKey: '0x353d3eab4643ab04972eaa80e4b3383266fea8cfd743605c62dd0fb07768ba7a' 
}
```

### Create Keystore

```js
let v3Keystore = Keystore.toV3Keystore(keystore.privateKey, keystore.password, {});
console.log(v3Keystore);

{ version: 3,
  id: 'b596552f-ccd6-442c-9411-097f392a8796',
  address: 'INT3CTuDn49ET2dgMWBRauQMnnQECZy9',
  crypto:
   { ciphertext:
      '9787b80d9eb516b6281dc3d5d108d24aadc21a85db8f4ea8fa7df1fd92d83122',
     cipherparams: { iv: '4ae4cd88acbe22769421744b220c3909' },
     cipher: 'aes-128-ctr',
     kdf: 'scrypt',
     kdfparams:
      { dklen: 32,
        salt:
         'a5e79e8ed19a6bc742c56e0aded85f81e924f46a33c4c03dd848d6ceed2a9091',
        n: 8192,
        r: 8,
        p: 1 },
     mac:
      '09d9bd8bbb990892c38b006e71faa27a3d6f3a3c02371555f0b9b39c78b091a2' } }
```

### Recover Account from PrivateKey or Keystore

```js

const keystore = {
    password: '123456789',
    address: 'INT3CTuDn49ET2dgMWBRauQMnnQECZy9',
    privateKey: '0xea03153d519677c7a355d95d3308ecc6b863d686f0d80192e5ee74984f5bc5ac',
    json: {"version":3,"id":"fc64a970-117a-4507-925b-4107b761d361","address":"INT3CTuDn49ET2dgMWBRauQMnnQECZy9","crypto":{"ciphertext":"f6bde26131cf6c26a87c3bfdfeae8426b564e7263a1238e2bdce9da36c7fdc20","cipherparams":{"iv":"75df1a41193930a895721c0f077b2be7"},"cipher":"aes-128-ctr","kdf":"scrypt","kdfparams":{"dklen":32,"salt":"dd8233d31da738ee24a4c9926bfe8f67971dc8780fda8809c02713533414ed15","n":8192,"r":8,"p":1},"mac":"735c0d711f712dbcaea783bf94b108a5ef681657a340f7f662fa6925e2defcb6"}}
};

let fromPrivAccount = Account.fromPrivate(keystore.privateKey); 
let fromKeystoreAccount = Keystore.fromV3Keystore(keystore.json, keystore.password);   
console.log(fromPrivAccount/fromKeystoreAccount);

{ address: 'INT3CTuDn49ET2dgMWBRauQMnnQECZy9',
  privateKey: '0xea03153d519677c7a355d95d3308ecc6b863d686f0d80192e5ee74984f5bc5ac' 
}
```

### SendRawTransaction
* The javascript code should be inside the async function.

```js
let url = "http://129.226.134.100:8555/testnet";
let send = RPC(url);
let nonce = await send("int_getTransactionCount", [testAccount.address, "latest"]);
let tx = {
    chainId: Nat.fromString("2"),  //  2 for testnet
    nonce: Nat.fromString(nonce),
    gasPrice: Nat.fromString("10000000000"),
    gas: Nat.fromString("30000"),
    to: Utils.stringToHex(testAccount.address),
    value: Nat.fromString(Utils.fromINT('0')),
    data: "0x"
};

let signature = Transaction.sign(tx, testAccount);
let hash = await send("int_sendRawTransaction", [signature]);
console.log(hash);
```


### Register Transaction
* The javascript code should be inside the async function.

```js
let url = "http://129.226.134.100:8555/testnet";
let send = RPC(url);
let nonce = await send("int_getTransactionCount", [testAccount.address, "latest"]);
let addressSign = await send("int_signAddress", [testAccount.address,testValidator.consPrivKey]);


let inputs = RegisterABI.inputs;
let types = [];
for (let input of inputs) {
    types.push(input.type)
}

let methodId = Abi.methodID(RegisterABI.name, types);  // 0xf1b2ef10

let encodeData = Abi.encodeParams(types, [testValidator.consPubKey, addressSign, 10]);
let data = "0x" + methodId.slice(2) + encodeData.slice(2);

let tx = {
    chainId: Nat.fromString("2"),
    nonce: Nat.fromString(nonce),
    gasPrice: Nat.fromString("10000000000"),
    gas: Nat.fromString("50000"),
    to: Utils.stringToHex(InterContractAddr),
    value: Nat.fromString(Utils.fromINT('10000')),
    data: data
};

let signature = Transaction.sign(tx, testAccount);
let hash = await send("int_sendRawTransaction", [signature]);
console.log(hash)
```


## Building

### Requirements

-   [Node.js](https://nodejs.org)
-   [npm](https://www.npmjs.com/)

### Building (babel)

Build the int4.js package:

```bash
npm run build
```

### Testing (mocha)

```bash
npm run test
```

## License
```
MIT License

Copyright (c) 2020 INT Chain

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

```

[npm-image-version]: https://img.shields.io/npm/v/int4.js.svg
[npm-image-downloads]: https://img.shields.io/npm/dm/int4.js.svg?color=purple
[npm-url]: https://npmjs.org/package/int4.js

[actions-image]: https://github.com/intfoundation/int4.js/workflows/Build/badge.svg
[actions-url]: https://github.com/intfoundation/int4.js/actions

[coveralls-image]: https://img.shields.io/coveralls/github/intfoundation/int4.js
[coveralls-url]: https://img.shields.io/coveralls/github/intfoundation/int4.js

[license-image]: https://img.shields.io/github/license/intfoundation/int4.js
[license-url]: https://github.com/intfoundation/int4.js/blob/master/LICENSE

[language-image]: https://img.shields.io/github/languages/top/intfoundation/int4.js?color=yellow

[size-image]: https://img.shields.io/github/repo-size/intfoundation/int4.js?color=light

[package-image]: https://github.com/intfoundation/int4.js/workflows/Node.js%20Package/badge.svg

[commit-image]: https://img.shields.io/github/last-commit/intfoundation/intchain
