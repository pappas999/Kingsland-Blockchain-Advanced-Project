function Wallet(privateKey, provider) {
    this.privateKey = privateKey;
    this.publicKey = this.derivePubKeyFromPrivate(privateKey);
    this.address = this.deriveAddressFromPublic(this.publicKey);
    this.provider = provider;
    this.mnemonic = "";

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
}


Wallet.prototype = {
    constructor : Wallet,
    createRandomWallet : function() {

    },
    restoreWallet : function(password, mnemonic) {

    },

    encryptWallet : function(password) {

    },

    decryptWallet : function(json, password) {

    },

    getBalance : function() {

    },

    signTxn : function(txn) {

    },

    sendSignedTxn : function(signedTxn) {

    }
}