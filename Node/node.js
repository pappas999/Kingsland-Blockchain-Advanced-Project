var cryptoJS = require("crypto-js");
var express = require("express");
var bodyParser = require('body-parser');
var WebSocket = require("ws");
const EC = require('elliptic').ec;
const secp256k1 = new EC('secp256k1');
const cors = require('cors');
const utils = require('./utils');
const got = require('got');

const DEFAULT_PORT = 5555;
const DEFAULT_HOST = 'localhost';
const DEFAULT_MINING_DIFFICULTY = 2;



class Block {
    constructor(index, transactions, difficulty, prevBlockHash, minedBy, blockDataHash, nonce, dateCreated, blockHash) {
        this.index = index;
		this.transactions = transactions;
		this.difficulty = difficulty;
        this.prevBlockHash = prevBlockHash;
        this.minedBy = minedBy;
        this.blockDataHash = blockDataHash || this.createBlockDataHash();
        this.nonce = nonce;
        this.dateCreated = dateCreated;
        this.blockHash = blockHash || this.createBlockHash();
    }

	createBlockDataHash() {
		/*used for debug
		  console.log('hashing: ' + JSON.stringify({index: this.index,
											   transactions: this.transactions,
											   difficulty: this.difficulty,
											   prevBlockHash: this.prevBlockHash,
											   minedBy: this.minedBy}));*/

		return cryptoJS.SHA256(JSON.stringify({index: this.index,
											   transactions: this.transactions,
											   difficulty: this.difficulty,
											   prevBlockHash: this.prevBlockHash,
											   minedBy: this.minedBy})).toString();



	}

	createBlockHash() {
        return cryptoJS.SHA256(this.blockDataHash + "|" + this.dateCreated + "|" + this.nonce).toString();
    }
}

class Blockchain {
	constructor(difficulty) {
        this.blocks = [this.generateGenesisBlock()];
        this.pendingTransactions = [];
        this.currentDifficulty = DEFAULT_MINING_DIFFICULTY;
        this.miningJobs = new Map();
    }

	//Cumulative difficulty is defined as the sum of 16 X the power of the difficulty in each block
	//== 16 ^ block0+ 16 ^ block1 + … 16 ^ blockn
	getCumulativeDifficulty() {
		var cumulativeDifficulty = 0;
		for (var i = 0; i < this.blocks.length; i++) {
			cumulativeDifficulty += 16 ** this.blocks[i].difficulty;
		}
		return cumulativeDifficulty;
	}

	//Number of confirmed transactions is defined as the sum of all transactions in all blocks
	getConfirmedTransactionCount() {
		var confirmedTransactions = 0;
		for (var i = 0; i < this.blocks.length; i++) {
			confirmedTransactions += this.blocks[i].transactions.length;
		}
		return confirmedTransactions;
	}

	getConfirmedTransactions() {
		var confirmedTransactions = [];
		for (var b = 0; b < this.blocks.length; b++) {
			for (var t = 0; t < this.blocks[b].transactions.length; t++) {
				confirmedTransactions.push(this.blocks[b].transactions[t]);
			}
		}
		return confirmedTransactions;
	}

	
	//All transactions are defined as both pending and confirmed transactions
	getAllTransactions() {
		var confirmedTransactions = this.getConfirmedTransactions();
		var allTransactions = confirmedTransactions.concat(this.pendingTransactions);

		return allTransactions;
	}

	getConfirmedBalances() {
		var confirmedBalances = {};
		var confirmedTransactions = this.getConfirmedTransactions();

		for(var i = 0; i < confirmedTransactions.length; i++) {
			var fromAddr = confirmedTransactions[i].from;
			var toAddr = confirmedTransactions[i].to;
			var value = confirmedTransactions[i].value;
			var fee = confirmedTransactions[i].fee;

			// subtract value from fromAddr
			if(confirmedBalances.hasOwnProperty(fromAddr)) {
				confirmedBalances[fromAddr] -= value - fee;
			} else {
				confirmedBalances[fromAddr] = -value - fee;
			}

			// add value to toaddr
			if(confirmedBalances.hasOwnProperty(toAddr)) {
				confirmedBalances[toAddr] += value;
			} else {
				confirmedBalances[toAddr] = value;
			}

			// we need to remove addr if its value now is zero
			if(confirmedBalances[fromAddr] === 0)
				delete confirmedBalances[fromAddr];

			if(confirmedBalances[toAddr] === 0)
				delete confirmedBalances[toAddr];
		}

		return confirmedBalances;
	}


	getAddressBalance(address) {
		var balance = {  // this is where we store our balances for an address/account
			"safeBalance" : 0,
			"confirmedBalance" : 0,
			"pendingBalance" : 0
		};

		var blockCount = this.blocks.length; // current block count for confirmation computation
		var confirmedTransactions = this.getConfirmedTransactions();  // this is where we get the safe and confirmed balance
		var pendingTransactions = this.pendingTransactions;			// this is where we get the pending balance

		// let's get the safe and confirmed balances first
		for(var i = 0; i < confirmedTransactions.length; i++) {
			var fromAddr = confirmedTransactions[i].from;
			var toAddr = confirmedTransactions[i].to;
			var value = confirmedTransactions[i].value;
			var fee = confirmedTransactions[i].fee;
			var blockNumber = confirmedTransactions[i].minedInBlockIndex;
			var confirmation = blockCount - blockNumber;

			if (fromAddr === address) {
				if(confirmation >= 1)
					balance['confirmedBalance'] -= (value + fee);

				if(confirmation >= 6)
					balance['safeBalance'] -= (value + fee);
			}

			if (toAddr === address) {
				if(confirmation >= 1)
					balance['confirmedBalance'] += value;

				if(confirmation >= 6)
					balance['safeBalance'] += value;
			}
		}

		// now we get the pending balance
		for(var i = 0; i < pendingTransactions.length; i++) {
			var pfromAddr = pendingTransactions[i].from;
			var ptoAddr = pendingTransactions[i].to;
			var pvalue = pendingTransactions[i].value;
			var pfee = pendingTransactions[i].fee;

			if (pfromAddr === address)
				balance['pendingBalance'] -= (pvalue + pfee);

			if (ptoAddr === address)
				balance['pendingBalance'] += pvalue;
		}

		return balance;
	}

