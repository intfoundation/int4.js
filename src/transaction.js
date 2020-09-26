const Account = require("./account");
const Nat = require("./nat");
const Bytes = require("./bytes");
const RLP = require("./rlp");
const keccak256 = require("./hash").keccak256;

// Transaction -> Bytes
const signingData = tx => {
  return RLP.encode([
    Bytes.fromNat(tx.nonce),
    Bytes.fromNat(tx.gasPrice),
    Bytes.fromNat(tx.gas),
    tx.to ? Bytes.fromNat(tx.to) : "0x",
    Bytes.fromNat(tx.value),
    tx.data,
    Bytes.fromNat(tx.chainId || "0x1"),
    "0x",
    "0x"
  ]);
};

const signingCallData = tx => {
  return RLP.encode([
    // Bytes.fromNat(tx.nonce),
    Bytes.fromNat(tx.gasPrice),
    Bytes.fromNat(tx.gas),
    tx.to ? Bytes.fromNat(tx.to) : "0x",
    Bytes.fromNat(tx.value),
    tx.data,
    Bytes.fromNat(tx.chainId || "0x1"),
    "0x",
    "0x"
  ]);
};

// Transaction, Account -> Bytes
const sign = (tx, account) => {
  const data = signingData(tx);
  const signature = Account.makeSigner(Nat.toNumber(tx.chainId || "0x1") * 2 + 35)(keccak256(data), account.privateKey);
  const rawTransaction = RLP.decode(data).slice(0,6).concat(Account.decodeSignature(signature));
  return RLP.encode(rawTransaction);
};

const signCall = (tx, account) => {
  const data = signingCallData(tx);
  const signature = Account.makeSigner(Nat.toNumber(tx.chainId || "0x1") * 2 + 35)(keccak256(data), account.privateKey);
  const rawTransaction = RLP.decode(data).slice(0,6).concat(Account.decodeSignature(signature));
  return RLP.encode(rawTransaction);
};

// Bytes -> Address
const recover = (rawTransaction) => {
  const values = RLP.decode(rawTransaction);
  const signature = Account.encodeSignature(values.slice(6,9));
  const recovery = Bytes.toNumber(values[6]);
  const extraData = recovery < 35 ? [] : [Bytes.fromNumber((recovery - 35) >> 1), "0x", "0x"]
  const data = values.slice(0,6).concat(extraData);
  const dataHex = RLP.encode(data);
  return Account.recover(keccak256(dataHex), signature);
};

module.exports = {
  sign,
  signCall,
  recover
};
