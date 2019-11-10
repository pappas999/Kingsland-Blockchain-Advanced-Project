const ec = elliptic.ec('secp256k1');

const derivationPath = "m/44'/60'/0'/0/";
const N = 16384;
const r = 16;
const p = 1;
const dklen = 64;
const memTotal = N * 4096;

function hexStringToByte(str) {
    if (!str) {
      return new Uint8Array();
    }
    
    var a = [];
    for (var i = 0, len = str.length; i < len; i+=2) {
      a.push(parseInt(str.substr(i,2),16));
    }
    
    return new Uint8Array(a);
}

function byteToHexString(byteArray) {
    return Array.prototype.map.call(byteArray, function(byte) {
        return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('');
}

// only allow ascii string
function stringToByte(str) {
    var a = [];
    for (var i = 0, strLen = str.length; i < strLen; i++) {
      a.push(str.charCodeAt(i));
    }
    return new Uint8Array(a);
}


function kdf(password, salt, _N, _r, _p, _dklen) {
    var key;

    scrypt_module_factory(function (scrypt) {
        key = scrypt.crypto_scrypt(
            password, 
            salt,
            _N, 
            _r, 
            _p, 
            _dklen
        );
    }, {
        requested_total_memory: memTotal
    });

    return key;
}


function derivePubKeyFromPrivate(privateKey) {
    let keyPair = ec.keyFromPrivate(privateKey);
    let pubKey = keyPair.getPublic();

    let pubKey_x = pubKey.getX().toString(16, 64);
    let pubKey_y = pubKey.getY().toString(16, 64);
    
    return pubKey_x + parseInt(pubKey_y[63], 16) % 2;
}

function signData(data, privKey) {

    let keyPair = ec.keyFromPrivate(privKey);
    let signature = keyPair.sign(data);

    return [signature.r.toString(16, 64), signature.s.toString(16, 64)];
}

class Wallet {
    constructor(privateKey) {
        this.privateKey = privateKey;
        this.publicKey = derivePubKeyFromPrivate(privateKey);
        this.address = CryptoJS.RIPEMD160(this.publicKey).toString();
        this.mnemonic = "";
    }

    encrypt(password, progressCallback) {
        try {
            if (progressCallback) {
                progressCallback(0);
            }
            var kdf_salt = secureRandom.randomUint8Array(16);
            var key = kdf(password, kdf_salt, N, r, p, dklen);
            var aes_key = key.slice(0, 32);
            var hmac_key = CryptoJS.enc.Hex.parse(byteToHexString(key.slice(32, 64)));
            var iv = secureRandom.randomUint8Array(16);
            var aesCbc = new aesjs.ModeOfOperation.cbc(aes_key, iv);
            var msg = {
                "privKey": byteToHexString(this.privateKey),
                "mnemonic": this.mnemonic
            };
            var msgbytes = aesjs.utils.utf8.toBytes(JSON.stringify(msg));
            var encryptedBytes = aesCbc.encrypt(aesjs.padding.pkcs7.pad(msgbytes));
            var encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes);
            var hmac = CryptoJS.HmacSHA256(password, hmac_key).toString();
            var json_data = {
                'aes': encryptedHex,
                'iv': byteToHexString(iv),
                'mac': hmac,
                'scrypt': {
                    "dklen": dklen,
                    "salt": byteToHexString(kdf_salt),
                    "N": N,
                    "r": r,
                    "p": p
                }
            };
            if (progressCallback) {
                progressCallback(1);
            }
            return Promise.resolve(JSON.stringify(json_data));
        }
        catch (error) {
            return Promise.reject(error);
        }
    }

    getBalance(nodeHost, callback) {
        var endpoint = nodeHost + "/address/" + this.address + "/balance/";
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function () {
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
                callback(JSON.parse(xmlHttp.responseText));
        };
        xmlHttp.open("GET", endpoint, true); // true for asynchronous 
        xmlHttp.send(null);
    }

    sign(transaction) {
        let txnHash = CryptoJS.SHA256(JSON.stringify(transaction)).toString();
        let signature = signData(txnHash, this.privateKey);

        transaction['transactionDataHash'] = txnHash;
        transaction['senderSignature'] = signature;

        return JSON.stringify(transaction);

    }

    static createRandom(password) {
        var entropy = secureRandom.randomUint8Array(16);
        var mnemonic = bip39.entropyToMnemonic(entropy);
        return this.fromMnemonic(mnemonic, password);
    }

    static fromMnemonic(mnemonic, password) {
        if (!bip39.validateMnemonic(mnemonic) || !password) {
            return new Object();
        }
        let seed = bip39.mnemonicToSeedSync(mnemonic, password);
        let master = bip32.fromSeed(seed);
        let wallet = new Wallet(master.privateKey);
        wallet.mnemonic = mnemonic;
        return wallet;
    }

    static decryptFromJSON(json, password, progressCallback) {
        try {
            if (progressCallback) {
                progressCallback(0);
            }
            var data = JSON.parse(json);
            var _N = data['scrypt']['N'];
            var _r = data['scrypt']['r'];
            var _p = data['scrypt']['p'];
            var kdf_salt = hexStringToByte(data['scrypt']['salt']);
            var _dklen = data['scrypt']['dklen'];
            var ciphertext = data['aes'];
            var iv = hexStringToByte(data['iv']);
            var hmac = data['mac'];
            var key = kdf(password, kdf_salt, _N, _r, _p, _dklen);
            var aes_key = key.slice(0, 32);
            var hmac_key = CryptoJS.enc.Hex.parse(byteToHexString(key.slice(32, 64)));
            var hmac_verify = CryptoJS.HmacSHA256(password, hmac_key).toString();
            if (hmac !== hmac_verify) {
                throw "Password is incorrect!";
            }
            var encryptedBytes = aesjs.utils.hex.toBytes(ciphertext);
            var aesCbc = new aesjs.ModeOfOperation.cbc(aes_key, iv);
            var decryptedBytes = aesjs.padding.pkcs7.strip(aesCbc.decrypt(encryptedBytes));
            var decryptedText = aesjs.utils.utf8.fromBytes(decryptedBytes);
            var msg = JSON.parse(decryptedText);
            let wallet = new Wallet(hexStringToByte(msg.privKey));
            wallet.mnemonic = msg.mnemonic;
            if (progressCallback) {
                progressCallback(1);
            }
            return Promise.resolve(wallet);
        }
        catch (error) {
            if (progressCallback) {
                progressCallback(1);
            }
            return Promise.reject(error);
        }
    }
}