	getAddressConfirmedBalance(address) {
		var balance = 0;

		var blockCount = this.blocks.length; // current block count for confirmation computation
		var confirmedTransactions = this.getConfirmedTransactions();  // this is where we get the safe and confirmed balance

		// let's get the safe and confirmed balances first
		for(var i = 0; i < confirmedTransactions.length; i++) {
			var fromAddr = confirmedTransactions[i].from;
			var toAddr = confirmedTransactions[i].to;
			var value = confirmedTransactions[i].value;
			var fee = confirmedTransactions[i].fee;
			var blockNumber = confirmedTransactions[i].minedInBlockIndex;
			var confirmation = blockCount - blockNumber;

			if (fromAddr === address) {
				if(confirmation >= 1)
					balance -= value - fee;
			}

			if (toAddr === address) {
				if(confirmation >= 1)
					balance += value;
			}
		}

		return balance;
	}

	
	generateGenesisBlock() {
		let txn = new Transaction('0000000000000000000000000000000000000000',              //from
		                           '8e2dab77e92b10b155ba8682146561ff45593467',               //to
					   	   		   1000000000000,                                            //value
								   0,														//fee
								   '2018-01-01T00:00:00.000Z',								//date created
							       'Faucet funding',	//data
							  	   '00000000000000000000000000000000000000000000000000000000000000000',	//senderPubKey
								    undefined,                                                //transactionDataHash
										  ["0000000000000000000000000000000000000000000000000000000000000000", "0000000000000000000000000000000000000000000000000000000000000000"],	//senderSig
										  );
									txn.confirmTransaction(0);
									let transaction = [txn];

									let block = new Block (0,          						//index                                              
									transaction,															//transactions
									0,																	//difficulty
									undefined,															//prevBlockHash
									'0000000000000000000000000000000000000000',							//minedBy
									undefined,															//blockDataHash
									0,																	//nonce
									'2018-01-01T00:00:00.000Z',											//dateCreated
									undefined);															//blockHash
		return block;
	}

	
}


class Transaction {
	constructor(from, to, value, fee, dateCreated, data, senderPubKey, transactionDataHash, senderSignature) {
        this.from = from;
        this.to = to;
        this.value = value;
        this.fee = fee;
        this.dateCreated = dateCreated;
		this.data = data;
		this.senderPubKey = senderPubKey;
		this.transactionDataHash = transactionDataHash || this.generateTransactionHash();
		this.senderSignature = senderSignature;
		this.minedInBlockIndex = -1; // not confirmed yet
		this.transactionSuccessful = 'false'; // not confirmed yet
    }

	generateTransactionHash() {
		if(this.data) {
			//console.log('generating hash of this with data: ' + this.from + ',' + this.to + ',' + this.value + ',' + this.fee + ',' + this.dateCreated + ',' + this.data + ',' + this.senderPubKey);
        	return cryptoJS.SHA256(JSON.stringify({from: this.from,
											     to: this.to,
											  value: this.value,
											    fee: this.fee,
									    dateCreated: this.dateCreated,
										   	   data: this.data,
									   senderPubKey: this.senderPubKey})).toString();
		} else {
			//console.log('generating hash of this without data: ' + this.from + ',' + this.to + ',' + this.value + ',' + this.fee + ',' + this.dateCreated + ',' +  this.senderPubKey);
			return cryptoJS.SHA256(JSON.stringify({from: this.from,
												to: this.to,
											 value: this.value,
											   fee: this.fee,
									 dateCreated: this.dateCreated,
									senderPubKey: this.senderPubKey})).toString();
		}
	}

	verifyTransaction() {
        return utils.verifySignature(this.transactionDataHash, this.senderPubKey, this.senderSignature);
	}

	confirmTransaction(minedInBlockIndex) {
		this.minedInBlockIndex = minedInBlockIndex;
		this.transactionSuccessful = "true";
	}

	generateAsPendingTransaction() {
		if (this.data == undefined) {
			var txn = {
				from: this.from,
				to: this.to,
				value: this.value,
				fee: this.fee,
				dateCreated: this.dateCreated,
				senderPubKey: this.senderPubKey,
				transactionDataHash : this.transactionDataHash,
				senderSignature : this.senderSignature,
				transactionSuccessful: 'false'
				}
		} else {
			var txn = {
				from: this.from,
				to: this.to,
				value: this.value,
				fee: this.fee,
				dateCreated: this.dateCreated,
				data : this.data,
				senderPubKey: this.senderPubKey,
				transactionDataHash : this.transactionDataHash,
				senderSignature : this.senderSignature,
				transactionSuccessful: 'false'
			}
		}

		return txn;
	}
}




class Node {
	constructor(host, port) {
		this.host = host || DEFAULT_HOST;  //use default host if not populated
		this.port = port || DEFAULT_PORT;  //use default port if not populated
		this.selfUrl = 'http://' + this.host + ':' + this.port;
        this.nodeId = this.generateNodeId();

		console.log('Generated node id: ' + this.nodeId);
		console.log('Node selfUrl: ' + this.selfUrl);
		
		//initialise the peers and the blockchain, both will initially be empty
		this.peers = new Map();
		this.blockchain = new Blockchain();
    }

	generateNodeId() {
		//Node Id defined as dateTime+random, looks to be a hash based on the slides so will get current DateTime + random number then do a SHA256 on it
		let timestamp =  new Date().toISOString();
		let randomNo = Math.random().toString();
		return cryptoJS.SHA256(timestamp + randomNo).toString();
	}
	
	//end point: /info                 
	getInfo() {
		let obj = {
			"about" : "Kingsland Asia MI4: " + this.nodeId,
			"nodeId" : this.nodeId,
			"chainId" : this.blockchain.blocks[0].blockHash, //hash of the genesis block
			"nodeUrl" : this.nodeUrl,
			"peers" : this.peers.size,                      //number of peers
			"currentDifficulty" : this.blockchain.currentDifficulty,
			"blocksCount" : this.blockchain.blocks.length,  //number of blocks
			"cumulativeDifficulty" : this.blockchain.getCumulativeDifficulty(),      //calculated cumulative difficulty
			"confirmedTransactions" : this.blockchain.getConfirmedTransactionCount(), //number of confirmed transactions
			"pendingTransactions" : this.blockchain.pendingTransactions.length   //number of pending transactions
		}
		return JSON.stringify(obj,null,4);
		return obj;

	}

	
	//end point: /debug   
	getDebug() {
		let obj = {
			"selfUrl" : this.selfUrl,
			"peers" : this.peers,
			"chain" : this.blockchain,
			"confirmedBalances" : this.blockchain.getConfirmedBalances()
		}
		return JSON.stringify(obj,null,4);

	}
	
	//end point: /debug/reset-chain           
	resetChain() {
		this.blockchain = new Blockchain();
		const obj = {message: 'The chain was reset to its genesis block'};
		return JSON.stringify(obj,null,4);

	}
	
	//end point: /blocks                     
	getBlocks() {
		return JSON.stringify(this.blockchain.blocks, null, 4);
	}
	
	//end point: /blocks/:index              
	getBlock(index) {
		//console.log('index: ' + index);
		if (parseInt(index) >= 0) {
			if (this.blockchain.blocks[index] == undefined) {
				const obj = {message: 'Block number: ' + index + ' does not exist'};
				return JSON.stringify(obj,null,4);
			} else {
				return JSON.stringify(this.blockchain.blocks[index], null, 4);
			}
		} else {
			const obj = {message: 'Index needs to be a positive number'};
			return JSON.stringify(obj,null,4);
		}
	}

