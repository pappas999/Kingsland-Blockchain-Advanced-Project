const CrytoJS = require('crypto-js');
const EC = require('elliptic').ec;
const secp256k1 = new EC('secp256k1');

const FAUCET_PRIVATE_KEY = "7e4670ae70c98d24f3662c172dc510a085578b9ccc717e6c2f4e547edd960a34";

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
    let keyPair = ec.keyFromPrivate(privateKey);
    let pubKey = keyPair.getPublic();

    let pubKey_x = pubKey.getX().toString(16, 64);
    let pubKey_y = pubKey.getY().toString(16, 64);
    
    return pubKey_x + parseInt(pubKey_y[63], 16) % 2;
}

function deriveAddressFromPublic(publicKey) {
    return CryptoJS.RIPEMD160(publicKey).toString();
}

class FaucetTransaction {

    constructor(to) {
        this.from = FAUCET_ADDRESS;                   
        this.to = to;                       
        this.value = random(500000, 1000000);                 
        this.fee = 10;                     
        this.dateCreated = new Date().toISOString();    
        this.data = "Faucet Transfer of " + value + " to address " + to;                   
        this.senderPubKey = FAUCET_PUBKEY;   
    }

    calculateTransactionHash() {
        let transactionDataJSON = JSON.stringify(this);
        this.transactionHash = CrytoJS.SHA256(transactionDataJSON).toString();
    }

    sign(privateKey) {
        this.senderSignature = signData(this.transactionHash, privateKey);
    }

    send() {
        
    }
}


