const Assert = require('assert');
const Nat = require('../src/nat');
const Account = require('../src/account');
const Keystore = require('../src/keystore');
const Transaction = require('../src/transaction');
const RPC = require('../src/rpc');
const Abi = require('../src/abi');
const Utils = require('../src/utils');

const testAccount = {
    address: 'INT3Pkr1zMmk3mnFzihH5F4kNxFavJo4',
    privateKey: '0xc15c038a5a9f8f948a2ac0eb102c249e4ae1c4fa1f0971b50c63db46dc5fcf8b'
};

const testValidator = {
    address:     "INT3Pkr1zMmk3mnFzihH5F4kNxFavJo4",
    consPrivKey: "0x56F2EBBF7EAA3FB044A9D7EA070D2A205E6AF091E1EDA0C95B0AB2BE39D9B4E9",
    consPubKey:  "0x0684EF4E9B6F47A0EB5430B427CB00687FBD301B695101EDB0DCC69CDDB3635239DF0B4D471F6B7F43077EA614492EC2438707FE26A8D9E64D463ACDFE806D0375B4DE3D43BC57FF2F31FA14D9A4B81E40A572E2ACD9742ED43C09A328487229678195B7F90D14A6D8493E750347C339508C8480F712369D919F747014E15C21",
}

const keystore = {
    password: '123456789',
    address: 'INT3CTuDn49ET2dgMWBRauQMnnQECZy9',
    privateKey: '0xea03153d519677c7a355d95d3308ecc6b863d686f0d80192e5ee74984f5bc5ac',
    json: {"version":3,"id":"fc64a970-117a-4507-925b-4107b761d361","address":"INT3CTuDn49ET2dgMWBRauQMnnQECZy9","crypto":{"ciphertext":"f6bde26131cf6c26a87c3bfdfeae8426b564e7263a1238e2bdce9da36c7fdc20","cipherparams":{"iv":"75df1a41193930a895721c0f077b2be7"},"cipher":"aes-128-ctr","kdf":"scrypt","kdfparams":{"dklen":32,"salt":"dd8233d31da738ee24a4c9926bfe8f67971dc8780fda8809c02713533414ed15","n":8192,"r":8,"p":1},"mac":"735c0d711f712dbcaea783bf94b108a5ef681657a340f7f662fa6925e2defcb6"}}
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


describe("Account", () => {
    describe("#create()", () => {
        it("Must return address and privateKey of the created account", () => {
            let account = Account.create();
            Assert(account.address !== "" && account.privateKey !== "")
        })
    })

    describe("#fromPrivateKey()", () => {
        it("Must recover the same address", () => {
            let recoverAddr = Account.fromPrivate(testAccount.privateKey).address;
            Assert(testAccount.address === recoverAddr)
        })
    })

    describe("#isValidAddress()", () => {
        it("Must match verification result", () => {
            let addressList = [
                { address: "INT3Pkr1zMmk3mnFzihH5F4kNxFavJo4", valid: true  },
                { address: "INT3Pkr1zMmk3mnFzihH5F4kNxFavJo",  valid: false },
                { address: "INT4Pkr1zMmk3mnFzihH5F4kNxFavJo4", valid: false },
                { address: "iNT3Pkr1zMmk3mnFzihH5F4kNxFavJo4", valid: false },
                { address: "InT3Pkr1zMmk3mnFzihH5F4kNxFavJo4", valid: false },
                { address: "INt3Pkr1zMmk3mnFzihH5F4kNxFavJo4", valid: false },
                { address: "int3Pkr1zMmk3mnFzihH5F4kNxFavJo4", valid: false },
                { address: "Int3Pkr1zMmk3mnFzihH5F4kNxFavJo4", valid: false },
                { address: "iNt3Pkr1zMmk3mnFzihH5F4kNxFavJo4", valid: false },
                { address: "inT3Pkr1zMmk3mnFzihH5F4kNxFavJo4", valid: false },
                { address: "INT", valid: false   },
                { address: "INT3", valid: false  },
                { address: "INT3Pkr1zMmk3mnFzihH5F4kNxFavJo0", valid: false },
                { address: "INT3Pkr1zMmk3mnFzihH5F4kNxFavJoO", valid: false },
                { address: "INT3Pkr1zMmk3mnFzihH5F4kNxFavJoI", valid: false },
                { address: "INT3Pkr1zMmk3mnFzihH5F4kNxFavJol", valid: false },
                { address: "INT3FFFFFFFFFFFFFFFFFFFFFFFFFFFF", valid: true },
                { address: "INT3AAAAAAAAAAAAAAAAAAAAAAAAAAAA", valid: true },
            ];

            for (let address of addressList) {
                let isValid = Account.isValidAddress(address.address);
                Assert(address.valid === isValid)
            }
        })
    })
});

describe("Keystore", () => {
   describe("#toV3Keystore", () => {
       it("Must generate v3 keystore", () => {
           let v3Keystore = Keystore.toV3Keystore(keystore.privateKey, keystore.password, {});
           Assert(v3Keystore.version === 3);
       })
   });

   describe("#fromV3Keystore()", () => {
       it("Must recover the same private key", () => {
           let privateKey = Keystore.fromV3Keystore(keystore.json, keystore.password).privateKey;
           Assert(keystore.privateKey === privateKey)
       })
   })
});


describe("Transaction", () => {
    describe("#sign()", () => {
        it("Must generate the same signature", () => {
            let tx = {
                object: {
                    chainId: Nat.fromString("2"),
                    nonce: Nat.fromString("0"),
                    gasPrice: Nat.fromString("10000000000"),
                    gas: Nat.fromString("30000"),
                    to: Utils.stringToHex(testAccount.address),
                    value: Nat.fromString("0"),
                    data: "0x"
                },
                signature:'0xf870808502540be400827530a0494e5433506b72317a4d6d6b336d6e467a6968483546346b4e784661764a6f34808028a075a8d89b0e88a24b51eebbf0cbac07c52fd4ebe434594b13bb54674bff60c3cda05cc30d2b8b144889650ebc70d68ab4e403b91180a2cd8fad52f9d9652c31121d'
            };

            let signature = Transaction.sign(tx.object, testAccount);
            Assert(tx.signature === signature);

        })
    });

    describe("sendRawTransaction()", () => {
        it("Must return the transaction hash", async () => {
            let url = "http://129.226.134.100:8555/testnet";
            let send = RPC(url);
            let nonce = await send("int_getTransactionCount", [testAccount.address, "latest"]);
            console.log(nonce);
            let tx = {
                chainId: Nat.fromString("2"),
                nonce: Nat.fromString(nonce),
                gasPrice: Nat.fromString("10000000000"),
                gas: Nat.fromString("30000"),
                to: Utils.stringToHex(testAccount.address),
                value: Nat.fromString("0"),
                data: "0x"
            };

            let signature = Transaction.sign(tx, testAccount);
            let hash = await send("int_sendRawTransaction", [signature]);
            Assert(hash !== "")
        });
    });

    describe("register()", () => {
        it("Must return the transaction hash", async () => {
            let url = "http://129.226.134.100:8555/testnet";
            let send = RPC(url);
            let nonce = await send("int_getTransactionCount", [testAccount.address, "latest"]);
            // console.log(nonce);
            let addressSign = await send("int_signAddress", [testAccount.address,testValidator.consPrivKey]);
            // console.log(addressSign);

            let inputs = RegisterABI.inputs;
            let types = [];
            for (let input of inputs) {
                types.push(input.type)
            }

            let methodId = Abi.methodID(RegisterABI.name, types);  // 0xf1b2ef10
            Assert(methodId === "0xf1b2ef10");

            let rawData = "0x00000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000800684ef4e9b6f47a0eb5430b427cb00687fbd301b695101edb0dcc69cddb3635239df0b4d471f6b7f43077ea614492ec2438707fe26a8d9e64d463acdfe806d0375b4de3d43bc57ff2f31fa14d9a4b81e40a572e2acd9742ed43c09a328487229678195b7f90d14a6d8493e750347c339508c8480f712369d919f747014e15c210000000000000000000000000000000000000000000000000000000000000040205bad9718ae61bfd1c4c18c941cbfe2def912e1094b7327e6abddd2dc3fdc89641a94a65322dbd6a3998c2eab9de1f23e72562cc699f2d0e3e1ebf00b431632"
            let encodeData = Abi.encodeParams(types, [testValidator.consPubKey, addressSign, 10]);

            Assert(encodeData === rawData);
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
            // let hash = await send("int_sendRawTransaction", [signature]);
            // Assert(hash !== "")
        })
    })

});


describe("Nat", () => {
    describe("#fromINT()", () => {
        let amount = '8';
        let a = Utils.fromINT(amount);
        console.log(a);
    })
});