	//end point: /transactions/pending                 
	getPendingTransactions() {
		return JSON.stringify(this.blockchain.pendingTransactions, null, 4);
	}
	
	//end point: /trasnactions/confirmed            
	getConfirmedTransactions() {
		return JSON.stringify(this.blockchain.getConfirmedTransactions(), null, 4);
	}
	
	
	//end point: /balances                       
	getBalances() {
		return JSON.stringify(this.blockchain.getConfirmedBalances(), null, 4);
	}
	
	

	//end point: /transactions/:tranHash                 
	getTransaction(tranHash) {
		//use confirmed transactions as a basis for search
		var transactions = this.blockchain.getConfirmedTransactions();

		//loop through transactions and find hash
		for (var i = 0; i < transactions.length; i++) {
			if (transactions[i].transactionDataHash === tranHash) {
				return JSON.stringify(transactions[i],null,4);
			}
		}
		
		//if got to this point, it means transaction wasn't found, so return error
		return JSON.stringify({Message: 'Transaction ' +  tranHash + ' not found'}, null, 4);
	}

	//helper function used when processing a new pending transaction, to check if we already have it
	getPendingTransaction(tranHash) {
		//use pending transactions as a basis for search
		var transactions = this.blockchain.pendingTransactions;

		//loop through transactions and find hash
		for (var i = 0; i < transactions.length; i++) {
			if (transactions[i].transactionDataHash === tranHash) {
				return transactions[i];
			}
		}
	}

	
	//end point: /address/:address/transactions               
	getAddressTransactions(address) {
		var addrTransactions = [];
		//use ALL transactions as a basis for search
		var transactions = this.blockchain.getAllTransactions();

		//loop through transactions, if involves given address then add to transactions array
		for (var i = 0; i < transactions.length; i++) {
			if (transactions[i].from == address || transactions[i].to == address ) {
				addrTransactions.push(transactions[i]);
			}
		}

		//sort results in order of date/time ascending then return
		//dateCreated is field to sort by, ascending
		return JSON.stringify(addrTransactions.sort((a, b) => b.dateCreated - a.dateCreated),null,4);
	}

	
	//end point: /address/:address/balance            
	getAddressBalance(address) {
		//check if valid address, if so return json, otherwise return error
		if (utils.validateAddress(address) > 0) {
			return JSON.stringify(this.blockchain.getAddressBalance(address),null,4);
		} else {
			return {errorMsg:  "Invalid address"}
		}
	}


	//end point: /transactions/send
	sendTransaction(txnData) {
		var response = {}

		// first we make sure our data is complete
		if (!txnData.hasOwnProperty('from')) {
			response['errorMsg'] = "Field 'from' is missing";
			return response;
		}

		if (!txnData.hasOwnProperty('to')) {
			response['errorMsg'] = "Field 'to' is missing";
			return response;
		}

		if (!txnData.hasOwnProperty('value')) {
			response['errorMsg'] = "Field 'value' is missing";
			return response;
		}

		if (!txnData.hasOwnProperty('fee')) {
			response['errorMsg'] = "Field 'fee' is missing";
			return response;
		}

		if (!txnData.hasOwnProperty('dateCreated')) {
			response['errorMsg'] = "Field 'dateCreated' is missing";
			return response;
		}

		if (!txnData.hasOwnProperty('senderPubKey')) {
			response['errorMsg'] = "Field 'senderPubKey' is missing";
			return response;
		}

		if (!txnData.hasOwnProperty('senderSignature')) {
			response['errorMsg'] = "Field 'senderSignature' is missing";
			return response;
		}

		var txn = new Transaction(txnData.from, txnData.to, txnData.value, txnData.fee, txnData.dateCreated, txnData.data, txnData.senderPubKey, undefined, txnData.senderSignature);


		// check for transactions
		var txns = this.blockchain.getAllTransactions();
		for(var i = 0; i < txns.length; i++) {
			if (txn.transactionDataHash === txns[i].transactionDataHash) {
				response['errorMsg'] = "Duplicate transaction! Skipping!"
				return response;
			}
		}

		// verify sender publicKey and address if address = hashOf(pubkey)
		if(txn.from !== cryptoJS.RIPEMD160(txn.senderPubKey).toString()) {
			response['errorMsg'] = "Invalid sender public key or blockchain address!";
			return response;
		}

		// validate value
		if(txn.value < 0) {
			response['errorMsg'] = "value field must be greater than zero";
			return response;
		}

		// validate fee
		if(txn.fee < 10) {
			response['errorMsg'] = "Minimum fee is 10";
			return response;
		}

		// validate sender balance
		var confirmedBalance = this.blockchain.getAddressConfirmedBalance(txn.from);
		if(confirmedBalance < txn.value + txn.fee) {
			response["errorMsg"] = "Sender does not have enough balance";
			return response;
		}

		// verify signature
		if(!txn.verifyTransaction()) {
			response['errorMsg'] = "Vefication failed. Skipping!";
			return response;
		}

		// transaction is valid! Can now be added to pending txns
		this.blockchain.pendingTransactions.push(txn.generateAsPendingTransaction());

		response["transactionDataHash"] = txn.transactionDataHash;

		return response;

	}

	
	//end point: /peers       
	getPeers() {
		return JSON.stringify(this.peers, null, 4);
	}

	//end point: /peers/connect
	async connectToPeer(peerUrl) {
		var response;
		var peerFound = false;

        var peerInfo = await got(peerUrl + '/info');
		console.log ('peer info:' + peerInfo.body);

		var obj = JSON.parse(peerInfo.body);

        //Make sure chain ID matches
        if(obj.chainId !== this.blockchain.blocks[0].blockHash) {
			throw new Error('Chain ID does not match');
		}

        if(obj.nodeId === this.nodeId) {
			throw new Error('Cannot connect to yourself');
		}

        if(this.peers[obj.nodeId]) {
			throw new Error('Already connected to peer: ' + peerUrl);
		}

        //Add peer to liste of peers
        this.peers[obj.nodeId] = peerUrl;
        console.log('Connected to new peer: ' + peerUrl);

        //Connect back to the peer if not already connected
		//to check for existing connection, check their /peers endpoint to see if our URL In there
        try {		
			var peerPeers = await got(peerUrl + '/peers');
			console.log ('peer peer list:' + peerPeers.body);

			obj = JSON.parse(peerPeers.body);


			if (!(Object.keys(obj).length === 0)) {       //if they have some peers, need to check if we are already in their list
			    console.log('they have some peers');

				for (var key in obj) {
					if (!(obj[this.nodeId])) {
						console.log('our peer not found in theirs, will connect');
						const response = await got.post(peerUrl + '/peers/connect', {
							json: true,
							body: {
								peerUrl: this.selfUrl
							}
						});
					} else {
						console.log(this.selfUrl + ' already exists in ' + obj.nodeIs + ' list of peers');
					}
				}

			} else {   //no peers on their peers list, so can connect
			     console.log('connecting host has no peers, will connect back with URL: ' + this.selfUrl);

				const response = await got.post(peerUrl + '/peers/connect', {
					json: true,
					body: {
						peerUrl: this.selfUrl
					}
				});
			}
        } catch (error) {
			console.log('Error during peer connect back: ' + error);
		}

        return peerInfo.body;


	}

