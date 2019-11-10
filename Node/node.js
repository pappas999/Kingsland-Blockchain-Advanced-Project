var cryptoJS = require("crypto-js");
var express = require("express");
var bodyParser = require('body-parser');
var WebSocket = require("ws");
const EC = require('elliptic').ec;
const secp256k1 = new EC('secp256k1');


const utils = require('./utils');
const got = require('got');


var initialPeers = process.env.PEERS ? process.env.PEERS.split(',') : [];
var sockets = [];

const DEFAULT_PORT = 5555;
const DEFAULT_HOST = 'localhost';
const DEFAULT_P2P_PORT = 6001;


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
        return cryptoJS.SHA256('${this.blockDataHash}|${this.dateCreated}|${this.nonce}').toString();
    }
}

class Blockchain {
	constructor(difficulty) {
        this.blocks = [generateGenesisBlock()];
        this.pendingTransactions = [];
        this.currentDifficulty = 0; //store in config
        this.miningJobs = {};
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
	
	getAllBalances() {
		var allBalances = [];  //can change to map if easier 
		//insert logic here - loop through all transactions and apply logic to populate balances array or Map. Same as funcion above except this one goes over all transactions, not just confirmed. 
		//Can combine into 1 function that takes a parameter if you want? (ALL or CONFIRMED)
		
		return allBalances;
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
					balance['confirmedBalance'] -= value - fee;

				if(confirmation >= 6)
					balance['safeBalance'] -= value - fee;	
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
				balance['pendingBalance'] -= pvalue - pfee;	

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
        	return cryptoJS.SHA256(JSON.stringify({from: this.from,
											     to: this.to,
											  value: this.value,
											    fee: this.fee,
									    dateCreated: this.dateCreated,
										   	   data: this.data,
									   senderPubKey: this.senderPubKey})).toString();
		} else {
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
				senderSignature : this.senderSignature
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
				senderSignature : this.senderSignature
			}
		}

		return txn;
	}
}

