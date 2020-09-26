const BN = require('bn.js');
const numberToBN = require('number-to-bn');
const keccak256 = require('./hash').keccak256;
const Buffer = require('safe-buffer').Buffer;
const _ = require('underscore');

/**
 * Returns true if object is BN, otherwise false
 *
 * @method isBN
 * @param {Object} object
 * @return {Boolean}
 */
var isBN = function (object) {
    return BN.isBN(object);
};


const stringToHex = (str) => {
    var val = "0x";
    for (var i = 0; i < str.length; i++) {
        if (val == "") { val = str.charCodeAt(i).toString(16); } else { val += str.charCodeAt(i).toString(16); }
    }
    return val;
}

const hexToString = (str) => {
    let s = str.indexOf("0x") == 0 ? str.slice(2) : str;
    let val = '';
    for(let i = 0; i < s.length; i += 2) {
        val += String.fromCharCode(+parseInt(s.substr(i, 2), 16).toString(10))
    }
    return val;
}

function stripZeros(aInput) {
    var a = aInput; // eslint-disable-line
    var first = a[0]; // eslint-disable-line
    while (a.length > 0 && first.toString() === '0') {
        a = a.slice(1);
        first = a[0];
    }
    return a;
}

function bnToBuffer(bnInput) {
    var bn = bnInput; // eslint-disable-line
    var hex = bn.toString(16); // eslint-disable-line
    if (hex.length % 2) { hex = `0${hex}`; }
    return stripZeros(Buffer.from(hex, 'hex'));
}

function isHexString(value, length) {
    if (typeof(value) !== 'string' || !value.match(/^0x[0-9A-Fa-f]*$/)) {
        return false;
    }
    if (length && value.length !== 2 + 2 * length) { return false; }
    return true;
}

function hexOrBuffer(valueInput, name) {
    var value = valueInput; // eslint-disable-line
    if (!Buffer.isBuffer(value)) {
        if (!isHexString(value)) {
            const error = new Error(name ? (`[intjs-abi] invalid ${name}`) : '[intjs-abi] invalid hex or buffer, must be a prefixed alphanumeric even length hex string');
            error.reason = '[intjs-abi] invalid hex string, hex must be prefixed and alphanumeric (e.g. 0x023..)';
            error.value = value;
            throw error;
        }

        value = value.substring(2);
        if (value.length % 2) { value = `0${value}`; }
        value = Buffer.from(value, 'hex');
    }

    return value;
}

function hexlify(value) {
    if (typeof(value) === 'number') {
        return `0x${bnToBuffer(new BN(value)).toString('hex')}`;
    } else if (value.mod || value.modulo) {
        return `0x${bnToBuffer(value).toString('hex')}`;
    } else { // eslint-disable-line
        return `0x${hexOrBuffer(value).toString('hex')}`;
    }
}

// getKeys([{a: 1, b: 2}, {a: 3, b: 4}], 'a') => [1, 3]
function getKeys(params, key, allowEmpty) {
    var result = []; // eslint-disable-line

    if (!Array.isArray(params)) { throw new Error(`[intjs-abi] while getting keys, invalid params value ${JSON.stringify(params)}`); }

    for (var i = 0; i < params.length; i++) { // eslint-disable-line
        var value = params[i][key];  // eslint-disable-line
        if (allowEmpty && !value) {
            value = '';
        } else if (typeof(value) !== 'string') {
            throw new Error('[intjs-abi] while getKeys found invalid ABI data structure, type value not string');
        }
        result.push(value);
    }

    return result;
}

function coderNumber(size, signed) {
    return {
        encode: function encodeNumber(valueInput) {
            var value = valueInput; // eslint-disable-line

            if (typeof value === 'object'
                && value.toString
                && (value.toTwos || value.dividedToIntegerBy)) {
                value = (value.toString(10)).split('.')[0];
            }

            if (typeof value === 'string' || typeof value === 'number') {
                value = String(value).split('.')[0];
            }

            value = numberToBN(value);
            value = value.toTwos(size * 8).maskn(size * 8);
            if (signed) {
                value = value.fromTwos(size * 8).toTwos(256);
            }
            return value.toArrayLike(Buffer, 'be', 32);
        },
        decode: function decodeNumber(data, offset) {
            var junkLength = 32 - size; // eslint-disable-line
            var value = new BN(data.slice(offset + junkLength, offset + 32)); // eslint-disable-line
            if (signed) {
                value = value.fromTwos(size * 8);
            } else {
                value = value.maskn(size * 8);
            }
            return {
                consumed: 32,
                value: new BN(value.toString(10)),
            };
        },
    };
}
const uint256Coder = coderNumber(32, false);

