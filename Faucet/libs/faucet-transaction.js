const CryptoJS = require('crypto-js');
const EC = require('elliptic').ec;
const secp256k1 = new EC('secp256k1');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

const FAUCET_PRIVATE_KEY = "8a24633643c2eb59f11a4bbbb814fa60542e92317f439cbccd3f823978e73d8a";

function signData(data, privKey) {
    let keyPair = secp256k1.keyFromPrivate(privKey);
    let signature = keyPair.sign(data);

    return [signature.r.toString(16, 64), signature.s.toString(16, 64)];
}

function random(low, high) {
    var num = Math.random() * (high - low) + low;
    return Math.round(num);
}

function derivePubKeyFromPrivate(privateKey) {
    let keyPair = secp256k1.keyFromPrivate(privateKey);
    let pubKey = keyPair.getPublic();

    let pubKey_x = pubKey.getX().toString(16, 64);
    let pubKey_y = pubKey.getY().toString(16, 64);
    
    return pubKey_x + parseInt(pubKey_y[63], 16) % 2;
}

function deriveAddressFromPrivate(privateKey) {
    let publicKey = derivePubKeyFromPrivate(privateKey);

    return CryptoJS.RIPEMD160(publicKey).toString();
}

class FaucetTransaction {
    constructor(to) {
        this.from = deriveAddressFromPrivate(FAUCET_PRIVATE_KEY);                   
        this.to = to;                       
        this.value = random(500000, 1000000);                 
        this.fee = 10;                     
        this.dateCreated = new Date().toISOString();    
        this.data = "Faucet Transfer of " + (this.value/1000000) + " to address " + to;                   
        this.senderPubKey = derivePubKeyFromPrivate(FAUCET_PRIVATE_KEY);   
    }

    calculateTransactionHash() {
        let transactionDataJSON = JSON.stringify(this);
        this.transactionHash = CryptoJS.SHA256(transactionDataJSON).toString();
    }

    sign() {
        this.senderSignature = signData(this.transactionHash, FAUCET_PRIVATE_KEY);
    }

    getTransactionJSON() {
        var txn = {
            from: this.from,
            to: this.to,
            value: this.value,
            fee: this.fee,
            dateCreated: this.dateCreated,
            data : this.data,
            senderPubKey: this.senderPubKey,
            senderSignature : this.senderSignature
        }

        return JSON.stringify(txn);
    }

    getTxnValue() {
        return this.value/1000000;
    }

    send(nodeUrl, callback) {
        var endpoint = nodeUrl +  "/transaction/send/";
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function () {
            if (xmlHttp.readyState == 4) {
                if(xmlHttp.status == 201) {
                    callback({'status' : 1, 'msg' : JSON.parse(xmlHttp.responseText)});
                } else {
                    callback({'status' : 0, 'msg' : JSON.parse(xmlHttp.responseText)});
                }
            }
        };
        xmlHttp.open("POST", endpoint, true); // true for asynchronous
        xmlHttp.withCredentials = false;
        xmlHttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xmlHttp.setRequestHeader('Access-Control-Allow-Origin', '*');
        xmlHttp.send(this.getTransactionJSON());
    }
}

module.exports = FaucetTransaction;
