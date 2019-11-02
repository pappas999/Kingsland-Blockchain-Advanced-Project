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


function kdf(password, salt) {
    var key;

    scrypt_module_factory(function (scrypt) {
        key = scrypt.crypto_scrypt(
            password, 
            salt,
            N, 
            r, 
            p, 
            dklen
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
    let keyPair = ec.genKeyPair();

    let privKey = keyPair.getPrivate('hex');
    privKey_b = hexStringToByte(privKey);
    var wallet  = new Wallet(privKey_b);
    wallet.mnemonic = bip39.entropyToMnemonic(privKey);

    return wallet;
}

Wallet.fromMnemonic = function(mnemonic) {
    let path  = "m/44'/60'/0'/0/0";
    if (!bip39.validateMnemonic(mnemonic)) {
        return new Object();
    }

    let seed = bip39.mnemonicToSeedSync(mnemonic).toString('hex');
    let master = hdkey.fromMasterSeed(seed);
    let addrNode = master.derive(path);

    return new Wallet(addrNode._privateKey);
}


Wallet.decryptFromJSON = function(password, json, callback) {

}


Wallet.prototype.encrypt = function(password, callback) {

    var kdf_salt = secureRandom.randomUint8Array(16);

    var key = kdf(password, kdf_salt);

    var aes_key = key.slice(0, 32);
    var hmac_key =  CryptoJS.enc.Hex.parse(byteToHexString(key.slice(32, 64)));
    var iv = secureRandom.randomUint8Array(16);

    var aesCbc = new aesjs.ModeOfOperation.cbc(aes_key, iv);
    var encryptedBytes = aesCbc.encrypt(wallet.privateKey);
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

    return JSON.stringify(json_data);
}