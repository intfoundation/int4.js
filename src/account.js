const Bytes = require("./bytes");
const Nat = require("./nat");
const elliptic = require("elliptic");
const secp256k1 = new (elliptic.ec)("secp256k1"); // eslint-disable-line
const {keccak256, keccak256s} = require("./hash");
const Crypto = require("./crypto");
const Base58Check = require("bs58check");
const Buffer = require('safe-buffer').Buffer;


const Version = 0x05;
const create = entropy => {
  const innerHex = keccak256(Bytes.concat(Bytes.random(32), entropy || Bytes.random(32)));
  const middleHex = Bytes.concat(Bytes.concat(Bytes.random(32), innerHex), Bytes.random(32));
  const outerHex = keccak256(middleHex);
  return fromPrivate(outerHex);
}

const fromPrivate = privateKey => {
  const buffer = new Buffer(privateKey.slice(2), "hex");
  const ecKey = secp256k1.keyFromPrivate(buffer);
  const pubKey = ecKey.getPublic(false, 'hex');
  // NOTE: hash160 params is buffer
  const hash160 = Crypto.hash160(Buffer.from(pubKey, "hex"));
  var address = toBase58Check(hash160, Version);
  address = "INT" + address.substr(0, 29);
  return {
    address: address,
    privateKey: privateKey
  }
}

const isAddress = address => {
  if (typeof address !== "string") {
    return false
  }else if (address.length !== 32) {
    return false
  }else if (address.substr(0, 4) != "INT3") {
    return false
  }
  return true
}

const toBase58Check = (hash, version) => {
  // typeforce(types.tuple(types.Hash160bit, types.UInt8), arguments);

  const payload = Buffer.allocUnsafe(21);
  payload.writeUInt8(version, 0);
  hash.copy(payload, 1);
  return Base58Check.encode(payload)
}

const encodeSignature = ([v, r, s]) =>
  Bytes.flatten([r,s,v]);

const decodeSignature = (hex) => [
  Bytes.slice(64, Bytes.length(hex), hex),
  Bytes.slice(0, 32, hex),
  Bytes.slice(32, 64, hex)];

const makeSigner = addToV => (hash, privateKey) => {
  const signature = secp256k1
    .keyFromPrivate(new Buffer(privateKey.slice(2), "hex"))
    .sign(new Buffer(hash.slice(2), "hex"), {canonical: true});
  return encodeSignature([
    Nat.fromString(Bytes.fromNumber(addToV + signature.recoveryParam)),
    Bytes.pad(32, Bytes.fromNat("0x" + signature.r.toString(16))),
    Bytes.pad(32, Bytes.fromNat("0x" + signature.s.toString(16)))]);
}

const sign = makeSigner(27); // v=27|28 instead of 0|1...

const recover = (hash, signature) => {
  const vals = decodeSignature(signature);
  const vrs = {v: Bytes.toNumber(vals[0]), r:vals[1].slice(2), s:vals[2].slice(2)};
  const ecPublicKey = secp256k1.recoverPubKey(new Buffer(hash.slice(2), "hex"), vrs, vrs.v < 2 ? vrs.v : 1 - (vrs.v % 2)); // because odd vals mean v=0... sadly that means v=0 means v=1... I hate that
  const hash160 = Crypto.hash160(Buffer.from(pubKey, "hex"));
  var address = toBase58Check(hash160, Version);
  address = "INT" + address.substr(0, 29);
  return address;
}

module.exports = {
  create,
  fromPrivate,
  isAddress,
  sign,
  makeSigner,
  recover,
  encodeSignature,
  decodeSignature
}