const coderBoolean = {
    encode: function encodeBoolean(value) {
        return uint256Coder.encode(value ? 1 : 0);
    },
    decode: function decodeBoolean(data, offset) {
        var result = uint256Coder.decode(data, offset); // eslint-disable-line
        return {
            consumed: result.consumed,
            value: !result.value.isZero(),
        };
    },
};

function coderFixedBytes(length) {
    return {
        encode: function encodeFixedBytes(valueInput) {
            var value = valueInput; // eslint-disable-line
            value = hexOrBuffer(value);

            if (value.length === 32) { return value; }

            var result = Buffer.alloc(32); // eslint-disable-line
            result.fill(0);
            value.copy(result);
            return result;
        },
        decode: function decodeFixedBytes(data, offset) {
            if (data.length !== 0 && data.length < offset + 32) { throw new Error(`[intjs-abi] while decoding fixed bytes, invalid bytes data length: ${length}`); }

            return {
                consumed: 32,
                value: `0x${data.slice(offset, offset + length).toString('hex')}`,
            };
        },
    };
}

const coderAddress = {
    encode: function encodeAddress(valueInput) {
        var value = stringToHex(valueInput); // eslint-disable-line
        var result = Buffer.alloc(32); // eslint-disable-line
        if (!isHexString(value, 32)) { throw new Error('[intjs-abi] while encoding address, invalid address value, not alphanumeric 32 byte hex string'); }
        value = hexOrBuffer(value);
        result.fill(0);
        value.copy(result, 0);
        return result;
    },
    decode: function decodeAddress(data, offset) {
        if (data.length === 0) {
            return {
                consumed: 32,
                value: '',
            };
        }
        if (data.length !== 0 && data.length < offset + 32) { throw new Error(`[intjs-abi] while decoding address data, invalid address data, invalid byte length ${data.length}`); }
        return {
            consumed: 32,
            value: hexToString(`${data.slice(offset + 0, offset + 32).toString('hex')}`),
        };
    },
};

function encodeDynamicBytesHelper(value) {
    var dataLength = parseInt(32 * Math.ceil(value.length / 32)); // eslint-disable-line
    var padding = Buffer.alloc(dataLength - value.length); // eslint-disable-line
    padding.fill(0);

    return Buffer.concat([
        uint256Coder.encode(value.length),
        value,
        padding,
    ]);
}

function decodeDynamicBytesHelper(data, offset) {
    if (data.length !== 0 && data.length < offset + 32) { throw new Error(`[intjs-abi] while decoding dynamic bytes data, invalid bytes length: ${data.length} should be less than ${offset + 32}`); }

    var length = uint256Coder.decode(data, offset).value; // eslint-disable-line
    length = length.toNumber();
    if (data.length !== 0 && data.length < offset + 32 + length) { throw new Error(`[intjs-abi] while decoding dynamic bytes data, invalid bytes length: ${data.length} should be less than ${offset + 32 + length}`); }

    return {
        consumed: parseInt(32 + 32 * Math.ceil(length / 32), 10),
        value: data.slice(offset + 32, offset + 32 + length),
    };
}

const coderDynamicBytes = {
    encode: function encodeDynamicBytes(value) {
        return encodeDynamicBytesHelper(hexOrBuffer(value));
    },
    decode: function decodeDynamicBytes(data, offset) {
        var result = decodeDynamicBytesHelper(data, offset); // eslint-disable-line
        result.value = `0x${result.value.toString('hex')}`;
        return result;
    },
    dynamic: true,
};

const coderString = {
    encode: function encodeString(value) {
        return encodeDynamicBytesHelper(Buffer.from(value, 'utf8'));
    },
    decode: function decodeString(data, offset) {
        var result = decodeDynamicBytesHelper(data, offset); // eslint-disable-line
        result.value = result.value.toString('utf8');
        return result;
    },
    dynamic: true,
};