	async syncChain(peerUrl) {

		try {

			var peerInfo = await got(peerUrl + '/info');	

			console.log ('peer info:' + peerInfo.body);
			var obj = JSON.parse(peerInfo.body);

			//Check to see if other chain has a higher cumulative difficulty, which means we need to verify it and potentially sync to the new chain
			if(obj.cumulativeDifficulty > this.blockchain.getCumulativeDifficulty()) {
				console.log(peerUrl + ' has a higher cumulative difficulty, validating new chain');

				//download chain by calling blocks
				var peerInfo = await got(peerUrl + '/blocks');
				console.log ('peer blocks:' + peerInfo.body);

				var blocks = JSON.parse(peerInfo.body);

				//validate the blocks
				//step 1 - validate genesis block
				if (JSON.stringify(this.blockchain.blocks[0]) !== JSON.stringify(blocks[0])) {
					throw new Error('Chain validation failed, Genesis Block is not the same');
				}

				//step 2 validate each block - check fields
				for(var i = 0; i < blocks.length; i++) {
					var block = blocks[i] = new Block(blocks[i].index,
													  blocks[i].transactions,
													  blocks[i].difficulty,
													  blocks[i].prevBlockHash,
													  blocks[i].minedBy,
													  blocks[i].blockDataHash,
													  blocks[i].nonce,
													  blocks[i].dateCreated,
													  blocks[i].blockHash);


					if (i > 0) {                             //only get previous block if not currently on Genesis Block
						var previousBlock = blocks[i - 1];
					}

					console.log('validating block ' + i);

					//check for missing values
					if (block.index == null)      				throw new Error ('Block ' + i + ' index is missing');
					if (block.difficulty == null) 				throw new Error ('Block ' + i + ' difficulty is missing');
					if (block.nonce == null) 	 				throw new Error ('Block ' + i + ' nonce is missing');
					if (block.transactions == null) 			throw new Error ('Block ' + i + ' transactions are missing');
					if (block.prevBlockHash == null & i > 0) 	throw new Error ('Block ' + i + ' index is missing');  //don't need to validate for genesis block
					if (block.minedBy == null) 					throw new Error ('Block ' + i + ' minedBy is missing');
					if (block.blockDataHash == null) 			throw new Error ('Block ' + i + ' blockDataHash is missing');
					if (block.blockHash == null) 				throw new Error ('Block ' + i + ' blockHash is missing');

					//check types of values
					if (isNaN(block.index))      						 throw new Error('Block ' + i + ' index is not a number');
					if (isNaN(block.difficulty)) 						 throw new Error('Block ' + i + ' difficulty is not a number');
					if (isNaN(block.nonce))      						 throw new Error('Block ' + i + ' nonce is not a number');
					if (!(Array.isArray(block.transactions))) 			 throw new Error('Block ' + i + ' transactions is not an array');
					if (typeof block.prevBlockHash !== 'string' & i > 0) throw new Error('Block ' + i + ' prevBlockHash is not a string');  //don't need to validate for genesis block
					if (typeof block.minedBy !== 'string') 				 throw new Error('Block ' + i + ' minedBy is not a string');
					if (typeof block.blockDataHash !== 'string') 		 throw new Error('Block ' + i + ' blockDataHash is not a string');
					if (typeof block.blockHash !== 'string') 			 throw new Error('Block ' + i + ' blockHash is not a string');
					if (!(/^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(.[0-9]+)?(Z)?$/.test(block.dateCreated))) throw new Error('Block ' + i + ' date is not a valid ISO format');

					//validate transactions in block
					for(let t = 0; t < block.transactions.length; t++) {
						console.log('validating transaction ' + t);
						var transaction = block.transactions[t] = new Transaction (block.transactions[t].from,
																				   block.transactions[t].to,
																				   block.transactions[t].value,
																				   block.transactions[t].fee,
																				   block.transactions[t].dateCreated,
																				   block.transactions[t].data,
																				   block.transactions[t].senderPubKey,
																				   block.transactions[t].transactionDataHash,
																				   block.transactions[t].senderSignature);

						//check for missing values
						if (transaction.from == null)      				throw new Error ('Transaction ' + t + ' in Block ' + i + ' from is missing');
						if (transaction.to == null)      				throw new Error ('Transaction ' + t + ' in Block ' + i + ' to is missing');
						if (transaction.value == null)      			throw new Error ('Transaction ' + t + ' in Block ' + i + ' value is missing');
						if (transaction.fee == null)      				throw new Error ('Transaction ' + t + ' in Block ' + i + ' fee is missing');
						if (transaction.dateCreated == null)      		throw new Error ('Transaction ' + t + ' in Block ' + i + ' dateCreated is missing');
						if (transaction.data == null)      				throw new Error ('Transaction ' + t + ' in Block ' + i + ' data is missing');
						if (transaction.senderPubKey == null)      		throw new Error ('Transaction ' + t + ' in Block ' + i + ' senderPubKey is missing');
						if (transaction.transactionDataHash == null)    throw new Error ('Transaction ' + t + ' in Block ' + i + ' transactionDataHash is missing');
						if (transaction.senderSignature == null)      	throw new Error ('Transaction ' + t + ' in Block ' + i + ' senderSignature is missing');
						if (transaction.minedInBlockIndex == null)      throw new Error ('Transaction ' + t + ' in Block ' + i + ' minedInBlockIndex is missing');
						if (transaction.transactionSuccessful == null)  throw new Error ('Transaction ' + t + ' in Block ' + i + ' transactionSuccessful is missing');


						//check type of values. Note Genesis Block has some exceptions where we dont need to validate
						if (typeof transaction.from !== 'string' & i > 0)   			   throw new Error('Transaction ' + t + ' in Block ' + i + ' from is not a string');
						if (typeof transaction.to !== 'string' & i > 0)     			   throw new Error('Transaction ' + t + ' in Block ' + i + ' to is not a string');
						if (typeof transaction.data !== 'string' & i > 0)   			   throw new Error('Transaction ' + t + ' in Block ' + i + ' data is not a string');
						if (typeof transaction.senderPubKey !== 'string' & i > 0)          throw new Error('Transaction ' + t + ' in Block ' + i + ' senderPubKey is not a string');
						if (typeof transaction.transactionDataHash !== 'string' & i > 0)   throw new Error('Transaction ' + t + ' in Block ' + i + ' transactionDataHash is not a string');
						if (typeof transaction.transactionSuccessful !== 'string' & i > 0) throw new Error('Transaction ' + t + ' in Block ' + i + ' transactionSuccessful is not a string');


						if (isNaN(transaction.value))      		   throw new Error('Transaction ' + t + ' in Block ' + i + ' value is not a number');
						if (isNaN(transaction.fee))      		   throw new Error('Transaction ' + t + ' in Block ' + i + ' fee is not a number');
						if (isNaN(transaction.minedInBlockIndex))  throw new Error('Transaction ' + t + ' in Block ' + i + ' minedInBlockIndex is not a number');

						//validate date format for date created against ISO format RegEx
						if (!(/^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(.[0-9]+)?(Z)?$/.test(transaction.dateCreated))) throw new Error('Transaction ' + t + ' in Block ' + i + ' dateCreated is not a valid ISO format');


						//validate sender sig values, should be strings and should be 2 of them
						if (!(Array.isArray(transaction.senderSignature)) | transaction.senderSignature.length !== 2) 	 throw new Error('Transaction ' + t + ' in Block ' + i + ' sender signature is not an array of 2');

						for(let s = 0; s < transaction.senderSignature.length; s++) {
							var ss = transaction.senderSignature[s];
							//check type of values
							if (typeof ss[s] !== 'string')   throw new Error('Transaction ' + t + ' in Block ' + i + ' Sender Signature ' + s + ' is not a valid string');
						}

						
						//fields validated, now recalculate the transaction data hash 
						//console.log('comparing these hashes1: ' + transaction.transactionDataHash);
						//console.log('comparing these hashes2: ' + transaction.generateTransactionHash());
						//if (transaction.transactionDataHash != transaction.generateTransactionHash()) throw new Error('Transaction ' + t + ' in Block ' + i + ' Transaction Data Hash is not valid');

						console.log('validating the signature');
						//validate the signature - doesn't need to be done for genesis block or for the coinbase transaction
						if (i > 0 & t > 0) {
							if (!(utils.verifySignature(transaction.transactionDataHash, transaction.senderPubKey, transaction.senderSignature)))  throw new Error('Transaction ' + t + ' in Block ' + i + ' Transaction Signature is not valid');
						}


						//re-execute/validate transactions calculate the values of minedInBlockIndex and transactionSuccessful
						//None of these need to occur for coinbase transaction
						if (transaction.from !== '0000000000000000000000000000000000000000') {
							// verify sender publicKey and address if address = hashOf(pubkey). Don't do for coinbase transactions
							if(transaction.from !== cryptoJS.RIPEMD160(transaction.senderPubKey).toString()) {
								throw new Error("Invalid sender public key or blockchain address!");
							}

							// validate value
							if(transaction.value < 0) {
								throw new Error("value field must be greater than zero");
							}

							// validate fee - dont' do for coinbase transactions
							if(transaction.fee < 10 & transaction.from !== '0000000000000000000000000000000000000000') {
								throw new Error("Minimum fee is 10");
							}

							// validate sender balance
							var confirmedBalance = this.blockchain.getAddressConfirmedBalance(transaction.from);
							if(confirmedBalance < transaction.value + transaction.fee) {
								throw new Error("Sender does not have enough balance");
							}

							// verify signature
							if(!transaction.verifyTransaction()) {
								throw new Error("Vefication failed. Skipping!");
							}
						}

						// transaction is valid!  
						transaction.minedInBlockIndex = block.index;
						transaction.transactionSuccessful = 'true';



					}
					console.log('done validating transactions for block ' + i);

					//if (block.blockDataHash !== block.createBlockDataHash()) throw new Error('Block ' + i + ' blockDataHash is invalid');
					if (block.blockHash !== block.createBlockHash()) throw new Error('Block ' + i + ' blockHash is invalid');

					console.log('checking block difficulty for hash: ' + block.blockHash);
					//ensure block hash mashes block difficulty - construct regex string that checks for the correct amount of leading zeros
					let blockHashDiffTest = new RegExp('^[0]{' + block.difficulty + '}');
					if (!(blockHashDiffTest.test(block.blockHash))) throw new Error('Block ' + i + ' difficulty doesnt match hash');

					//validate the prevBlockHash == hash of the previous block. Doesn't need to be done for Genesis Block
					if (i > 0) {
						if (block.prevBlockHash !== previousBlock.blockHash)  throw new Error('Block ' + i + ' prevBlockHash doesnt match previous block hash');
					}

				}
				console.log('done with block validation');

				//recalculate the cumulative difficulty of the incoming chain
				var newCumulativeDifficulty = 0;
				for (var i = 0; i < blocks.length; i++) {
					newCumulativeDifficulty += 16 ** blocks[i].difficulty;
				}


				//if recalculated cumulative difficulty > current one, replace chain with incoming one
				if (newCumulativeDifficulty >= this.blockchain.getCumulativeDifficulty()) {
						console.log('new chain has higher cumulative difficulty, replacing our chain with the new one');
						this.blockchain.blocks = blocks;

						//clear all current mining jobs
						this.blockchain.miningJobs = {};


						//notify all peers about the new chain - send peerUrl so we don't notify the peer that gave  us the change
						console.log('chain was replaced due to peer ' + peerUrl  + ' having higher cumulative difficulty');
						this.notifyPeersOfChanges(peerUrl);
				}


			} else {
				console.log(peerUrl + ' has the same of less cumulative difficulty than us, no need to sync');
			}

			return obj;

		} catch (error) {
			console.log('Error during chain sync: ' + error);
		}
	}

