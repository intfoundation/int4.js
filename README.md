# int4.js - INT Chain 4.0 JavaScript API
[![NPM Package Version][npm-image-version]][npm-url] [![NPM Package Downloads][npm-image-downloads]][npm-url] [![Build Status][actions-image]][actions-url] [![Coverage Status][coveralls-image]][coveralls-url] [![License][license-image]][license-url]

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



const RPC = int4.rpc;
const Nat = int4.nat;
const Transaction = int4.transaction;
const Utils = int4.utils;
const Abi = int4.abi;

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

 // Create Account
let account = int4.account.create();

{ 
  address: 'INT3NFz9R4wY4VUMbWaLbdH4tPJHAmrn',
  privateKey: '0x353d3eab4643ab04972eaa80e4b3383266fea8cfd743605c62dd0fb07768ba7a' 
}




 // SendRawTransaction
 // The javascript code should be inside the async function.

let url = "http://129.226.134.100:8555/testnet";
let send = RPC(url);
let nonce = await send("int_getTransactionCount", [testAccount.address, "latest"]);
let tx = {
    chainId: Nat.fromString("2"),  //  2 for testnet
    nonce: Nat.fromString(nonce),
    gasPrice: Nat.fromString("10000000000"),
    gas: Nat.fromString("30000"),
    to: Utils.stringToHex(testAccount.address),
    value: Nat.fromString(Nat.fromINT(0)),
    data: "0x"
};

let signature = Transaction.sign(tx, testAccount);
let hash = await send("int_sendRawTransaction", [signature]);
console.log(hash);


 // Register Transaction
 // The javascript code should be inside the async function.
 
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
    value: Nat.fromString(Nat.fromINT(10000)),
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
[npm-image-downloads]: https://img.shields.io/npm/dm/int4.js.svg
[npm-url]: https://npmjs.org/package/int4.js

[actions-image]: https://github.com/intfoundation/int4.js/workflows/Build/badge.svg
[actions-url]: https://github.com/intfoundation/int4.js/actions

[coveralls-image]: https://img.shields.io/coveralls/github/intfoundation/int4.js
[coveralls-url]: https://img.shields.io/coveralls/github/intfoundation/int4.js

[license-image]: https://img.shields.io/github/license/intfoundation/int4.js
[license-url]: https://npmjs.org/package/int4.js/lincese