function coderArray(coder, lengthInput) {
    return {
        encode: function encodeArray(value) {
            var result = Buffer.alloc(0); // eslint-disable-line
            var length = lengthInput; // eslint-disable-line

            if (!Array.isArray(value)) { throw new Error('[intjs-abi] while encoding array, invalid array data, not type Object (Array)'); }

            if (length === -1) {
                length = value.length;
                result = uint256Coder.encode(length);
            }

            if (length !== value.length) { throw new Error(`[intjs-abi] while encoding array, size mismatch array length ${length} does not equal ${value.length}`); }

            value.forEach((resultValue) => {
                result = Buffer.concat([
                    result,
                    coder.encode(resultValue),
                ]);
            });

            return result;
        },
        decode: function decodeArray(data, offsetInput) {
            var length = lengthInput; // eslint-disable-line
            var offset = offsetInput; // eslint-disable-line
            // @TODO:
            // if (data.length < offset + length * 32) { throw new Error('invalid array'); }

            var consumed = 0; // eslint-disable-line
            var decodeResult; // eslint-disable-line

            if (length === -1) {
                decodeResult = uint256Coder.decode(data, offset);
                length = decodeResult.value.toNumber();
                consumed += decodeResult.consumed;
                offset += decodeResult.consumed;
            }

            var value = []; // eslint-disable-line

            for (var i = 0; i < length; i++) { // eslint-disable-line
                const loopResult = coder.decode(data, offset);
                consumed += loopResult.consumed;
                offset += loopResult.consumed;
                value.push(loopResult.value);
            }

            return {
                consumed,
                value,
            };
        },
        dynamic: (lengthInput === -1),
    };
}

// Break the type up into [staticType][staticArray]*[dynamicArray]? | [dynamicType] and
// build the coder up from its parts
const paramTypePart = new RegExp(/^((u?int|bytes)([0-9]*)|(address|bool|string)|(\[([0-9]*)\]))/);

function getParamCoder(typeInput) {
    var type = typeInput; // eslint-disable-line
    var coder = null; // eslint-disable-line
    const invalidTypeErrorMessage = `[intjs-abi] while getting param coder (getParamCoder) type value ${JSON.stringify(type)} is either invalid or unsupported by intjs-abi.`;

    while (type) {
        var part = type.match(paramTypePart); // eslint-disable-line
        if (!part) { throw new Error(invalidTypeErrorMessage); }
        type = type.substring(part[0].length);

        var prefix = (part[2] || part[4] || part[5]); // eslint-disable-line
        switch (prefix) {
            case 'int': case 'uint':
                if (coder) { throw new Error(invalidTypeErrorMessage); }
                var intSize = parseInt(part[3] || 256); // eslint-disable-line
                if (intSize === 0 || intSize > 256 || (intSize % 8) !== 0) {
                    throw new Error(`[intjs-abi] while getting param coder for type ${type}, invalid ${prefix}<N> width: ${type}`);
                }

                coder = coderNumber(intSize / 8, (prefix === 'int'));
                break;

            case 'bool':
                if (coder) { throw new Error(invalidTypeErrorMessage); }
                coder = coderBoolean;
                break;

            case 'string':
                if (coder) { throw new Error(invalidTypeErrorMessage); }
                coder = coderString;
                break;

            case 'bytes':
                if (coder) { throw new Error(invalidTypeErrorMessage); }
                if (part[3]) {
                    var size = parseInt(part[3]); // eslint-disable-line
                    if (size === 0 || size > 32) {
                        throw new Error(`[intjs-abi] while getting param coder for prefix bytes, invalid type ${type}, size ${size} should be 0 or greater than 32`);
                    }
                    coder = coderFixedBytes(size);
                } else {
                    coder = coderDynamicBytes;
                }
                break;

            case 'address':
                if (coder) { throw new Error(invalidTypeErrorMessage); }
                coder = coderAddress;
                break;

            case '[]':
                if (!coder || coder.dynamic) { throw new Error(invalidTypeErrorMessage); }
                coder = coderArray(coder, -1);
                break;

            // "[0-9+]"
            default:
                if (!coder || coder.dynamic) { throw new Error(invalidTypeErrorMessage); }
                var defaultSize = parseInt(part[6]); // eslint-disable-line
                coder = coderArray(coder, defaultSize);
        }
    }

    if (!coder) { throw new Error(invalidTypeErrorMessage); }
    return coder;
}



const zero = new BN(0);
const negative1 = new BN(-1);

const unitMap = {
    'wei':          '1', // eslint-disable-line
    'int':        '1000000000000000000', // eslint-disable-line
};

/**
 * Returns value of unit in Wei
 *
 * @method getValueOfUnit
 * @param {String} unit the unit to convert to, default int
 * @returns {BigNumber} value of the unit (in Wei)
 * @throws error if the unit is not correct:w
 */
function getValueOfUnit(unitInput) {
    const unit = unitInput ? unitInput.toLowerCase() : 'int';
    var unitValue = unitMap[unit]; // eslint-disable-line

    if (typeof unitValue !== 'string') {
        throw new Error(`[intjs-unit] the unit provided ${unitInput} doesn't exists, please use the one of the following units ${JSON.stringify(unitMap, null, 2)}`);
    }

    return new BN(unitValue, 10);
}

