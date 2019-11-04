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
    
    return hexStringToByte(pubKey_x + parseInt(pubKey_y[63], 16) % 2);
}


function Wallet(privateKey, provider) {
    this.privateKey = privateKey;
    this.provider = provider;
    this.publicKey = null;
    this.address = "";
    this.mnemonic = "";

    if(privateKey) {
        this.privateKey = privateKey;
        this.publicKey = derivePubKeyFromPrivate(privateKey);
        this.address = CryptoJS.RIPEMD160(this.publicKey).toString();
    }

    if(provider) {
        this.provider = getProvider(provider);
    } else {
        this.provider = getDefaultProvider();
    }

    function getProvider(provider) {

        return new Object();
    }

    function getDefaultProvider() {

        return new Object();
    }
}


Wallet.createRandom = function() {
    var entropy = secureRandom.randomUint8Array(16);
    var mnemonic = bip39.entropyToMnemonic(entropy);

    return Wallet.fromMnemonic(mnemonic);
}

Wallet.fromMnemonic = function(mnemonic) {
    let path  = "m/44'/60'/0'/0/0";
    if (!bip39.validateMnemonic(mnemonic)) {
        return new Object();
    }

    let seed = bip39.mnemonicToSeedSync(mnemonic).toString('hex');
    let master = hdkey.fromMasterSeed(seed);
    let addrNode = master.derive(path);

    wallet = new Wallet(addrNode._privateKey);
    wallet.mnemonic = mnemonic;

    return wallet;
}


Wallet.decryptFromJSON = function(password, json) {
    try {
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
        var hmac_key =  CryptoJS.enc.Hex.parse(byteToHexString(key.slice(32, 64)));

        hmac_verify = CryptoJS.HmacSHA256(password, hmac_key).toString();

        if(hmac !== hmac_verify) {
            throw "Password is incorrect!"
        }

        var encryptedBytes = aesjs.utils.hex.toBytes(ciphertext);
        var aesCbc = new aesjs.ModeOfOperation.cbc(aes_key, iv);
        var decryptedBytes = aesCbc.decrypt(encryptedBytes);

        return Promise.resolve(new Wallet(decryptedBytes));

    } catch(error) {
        Promise.reject(error);
    }
}


Wallet.prototype.encrypt = function(password, progressCallback) {

    try {

        if (progressCallback) {
            progressCallback(0);
        }

        var kdf_salt = secureRandom.randomUint8Array(16);

        var key = kdf(password, kdf_salt, N, r, p, dklen);

        var aes_key = key.slice(0, 32);
        var hmac_key =  CryptoJS.enc.Hex.parse(byteToHexString(key.slice(32, 64)));
        var iv = secureRandom.randomUint8Array(16);

        var aesCbc = new aesjs.ModeOfOperation.cbc(aes_key, iv);
        var encryptedBytes = aesCbc.encrypt(this.privateKey);
        
        var encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes);

        var hmac = CryptoJS.HmacSHA256(password, hmac_key).toString();

        var json_data = {
            'aes' : encryptedHex,
            'iv' : byteToHexString(iv),
            'mac' : hmac,
            'scrypt' : {
                "dklen": dklen,
                "salt": byteToHexString(kdf_salt),
                "N": N,
                "r": r,
                "p": p
            }
        }

        if (progressCallback) {
            progressCallback(1);
        }

        return Promise.resolve(JSON.stringify(json_data));

    } catch (error) {
        return Promise.reject(error);
    }
}