	async syncPendingTransactions(peerUrl, obj) {
		if (obj.pendingTransactions > 0) {

			try {

				//we have pending transactions to sync, download transactions/pending
				var pendingTrans = await got(peerUrl + '/transactions/pending');
				console.log ('pending transactions:' + pendingTrans.body);

				var pendingTransactions = JSON.parse(pendingTrans.body);

				//append missing ones to our pendingTranasctions, ensuring no duplicates

				for(var i = 0; i < pendingTransactions.length; i++) { 
					var pendingTransaction = pendingTransactions[i] = new Transaction(pendingTransactions[i].from,
																				  pendingTransactions[i].to,
																				  pendingTransactions[i].value,
																				  pendingTransactions[i].fee,
																				  pendingTransactions[i].dateCreated,
																				  pendingTransactions[i].data,
																				  pendingTransactions[i].senderPubKey,
																				  pendingTransactions[i].transactionDataHash,
																				  pendingTransactions[i].senderSignature);
																				

					//first, ensure we don't already have this transaction
					if(this.getPendingTransaction(pendingTransaction.transactionDataHash)) {
						console.log('Pending Transaction ' + pendingTransaction.transactionDataHash + ' already in the pool of pending trans');
					} else {  //we don't have it, need to validate it

						//validate fields
						//check for missing values
						if (pendingTransaction.from == null)      				throw new Error ('Pending Transaction ' + pendingTransaction.transactionDataHash +  ' from is missing');
						if (pendingTransaction.to == null)      				throw new Error ('Pending Transaction ' + pendingTransaction.transactionDataHash + ' to is missing');
						if (pendingTransaction.value == null)      			    throw new Error ('Pending Transaction ' + pendingTransaction.transactionDataHash +  ' value is missing');
						if (pendingTransaction.fee == null)      				throw new Error ('Pending Transaction ' + pendingTransaction.transactionDataHash +  ' fee is missing');
						if (pendingTransaction.dateCreated == null)      		throw new Error ('Pending Transaction ' + pendingTransaction.transactionDataHash + ' dateCreated is missing');
						if (pendingTransaction.data == null)      				throw new Error ('Pending Transaction ' + pendingTransaction.transactionDataHash + ' data is missing');
						if (pendingTransaction.senderPubKey == null)      		throw new Error ('Pending Transaction ' + pendingTransaction.transactionDataHash +  ' senderPubKey is missing');
						if (pendingTransaction.transactionDataHash == null)     throw new Error ('Pending Transaction ' + i + ' transactionDataHash is missing');
						if (pendingTransaction.senderSignature == null)      	throw new Error ('Pending Transaction ' + pendingTransaction.transactionDataHash +  ' senderSignature is missing');


						//check type of values
						if (typeof pendingTransaction.from !== 'string' & pendingTransaction.from.length == 40)   				throw new Error('Pending Transaction ' + t + ' in Block ' + i + ' from is not a string');
						if (typeof pendingTransaction.to !== 'string' & pendingTransaction.to.length == 40)     				throw new Error('Pending Transaction ' + t + ' in Block ' + i + ' to is not a string');
						if (typeof pendingTransaction.data !== 'string')   			   											throw new Error('Pending Transaction ' + t + ' in Block ' + i + ' data is not a string');
						if (typeof pendingTransaction.senderPubKey !== 'string' & pendingTransaction.senderPubKey.length == 65)	throw new Error('Pending Transaction ' + t + ' in Block ' + i + ' senderPubKey is not a string');
						if (typeof pendingTransaction.transactionDataHash !== 'string')   										throw new Error('Pending Transaction ' + t + ' in Block ' + i + ' transactionDataHash is not a string');

						if (isNaN(pendingTransaction.value))      		   throw new Error('Pending Transaction ' + pendingTransaction.transactionDataHash + ' value is not a number');
						if (isNaN(pendingTransaction.fee))      		   throw new Error('Pending Transaction ' + pendingTransaction.transactionDataHash  + ' fee is not a number');

						//Validate Transaction Date date format against ISO Regex
						if (!(/^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(.[0-9]+)?(Z)?$/.test(pendingTransaction.dateCreated))) throw new Error('Pending Transaction ' + pendingTransaction.transactionDataHash + ' dateCreated is not a valid ISO format');


						//validate sender sig values, should be strings and should be 2 of them
						if (!(Array.isArray(pendingTransaction.senderSignature)) | pendingTransaction.senderSignature.length !== 2) 	 throw new Error('Transaction ' + t + ' in Block ' + i + ' sender signature is not an array of 2');

						for(let s = 0; s < pendingTransaction.senderSignature.length; s++) {
							var ss = pendingTransaction.senderSignature[s];
							//check type of values
							if (typeof ss[s] !== 'string')   throw new Error('Pending Transaction ' + pendingTransaction.transactionDataHash + ' Sender Signature ' + s + ' is not a valid string');
						}

						//check sender has enough balance
						var balance = this.blockchain.getAddressBalance(pendingTransaction.from);
						
						if(!(balance.confirmedBalance >= (pendingTransaction.value + pendingTransaction.fee))) 	throw new Error('Pending Transaction ' + pendingTransaction.transactionDataHash + ' Sender does not have enough balance');

						//check the signature is valid
						if (!(utils.verifySignature(pendingTransaction.transactionDataHash, pendingTransaction.senderPubKey, pendingTransaction.senderSignature)))  throw new Error('Pending Transaction ' + pendingTransaction.transactionDataHash + ' Transaction Signature is not valid');

						console.log('pending transaction ' + pendingTransaction.transactionDataHash + ' validated');
						this.blockchain.pendingTransactions.push(pendingTransaction);
						console.log('pending transaction ' + pendingTransaction.transactionDataHash + ' added to pending transactions');

					}

				}

				return pendingTrans;

			} catch (error) {
					console.log('Error during Pending Transactions Sync: ' + error);
				}

		}
	}

	
	//end point: /peers/notify-new-block      
	//function to take a change from another peer and process it
	async newBlockNotify(peerUrl) {
		try {
			//get info from peer blocks endpoint
			var peerBlocks = await got(peerUrl + '/blocks');
			//console.log ('peer new block notify blocks:' + peerBlocks.body);		
			var blocks = JSON.parse(peerBlocks.body);

			//set our blocks to theirs, we already know they have a higher cumulative difficulty
			this.blockchain.blocks = blocks;

			//clear all current mining jobs
			this.blockchain.miningJobs = {};


		} catch(error) {
			throw new Error('Error in newBlockNotify: ' + error);
		}
	}