function generateGenesisBlock() {
		let txn = new Transaction('0000000000000000000000000000000000000000',              //from
		                                  'f3a1e69b6176052fcc4a3248f1c5a91dea308ca9',               //to
										  1000000000000,                                            //value
										  0,														//fee
										  '2018-01-01T00:00:00.000Z',								//date created
										  'trusted third parties are security holes - Nick Szabo',	//data
										  '00000000000000000000000000000000000000000000000000000000000000000',	//senderPubKey
										  undefined,                                                //transactionDataHash
										  ["0000000000000000000000000000000000000000000000000000000000000000", "0000000000000000000000000000000000000000000000000000000000000000"],	//senderSig
										  );
		txn.confirmTransaction(0);
		let transaction = [txn];

		let block = new Block (0,          															//index                                              
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


class Node {
	constructor(host, port) {
		this.host = host || DEFAULT_HOST;  //use default host if not populated
		this.port = port || DEFAULT_PORT;  //use default port if not populated
		this.selfUrl = 'http://' + this.host + ':' + this.port;
        this.nodeId = this.generateNodeId();
		console.log('generated node id: ' + this.nodeId);
		console.log('generated selfUrl: ' + this.selfUrl);
		
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
	
	//end point: /info                  -- DONE
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
		//return JSON.stringify(obj,null,4);
		return obj;
		
	}
	
	//end point: /debug   
	getDebug() {
		let obj = {
			"selfUrl" : this.selfUrl,
			"peers" : JSON.stringify(this.peers, null, 4),          //needs fixing once implement peers
			"chain" : this.blockchain, //return json representation of the blockchain object - needs fixing when implement miner tasks
			"confirmedBalances" : this.blockchain.getConfirmedBalances() 
		}
		return JSON.stringify(obj,null,4);
		
	}
	
	//end point: /debug/reset-chain           --DONE
	resetChain() {
		this.blockchain = new Blockchain();
		const obj = {message: 'The chain was reset to its genesis block'};
		return JSON.stringify(obj,null,4);
		
	}
	
	
	//end point: /blocks                      --DONE
	getBlocks() {
		return JSON.stringify(this.blockchain.blocks, null, 4);
	}
	
	//end point: /blocks/:index              -- DONE
	getBlock(index) {
		console.log('index: ' + index);
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
	 
	//end point: /transactions/pending                 --DONE, check format once implement transactions
	getPendingTransactions() {
		return JSON.stringify(this.blockchain.pendingTransactions, null, 4);
	}
	
	//end point: /trasnactions/confirmed            --DONE
	getConfirmedTransactions() {
		return JSON.stringify(this.blockchain.getConfirmedTransactions(), null, 4);
	}
	
	
	//end point: /balances                        --DONE   CHECK TO SEE DOESNT SHOW THE 0 one with minus balance
	getBalances() {
		return JSON.stringify(this.blockchain.getConfirmedBalances(), null, 4);
	}
	
	
	//end point: /transactions/:tranHash                 --DONE
	getTransaction(tranHash) {
		//use confirmed transactions as a basis for search
		var transactions = this.blockchain.getConfirmedTransactions();
		
		//loop through transactions and find hash
		for (var i = 0; i < transactions.length; i++) {
			if (transactions[i].transactionDataHash === tranHash) {
				return transactions[i];
			}
		}
		
		//if got to this point, it means transactioon wasn't found, so return error
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
	

	
	//end point: /address/:address/transactions                --DONE , CHECK ORDER OF TRANSACTIONS
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
		
		
		return addrTransactions.sort((a, b) => b.dateCreated - a.dateCreated);
		//const sortedActivities = activities.sort((a, b) => b.date - a.date)
	}
	
	//end point: /address/:address/balance            --DONE
	getAddressBalance(address) {
		return this.blockchain.getAddressBalance(address);
	}
	
	//end point: /debug/mine/:minerAddress/:difficulty
	getDifficulty() {
		
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
		
		var txn = new Transaction(txnData.from, txnData.to, txnData.value, txnData.fee, txnData.dateCreated, txnData.data, txnData.senderPubKey, txnData.senderSignature);

		// check for transactions
		var txns = this.blockchain.getAllTransactions();
		for(var i = 0; i < txns.length; i++) {
			if (txn.transactionDataHash === txns[i].transactionDataHash) {
				response['errorMsg'] = "Duplicate transaction! Skipping!"
				return response;
			}
		}

		// verify sender publicKey and address if address = hashOf(pubkey)
		if(txn.from !== cryptoJS.RIPEMD160(utils.hexStringToByte(txn.senderPubKey)).toString()) {
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
	
	//end point: /peers        --DONE, CHECK FORMATTING AFTER
	getPeers() {
		return JSON.stringify(this.peers, null, 4);
	}
	
	//end point: /peers/connect
	async connectToPeer(peerUrl) {
		var response;
		
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
				if (!(obj.peers[this.selfUrl]))  {	                //only connect if our node URL isn't in their list of peers
					console.log('our peer not found in theirs, will connect');
					await got.post(peerUrl + '/peers/connect', {
																	peerUrl: this.selfUrl
																});
				} else {
					console.log(this.selfUrl + ' already exists in ' + obj.nodeIs + ' list of peers');
				}
			} else {   //no peers on their peers list, so can connect
				 //await got.post(peerUrl + '/peers/connect', {
													//			peerUrl: this.selfUrl
														//	});
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
			if(obj.cumulativeDifficulty = this.blockchain.getCumulativeDifficulty()) {
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
						var transaction = block.transactions[i] = new Transaction (block.transactions[i].from,
																				   block.transactions[i].to,
																				   block.transactions[i].value,
																				   block.transactions[i].fee,
																				   block.transactions[i].dateCreated,
																				   block.transactions[i].data,
																				   block.transactions[i].senderPubKey,
																				   block.transactions[i].transactionDataHash,
																				   block.transactions[i].senderSignature);

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
						
						
						//check type of values				
						if (typeof transaction.from !== 'string' & i > 0)   			   throw new Error('Transaction ' + t + ' in Block ' + i + ' from is not a string');
						if (typeof transaction.to !== 'string' & i > 0)     			   throw new Error('Transaction ' + t + ' in Block ' + i + ' to is not a string');
						if (typeof transaction.data !== 'string' & i > 0)   			   throw new Error('Transaction ' + t + ' in Block ' + i + ' data is not a string');
						if (typeof transaction.senderPubKey !== 'string' & i > 0)          throw new Error('Transaction ' + t + ' in Block ' + i + ' senderPubKey is not a string');
						if (typeof transaction.transactionDataHash !== 'string' & i > 0)   throw new Error('Transaction ' + t + ' in Block ' + i + ' transactionDataHash is not a string');
						if (typeof transaction.transactionSuccessful !== 'string' & i > 0) throw new Error('Transaction ' + t + ' in Block ' + i + ' transactionSuccessful is not a string');
						
						
						if (isNaN(transaction.value))      		   throw new Error('Transaction ' + t + ' in Block ' + i + ' value is not a number');
						if (isNaN(transaction.fee))      		   throw new Error('Transaction ' + t + ' in Block ' + i + ' fee is not a number');
						if (isNaN(transaction.minedInBlockIndex))  throw new Error('Transaction ' + t + ' in Block ' + i + ' minedInBlockIndex is not a number');
						
						if (!(/^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(.[0-9]+)?(Z)?$/.test(transaction.dateCreated))) throw new Error('Transaction ' + t + ' in Block ' + i + ' dateCreated is not a valid ISO format');
						
						
						//validate sender sig values, should be strings and should be 2 of them
						if (!(Array.isArray(transaction.senderSignature)) | transaction.senderSignature.length !== 2) 	 throw new Error('Transaction ' + t + ' in Block ' + i + ' sender signature is not an array of 2');
					
						for(let s = 0; s < transaction.senderSignature.length; s++) { 
							var ss = transaction.senderSignature[s];
							//check type of values				
							if (typeof ss[s] !== 'string')   throw new Error('Transaction ' + t + ' in Block ' + i + ' Sender Signature ' + s + ' is not a valid string');
						}
						
						//fields validated, now recalculate the transaction data hash 
						if (transaction.transactionDataHash != transaction.generateTransactionHash()) throw new Error('Transaction ' + t + ' in Block ' + i + ' Transaction Data Hash is not valid');
						
						console.log('validating the signature');
						//validate the signature - doesn't need to be done for genesis block
						if (i > 0) {
							if (!(utils.verifySignature(transaction.transactionDataHash, transaction.senderPubKey, transaction.senderSignature)))  throw new Error('Transaction ' + t + ' in Block ' + i + ' Transaction Signature is not valid');
						}
						

						//re-execute all transactions, calculate the values of minedInBlockIndex and transactionSuccessful
						transaction.minedInBlockIndex = block.index;
						transaction.transactionSuccessful = 'true';
		
		
		
					}
					console.log('done validating transactions for block ' + i);
					
					if (block.blockDataHash !== block.createBlockDataHash()) throw new Error('Block ' + i + ' blockDataHash is invalid');
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
				}
				
				
				//clear all current mining jobs
				
				this.blockchain.miningJobs = {};
			
			
				//notify all peers about the new chain, and remove any active mining jobs
				
				console.log('chain was replaced due to peer ' + peerUrl  + ' having higher cumulative difficulty');
			
			
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
					pendingTransaction = pendingTransactions[i] = new Transaction(pendingTransactions[i].from,
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
						if (pendingTransaction.value == null)      			throw new Error ('Pending Transaction ' + pendingTransaction.transactionDataHash +  ' value is missing');
						if (pendingTransaction.fee == null)      				throw new Error ('Pending Transaction ' + pendingTransaction.transactionDataHash +  ' fee is missing');
						if (pendingTransaction.dateCreated == null)      		throw new Error ('Pending Transaction ' + pendingTransaction.transactionDataHash + ' dateCreated is missing');
						if (pendingTransaction.data == null)      				throw new Error ('Pending Transaction ' + pendingTransaction.transactionDataHash + ' data is missing');
						if (pendingTransaction.senderPubKey == null)      		throw new Error ('Pending Transaction ' + pendingTransaction.transactionDataHash +  ' senderPubKey is missing');
						if (pendingTransaction.transactionDataHash == null)    throw new Error ('Pending Transaction ' + i + ' transactionDataHash is missing');
						if (pendingTransaction.senderSignature == null)      	throw new Error ('Pending Transaction ' + pendingTransaction.transactionDataHash +  ' senderSignature is missing');
						
						
						//check type of values				
						if (typeof pendingTransaction.from !== 'string' & pendingTransaction.from.length == 40)   				throw new Error('Pending Transaction ' + t + ' in Block ' + i + ' from is not a string');
						if (typeof pendingTransaction.to !== 'string' & pendingTransaction.to.length == 40)     				throw new Error('Pending Transaction ' + t + ' in Block ' + i + ' to is not a string');
						if (typeof pendingTransaction.data !== 'string')   			   											throw new Error('Pending Transaction ' + t + ' in Block ' + i + ' data is not a string');
						if (typeof pendingTransaction.senderPubKey !== 'string' & pendingTransaction.senderPubKey.length == 65)	throw new Error('Pending Transaction ' + t + ' in Block ' + i + ' senderPubKey is not a string');
						if (typeof pendingTransaction.transactionDataHash !== 'string')   										throw new Error('Pending Transaction ' + t + ' in Block ' + i + ' transactionDataHash is not a string');

						if (isNaN(pendingTransaction.value))      		   throw new Error('Pending Transaction ' + pendingTransaction.transactionDataHash + ' value is not a number');
						if (isNaN(pendingTransaction.fee))      		   throw new Error('Pending Transaction ' + pendingTransaction.transactionDataHash  + ' fee is not a number');

					
						if (!(/^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(.[0-9]+)?(Z)?$/.test(pendingTransaction.dateCreated))) throw new Error('Pending Transaction ' + pendingTransaction.transactionDataHash + ' dateCreated is not a valid ISO format');
						
						
						//validate sender sig values, should be strings and should be 2 of them
						if (!(Array.isArray(pendingTransaction.senderSignature)) | pendingTransaction.senderSignature.length !== 2) 	 throw new Error('Transaction ' + t + ' in Block ' + i + ' sender signature is not an array of 2');
				
						for(let s = 0; s < pendingTransaction.senderSignature.length; s++) { 
							var ss = pendingTransaction.senderSignature[s];
							//check type of values				
							if (typeof ss[s] !== 'string')   throw new Error('Pending Transaction ' + pendingTransaction.transactionDataHash + ' Sender Signature ' + s + ' is not a valid string');
						}
								
						//check sender has enough balance
						var balance = this.getAddressBalance(pendingTransaction.from);
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
					console.log('Error during chain sync: ' + error);
				}
			
		}
	}
	
	//end point: /peers/notify-new-block
	newBlockNotify() {
		
	}
	
	//end point: /mining/get-mining-job/:address
	getMiningAddress() {
		
	}
	
	//end point: /mining/submit-mined-block
	SubmitBlock() {
		
	}
	
	
	
}


class MiningJob {
	
}






var initHttpServer = () => {
	console.log('starting server');
    var app = express();
    app.use(bodyParser.json());
	
	var node = new Node();
	
	//DONE LIST
	
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
	
	//TODO LIST

	
	app.get('/debug/mine/minerAddress/difficulty', (req, res) => res.send(node.getDifficulty()));  //fix params
			
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
	
		try {
			//ensure we have a Peer URL
			if(!req.body.peerUrl) throw new Error('peerUrl is required');
			
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

	
	app.post('/peers/notify-new-block', (req, res) => {
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Content-Type', 'application/json');
        node.newBlockNotify();
        res.send();
    });
	
	app.get('/mining/get-mining-job/address', (req, res) => {
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Content-Type', 'application/json');
		res.send(node.getMiningAddress());
	});  //fix params

	app.post('/mining/submit-mined-block', (req, res) => {
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Content-Type', 'application/json');
        node.SubmitBlock();
        res.send();
    });
	
			
			
   
    /*app.get('/peers', (req, res) => {
        res.send(sockets.map(s => s._socket.remoteAddress + ':' + s._socket.remotePort));
    });
    app.post('/addPeer', (req, res) => {
        connectToPeers([req.body.peer]);
        res.send();
    });*/
	
	
	const args = process.argv.slice(2);
	var listenPort = args[0] || DEFAULT_PORT;
	console.log('port being used: ' + listenPort);
	//command to start listening
    app.listen(listenPort, () => console.log('Listening http on port: ' + listenPort));  //check if need to get port as param and store/use
}

var initP2PServer = () => {
    var server = new WebSocket.Server({port: p2p_port});
    server.on('connection', ws => initConnection(ws));
    console.log('listening websocket p2p port on: ' + p2p_port);

};

var initConnection = (ws) => {
    sockets.push(ws);
    initMessageHandler(ws);
    initErrorHandler(ws);
    write(ws, queryChainLengthMsg());
};

var connectToPeers = (newPeers) => {
    newPeers.forEach((peer) => {
        var ws = new WebSocket(peer);
        ws.on('open', () => initConnection(ws));
        ws.on('error', () => {
            console.log('connection failed')
        });
    });
};


//connectToPeers(initialPeers);
initHttpServer();
//initP2PServer();