function numberToString(arg) {
    if (typeof arg === 'string') {
        if (!arg.match(/^-?[0-9.]+$/)) {
            throw new Error(`while converting number to string, invalid number value '${arg}', should be a number matching (^-?[0-9.]+).`);
        }
        return arg;
    } else if (typeof arg === 'number') {
        return String(arg);
    } else if (typeof arg === 'object' && arg.toString && (arg.toTwos || arg.dividedToIntegerBy)) {
        if (arg.toPrecision) {
            return String(arg.toPrecision());
        } else { // eslint-disable-line
            return arg.toString(10);
        }
    }
    throw new Error(`while converting number to string, invalid number value '${arg}' type ${typeof arg}.`);
}

function fromWei(weiInput, unit, optionsInput) {
    var wei = numberToBN(weiInput); // eslint-disable-line
    var negative = wei.lt(zero); // eslint-disable-line
    const base = getValueOfUnit(unit);
    const baseLength = unitMap[unit].length - 1 || 1;
    const options = optionsInput || {};

    if (negative) {
        wei = wei.mul(negative1);
    }

    var fraction = wei.mod(base).toString(10); // eslint-disable-line

    while (fraction.length < baseLength) {
        fraction = `0${fraction}`;
    }

    if (!options.pad) {
        fraction = fraction.match(/^([0-9]*[1-9]|0)(0*)/)[1];
    }

    var whole = wei.div(base).toString(10); // eslint-disable-line

    if (options.commify) {
        whole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    var value = `${whole}${fraction == '0' ? '' : `.${fraction}`}`; // eslint-disable-line

    if (negative) {
        value = `-${value}`;
    }

    return value;
}

function toWei(intInput, unit) {
    var int = numberToString(intInput); // eslint-disable-line
    const base = getValueOfUnit(unit);
    const baseLength = unitMap[unit].length - 1 || 1;

    // Is it negative?
    var negative = (int.substring(0, 1) === '-'); // eslint-disable-line
    if (negative) {
        int = int.substring(1);
    }

    if (int === '.') { throw new Error(`[intjs-unit] while converting number ${intInput} to wei, invalid value`); }

    // Split it into a whole and fractional part
    var comps = int.split('.'); // eslint-disable-line
    if (comps.length > 2) { throw new Error(`[intjs-unit] while converting number ${intInput} to wei,  too many decimal points`); }

    var whole = comps[0], fraction = comps[1]; // eslint-disable-line

    if (!whole) { whole = '0'; }
    if (!fraction) { fraction = '0'; }
    if (fraction.length > baseLength) { throw new Error(`[intjs-unit] while converting number ${intInput} to wei, too many decimal places`); }

    while (fraction.length < baseLength) {
        fraction += '0';
    }

    whole = new BN(whole);
    fraction = new BN(fraction);
    var wei = (whole.mul(base)).add(fraction); // eslint-disable-line

    if (negative) {
        wei = wei.mul(negative1);
    }

    return new BN(wei.toString(10), 10);
}

/**
 *
 * @method fromWei
 * @param {Number|String} number can be a number, number string or a HEX of a decimal
 * @return {String|Object} When given a BN object it returns one as well, otherwise a number
 */
var fromINT = function(number) {
    if(!isBN(number) && !_.isString(number)) {
        throw new Error('Please pass numbers as strings or BN objects to avoid precision errors.');
    }

    return isBN(number) ? toWei(number, "int") : toWei(number, "int").toString(10);
};

/**
 *
 * @method toINT
 * @param {Number|String|BN} number can be a number, number string or a HEX of a decimal
 * @return {String|Object} When given a BN object it returns one as well, otherwise a number
 */
var toINT = function(number) {
    if(!isBN(number) && !_.isString(number)) {
        throw new Error('Please pass numbers as strings or BN objects to avoid precision errors.');
    }

    return isBN(number) ? fromWei(number, 'int') : fromWei(number, 'int').toString(10);
};


module.exports = {
    BN,
    isBN,
    fromINT,
    toINT,
    stringToHex,
    hexToString,
    bnToBuffer,
    isHexString,
    hexOrBuffer,
    hexlify,
    stripZeros,

    keccak256,

    getKeys,
    numberToBN,
    coderNumber,
    uint256Coder,
    coderBoolean,
    coderFixedBytes,
    coderAddress,
    coderDynamicBytes,
    coderString,
    coderArray,
    paramTypePart,
    getParamCoder,
};
