/**
 *@file    keystore.js
 *@date    2019-10-22
 *@disc
 */

const scryptsy = require('scrypt.js');
const {isString, isObject} = require('lodash');
const Account = require('./account');
const  uuid =  require('uuid');
const Hash = require('./hash');
const randomBytes = require('randombytes');
const {pbkdf2Sync} = require('pbkdf2');
const {createCipheriv, createDecipheriv} = require('browserify-cipher');
const Buffer = require('safe-buffer').Buffer;



/**
 * This method will map the current Account object to V3Keystore object.
 *
 * @method toV3Keystore
 *
 * @param {String} privatekey
 * @param {String} password
 * @param {Object} options
 *
 // * @returns {{version, id, address, crypto}}
 * @returns {string}
 */
const toV3Keystore = (privatekey, password, options) => {
    options = options || {};
    const salt = options.salt || randomBytes(32);
    const iv = options.iv || randomBytes(16);

    let derivedKey;
    const kdf = options.kdf || 'scrypt';
    const kdfparams = {
        dklen: options.dklen || 32,
        salt: salt.toString('hex')
    };

    if (kdf === 'pbkdf2') {
        kdfparams.c = options.c || 262144;
        kdfparams.prf = 'hmac-sha256';
        derivedKey = pbkdf2Sync(Buffer.from(password), salt, kdfparams.c, kdfparams.dklen, 'sha256');
    } else if (kdf === 'scrypt') {
        // FIXME: support progress reporting callback
        kdfparams.n = options.n || 8192; // 2048 4096 8192 16384
        kdfparams.r = options.r || 8;
        kdfparams.p = options.p || 1;
        derivedKey = scryptsy(Buffer.from(password), salt, kdfparams.n, kdfparams.r, kdfparams.p, kdfparams.dklen);
    } else {
        throw new Error('Unsupported kdf');
    }

    const cipher = createCipheriv(options.cipher || 'aes-128-ctr', derivedKey.slice(0, 16), iv);
    if (!cipher) {
        throw new Error('Unsupported cipher');
    }

    const account = Account.fromPrivate(privatekey);

    const ciphertext = Buffer.concat([
        cipher.update(Buffer.from(account.privateKey.replace("0x", ""), 'hex')),
        cipher.final()
    ]);

    const mac = Hash.keccak256(Buffer.concat([derivedKey.slice(16, 32), Buffer.from(ciphertext, 'hex')])).replace(
        '0x',
        ''
    );

    return {
        version: 3,
        id: uuid.v4({random: options.uuid || randomBytes(16)}),
        address: account.address,
        crypto: {
            ciphertext: ciphertext.toString('hex'),
            cipherparams: {
                iv: iv.toString('hex')
            },
            cipher: options.cipher || 'aes-128-ctr',
            kdf,
            kdfparams,
            mac: mac.toString('hex')
        }
    }
}

/**
 * TODO: Clean up this method
 *
 * Returns an Account object by the given V3Keystore object.
 *
 *
 * @method fromV3Keystore
 *
 * @param {Object|String} v3Keystore
 * @param {String} password
 * @param {Boolean} nonStrict
 *
 * @returns {{address, privateKey}}
 */
const fromV3Keystore = (v3Keystore, password, nonStrict = false) => {
    if (!isString(password)) {
        throw new Error('No password given.');
    }

    const json = isObject(v3Keystore) ? v3Keystore : JSON.parse(nonStrict ? v3Keystore.toLowerCase() : v3Keystore);

    if (json.version !== 3) {
        throw new Error('Not a valid V3 wallet');
    }

    let derivedKey;
    let kdfparams;
    if (json.crypto.kdf === 'scrypt') {
        kdfparams = json.crypto.kdfparams;

        // FIXME: support progress reporting callback
        derivedKey = scryptsy(
            Buffer.from(password),
            Buffer.from(kdfparams.salt, 'hex'),
            kdfparams.n,
            kdfparams.r,
            kdfparams.p,
            kdfparams.dklen
        );
    } else if (json.crypto.kdf === 'pbkdf2') {
        kdfparams = json.crypto.kdfparams;

        if (kdfparams.prf !== 'hmac-sha256') {
            throw new Error('Unsupported parameters to PBKDF2');
        }

        derivedKey = pbkdf2Sync(
            Buffer.from(password),
            Buffer.from(kdfparams.salt, 'hex'),
            kdfparams.c,
            kdfparams.dklen,
            'sha256'
        );
    } else {
        throw new Error('Unsupported key derivation scheme');
    }

    const ciphertext = Buffer.from(json.crypto.ciphertext, 'hex');

    const mac = Hash.keccak256(Buffer.concat([derivedKey.slice(16, 32), ciphertext])).replace('0x', '');
    if (mac !== json.crypto.mac) {
        throw new Error('Key derivation failed - possibly wrong password');
    }

    const decipher = createDecipheriv(
        json.crypto.cipher,
        derivedKey.slice(0, 16),
        Buffer.from(json.crypto.cipherparams.iv, 'hex')
    );
    const seed = `0x${Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('hex')}`;

    return Account.fromPrivate(seed);
}


module.exports = {
    toV3Keystore,
    fromV3Keystore
}