	//added optional parameter peerURL. If we got a new block notification from another peer, we don't need to broadcast it back to them
	//if change is from our own chain , then this will be null and we will notify all peers
	async notifyPeersOfChanges(peerUrlChangeFrom) {

		//build up json object to send to peers
		var newBlockNotification = {
			blocksCount: this.blockchain.blocks.length,
			cumulativeDifficulty: this.blockchain.getCumulativeDifficulty(),
			nodeUrl: this.selfUrl
		};

		//now send the json to each peer on their notify new block REST endpoint
		for (var nodeId in this.peers) {
			var peerUrl = this.peers[nodeId];
			if (peerUrl != peerUrlChangeFrom) {
				console.log('notifying peer endpoint ' + peerUrl + ' about new block');
				const response = await got.post(peerUrl + '/peers/notify-new-block', {
					json: true,
					body: {
						newBlockNotification
					}
				});
			}
		}
	}

	//end point: /mining/get-mining-job/:address
	getMiningJob(address) {
		//first get the  coinbase transaction ready
		var coinbaseTransaction = new Transaction(
            '0000000000000000000000000000000000000000',
            address,
            5000000 , //static reward
            0,
            new Date().toISOString(),
            "coinbase tx",
            '00000000000000000000000000000000000000000000000000000000000000000',
            undefined,
            ["0000000000000000000000000000000000000000000000000000000000000000", "0000000000000000000000000000000000000000000000000000000000000000"]			//senderSig
		);
		coinbaseTransaction.confirmTransaction(this.blockchain.blocks.length); //populate minedInBlockIndex and transactionSuccessful

		var candidateTransactions = [coinbaseTransaction];
		var newBlockIndex = this.blockchain.blocks.length;
        var prevBlock = this.blockchain.blocks[newBlockIndex - 1];
        var balances = this.blockchain.getConfirmedBalances();

        // order transactions from highest fee to lowest
		var sortedPendingTransactions = this.blockchain.pendingTransactions.sort((a, b)=> b.fee - a.fee);
		
        // Validate transactions
        for(let i = 0; i < sortedPendingTransactions.length; i++) {
            let pendingTransaction = sortedPendingTransactions[i];
            balances[pendingTransaction.from] = balances[pendingTransaction.from] || 0;
            balances[pendingTransaction.to] = balances[pendingTransaction.to] || 0;

			//validate sender has enough funds for the transaction, else mark it as unsuccessful and dont change balances
            if(balances[pendingTransaction.from] < pendingTransaction.fee + pendingTransaction.value) {
				pendingTransaction.transactionSuccessful = 'false';
			} else { //transaction looks good, complete the transaction processing
                balances[pendingTransaction.from] -= pendingTransaction.fee + pendingTransaction.value;
				balances[pendingTransaction.to] += pendingTransaction.value;
                pendingTransaction.transactionSuccessful = 'true';
				pendingTransaction.minedInBlockIndex = newBlockIndex;
                candidateTransactions.push(pendingTransaction);
				coinbaseTransaction.value += pendingTransaction.fee; //update coinbase transaction value to be paid
            }
        }
		//now that we've validated all transactions, finalise remaining values for coinbsae transaction
        coinbaseTransaction.generateTransactionHash();
		coinbaseTransaction.minedInBlockIndex = newBlockIndex;
        coinbaseTransaction.transactionSuccessful = 'true';

		//now finalise the candidate block
        let candidateBlock = new Block(
            newBlockIndex,
            candidateTransactions,
            this.blockchain.currentDifficulty,
            prevBlock.blockHash,
            address,
            undefined,
            0,
            new Date().toISOString(),
            undefined
        );

		//update the map of mining jobs in blockchain
        this.blockchain.miningJobs[candidateBlock.blockDataHash] = candidateBlock;

        console.log('Candidate block ready: ' + JSON.stringify(candidateBlock));
        return candidateBlock;
	}

