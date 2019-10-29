/*
    main.js
*/

let bip39 = require("bip39");
let HDKey = require("hdkey");
let scrypt = require("scrypt-js");
let elliptic = require('elliptic');
let ec = new elliptic.ec('secp256k1');



let derivationPath = "m/44'/60'/0'/0/";

// Scrypt KDF parameters
const N = 16384;
const r = 16;
const p = 1;
const dklen = 64;


class Wallet {

}


function encryptWalletAndSaveJSON(password, root) {

}


function decryptWallet(password) {

}




function derivePubKeyFromPrivate(privateKey) {

    let keyPair = ec.keyFromPrivate(privateKey);
    // let privKey = keyPair.getPrivate("hex");
    let pubKey = keyPair.getPublic();

    // console.log(`Private key: ${privKey}`);
    // console.log("Public key :", pubKey.encode("hex").substr(2));

    let pubKey_x = pubKey.getX().toString(16, 64);
    let pubKey_y = pubKey.getY().toString(16, 64);
    
    // Generate the compressed public key
    pubKey_compressed = pubKey_x + parseInt(pubKey_y[63], 16) % 2;
    // console.log("Compressed Public key (65 hex digits):\t\t", pubKey_compressed);

    return pubKey_compressed;

}



function createNewWallet(password) {
    let mnemonic = bip39.generateMnemonic();
    let seed = bip39.mnemonicToSeedSync(mnemonic).toString('hex');
    let master = HDKey.fromMasterSeed(seed);

    console.log(master);


}


function restoreWallet(mnemonic) {
    
}

createNewWallet("Hello");
