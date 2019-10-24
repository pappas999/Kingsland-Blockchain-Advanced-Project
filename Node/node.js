var CryptoJS = require("crypto-js");

class Block {
    constructor(index, transactions, difficulty, prevBlockHash, minedBy, blockDataHash, nonce, dateCreated, blockHash) {
        this.index = index;
		this.transactions = transactions;
		this.difficulty = difficulty;
        this.prevBlockHash = prevBlockHash.toString();
        this.minedBy = minedBy;
        this.blockDataHash = blockDataHash;
        this.nonce = nonce;
        this.dateCreated = dateCreated;
        this.blockHash = createBlockHash();
    }
	
	function createBlockHash() {
		return SHA256(this.index + this.transactions + this.difficulty + this.prevBlockHash + this.minedBy).toString();
	}
}

class Blockchain {
	
}

class Transaction {
	
}

class GenesisBlock {
	
}

class Node {
	
}

class MiningJob {
	
}