	//end point: /mining/submit-mined-block
	SubmitBlock(blockDataHash, dateCreated, nonce, blockHash) {
		//find the candiate block from the Map of mining jobs
        var block = this.blockchain.miningJobs[blockDataHash];
        if (block === undefined) {
            return { Error: "Mined Block not found or already mined" };
		}

        //Prepare the block
        block.createBlockHash();
		block.dateCreated = dateCreated;
        block.nonce = nonce;

        //Ensure Proof Of Work is valid - hash and difficulty
        if (block.blockHash !== blockHash) {
            return { Error: "Block hash from miner doesn't match Node" };
		}

		for (var i = 0; i < block.difficulty; i++) {
			if (block.blockHash[i] !== '0') {
				return { Error: "Proof Of Work is incorrect. Required: " + block.difficulty + ' found: ' + i};
			}
		}
		
		//if got to this point, then we're all good to add the block to the blockchain

		this.blockchain.blocks.push(block);
			
		//remove pending transactions			
		for (var i = 0; i < block.transactions.length; i++) {
			for(var j = 0; j < this.blockchain.pendingTransactions.length; j++) {
				if(this.blockchain.pendingTransactions[j].transactionDataHash === block.transactions[i].transactionDataHash) {
					this.blockchain.pendingTransactions.splice(j, 1);
					break; //already removed this one, no need to keep looping
				}
			}
		}
			
		console.log("Mined a new block: " + JSON.stringify(block));
		//Need to clear out any mining jobs
		this.blockchain.miningJobs = {};
		
		
        if (!block.Error) {
            //add block to the blockchain
			this.blockchain.blocks.push(block);

			//remove pending transactions
			for (var i = 0; i < block.transactions.length; i++) {
				for(var j = 0; j < this.blockchain.pendingTransactions.length; j++) {
					if(this.blockchain.pendingTransactions[j].transactionDataHash === block.transactions[i].transactionDataHash) {
						this.blockchain.pendingTransactions.splice(j, 1);
						break; //already removed this one, no need to keep looping
					}
				}
			}

			console.log("Mined a new block: " + JSON.stringify(block));
			//Need to clear out any mining jobs
			this.blockchain.miningJobs = {};
		}

        return block;
	}

	mineBlock(minerAddress, difficulty) {
		// Prepare the next block for mining - need to manually adjust the difficulty temporarily and then set it back because the difficulty can be anything
        var savedDifficulty = this.blockchain.currentDifficulty;
        this.blockchain.currentDifficulty = difficulty;
        var block = this.getMiningJob(minerAddress);
		block.dateCreated = (new Date()).toISOString();
		//can set difficulty back to what it was now
        this.blockchain.currentDifficulty = savedDifficulty;

		//start the proof of work - loop until block hash matches difficulty
		var nonce = 0;

		//build up a proof of work string that contains the right number of leading zeros
		var pow = '';
        for (let i = 0; i < difficulty; i++)
        {
            pow += '0';
        }

		var blockHash = block.createBlockHash();
		//now that we have a string of leading zeros, we can keep looping comparing the new hash to it til we have a match
		while (!blockHash.toString().startsWith(pow)) {
            nonce ++;
            blockHash = cryptoJS.SHA256(block.blockDataHash + "|" + block.dateCreated + "|" + nonce);

        }
		console.log('done with POW, nonce was ' + nonce);

		//proof of work complete, set nonce and blockhash
        block.nonce = nonce;
        block.blockHash = blockHash.toString();

        // Submit the mined block
        let newBlock = this.SubmitBlock(block.blockDataHash, block.dateCreated, block.nonce, block.blockHash);
		console.log('block debug mined ');
		
		//notify peers a change has occured
		this.notifyPeersOfChanges();
		
        return block;
	}

}



var initNode = () => {
	console.log('starting server');
    var app = express();
	app.use(bodyParser.json());


	app.get('/blocks', (req, res) => {
		res.setHeader('Content-Type', 'application/json');
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.send(node.getBlocks());
	});

	app.get('/debug/reset-chain', (req, res) => {
		res.setHeader('Content-Type', 'application/json');
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.send(node.resetChain());
	});

	app.get('/blocks/:index', (req, res) => {
		res.setHeader('Content-Type', 'application/json');
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.send(node.getBlock(req.params.index));
	});

	app.get('/info', (req, res) => {
		res.setHeader('Content-Type', 'application/json');
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.send(node.getInfo());
	});

	app.get('/debug', (req, res) => {
		res.setHeader('Content-Type', 'application/json');
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.send(node.getDebug());
	});

	app.get('/transactions/confirmed', (req, res) => {
		res.setHeader('Content-Type', 'application/json');
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.send(node.getConfirmedTransactions());
	});

	app.get('/balances', (req, res) => {
		res.setHeader('Content-Type', 'application/json');
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.send(node.getBalances())
	});

	app.get('/transactions/pending', (req, res) => {
		res.setHeader('Content-Type', 'application/json');
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.send(node.getPendingTransactions());
	});

	app.get('/peers', (req, res) => {
		res.setHeader('Content-Type', 'application/json');
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.send(node.getPeers());
	});

	app.get('/address/:address/balance', (req, res) => {
		res.setHeader('Content-Type', 'application/json');
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.send(node.getAddressBalance(req.params.address));
	});

	app.get('/address/:address/transactions', (req, res) => {
		res.setHeader('Content-Type', 'application/json');
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.send(node.getAddressTransactions(req.params.address));
	});

	app.get('/transactions/:tranHash', (req, res) => {
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Content-Type', 'application/json');
		res.send(node.getTransaction(req.params.tranHash));
	});


	app.post('/transaction/send', (req, res) => {
		var response = node.sendTransaction(req.body);
		if(response.hasOwnProperty('transactionDataHash')) {
			res.status(201);
		} else {
			res.status(400);
		}

		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Content-Type', 'application/json');
        res.send(response);
    });

	app.post('/peers/connect', async(req, res) => {
		console.log('got a connect request:' + JSON.stringify(req.body));

		try {
			//ensure we have a Peer URL
			if(!req.body.peerUrl) {
				console.log('bad connect request');
				throw new Error('peerUrl is required');
			}
			console.log('got a peerURL request from ' + req.body.peerUrl);

			if (!(utils.validURL(req.body.peerUrl))) {
				throw new Error('Peer ' +  req.body.peerUrl + ' is not in the valid format of http:host or ip address:port');
			} else console.log('peer URL is valid');

		    //connect to the peer
			let info = await node.connectToPeer(req.body.peerUrl);


			//synchronise the chain
			let peerInfo = await node.syncChain(req.body.peerUrl);

			//synchronise the pending transactions
			let peerSyncPendingTrans = await node.syncPendingTransactions(req.body.peerUrl, peerInfo);

			res.status = 200;
			res.json({message: 'Connected to peer: ' + req.body.peerUrl });

		}
		catch (error) {
			if (error.message.includes('Chain ID') | error.message.includes('not in the valid format') | error.message.includes('peerUrl is required') ) {
				res.status = 400;                   //bad chain or validation errors result in bad request
			} else res.status = 409;                //other errors, node already connected etc result in conflict
			res.json({
						message: error.message || 'Undefined Error occured, please check logs'
					 });
		}

		res.send();
	});

	app.post('/peers/notify-new-block', async(req, res) => {
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Content-Type', 'application/json');
		console.log('got a new block notification from another peer:' + JSON.stringify(req.body));

		try {
			//ensure we have a Cumulative difficulty

			if(!req.body.newBlockNotification.cumulativeDifficulty) { 
				console.log('bad block notification, cumulativeDifficulty not found');
				throw new Error('bad block notification, cumulativeDifficulty not found');
			}
			
			
			if (req.body.newBlockNotification.cumulativeDifficulty > node.blockchain.getCumulativeDifficulty()) {
				console.log('need to add new block from peer ' + req.body.newBlockNotification.nodeUrl);
				let info = await node.newBlockNotify(req.body.newBlockNotification.nodeUrl);		
				

				//notify peers a change has occured, pass in the source of the  change so we don't notify them back
				await node.notifyPeersOfChanges(req.body.newBlockNotification.nodeUrl);
					
		
				res.status = 200;
				res.json({message: 'Thanks for the notification: ' + req.body.newBlockNotification.nodeUrl });
			}

		}
		catch (error) {
			res.status = 400;                   //bad chain or validation errors result in bad request
			res.json({
						message: error.message || 'Undefined Error occured, please check logs'
					 });
		}

		res.send();

    });

	app.get('/debug/mine/:minerAddress/:difficulty', async(req, res) => {
		//simple debugging function , doesn't need to have fancy validations etc
		res.send(node.mineBlock(req.params.minerAddress,req.params.difficulty));
	});

	app.get('/mining/get-mining-job/:address', async (req, res) => {
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Content-Type', 'application/json');

		try {
			//validate address first
			if(!req.params.address) {
				console.log('bad get mining job request');
				throw new Error('address is required');
			}
			console.log('preparing mining job for ' + req.params.address);
			var candidateBlock = node.getMiningJob(req.params.address);

			//now that the blocks been prepared, return a response so the miner can start mining to find the nonce
			res.json({
				index: candidateBlock.index,
				transactionsIncluded: candidateBlock.transactions.length,
				difficulty: candidateBlock.difficulty,
				expectedReward: candidateBlock.transactions[0].value,
				rewardAddress: req.params.address,
				blockDataHash: candidateBlock.blockDataHash,
			});

			res.send();
		}
		catch (error) {
			res.status = 400;
			res.json({
						message: error
					 });
			res.send();

		}

	});

	app.post('/mining/submit-mined-block', async(req, res) => {
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Content-Type', 'application/json');

		console.log('got a new mined block , validating:' + JSON.stringify(req.body));

		try {
			if(!req.body.blockDataHash) {
				console.log('bad mined block, "blockDataHash not found');
				throw new Error('bad mined block, "blockDataHash not found');
			}
			if(!req.body.dateCreated) {
				console.log('bad mined block, "dateCreated not found');
				throw new Error('bad mined block, "dateCreated not found');
			}
			if(!req.body.nonce) {
				console.log('bad mined block, "nonce not found');
				throw new Error('bad mined block, "nonce not found');
			}
			if(!req.body.blockHash) {
				console.log('bad mined block, "blockHash not found');
				throw new Error('bad mined block, "blockHash not found');
			}

			let blockDataHash = req.body.blockDataHash;
			let dateCreated = req.body.dateCreated;
			let nonce = req.body.nonce;
			let blockHash = req.body.blockHash;

			let result = await SubmitBlock(blockDataHash, dateCreated, nonce, blockHash);
			if (result.Error) {
				throw new Error(result.Error);
			} else {
				res.json({"Message":	'Block accepted, reward paid: ' + result.transactions[0].value + ' micro coins'});

				//notify peers a change has occured
				notifyPeersOfChanges();
				res.status = 200;
			}
		}
		catch (error) {
			if (error == 'Mined Block not found or already mined') {
				res.status = 404;
			} else {
				res.status = 400;
			}
			res.json({
						message: error.message
			});
			res.send();
		}
	});


	app.options('*', cors());


	const args = process.argv.slice(2);
	var listenPort = args[1] || DEFAULT_PORT;
	console.log('port being used: ' + listenPort);

	var host = args[0] || DEFAULT_HOST;
	console.log('host being used: ' + host);

	var node = new Node(host,listenPort);
	//command to start listening
    app.listen(listenPort, () => console.log('Listening http on port: ' + listenPort));  
}
initNode();








