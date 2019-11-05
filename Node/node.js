var cryptoJS = require("crypto-js");
var express = require("express");
var bodyParser = require('body-parser');
var WebSocket = require("ws");
const utils = require('./utils');
var http_port = process.env.HTTP_PORT || 3001;
var p2p_port = process.env.P2P_PORT || 6001;
var initialPeers = process.env.PEERS ? process.env.PEERS.split(',') : [];
var sockets = [];

const DEFAULT_PORT = 5555;
const DEFAULT_HOST = 'localhost';


class Block {
    constructor(index, transactions, difficulty, prevBlockHash, minedBy, blockDataHash, nonce, dateCreated, blockHash) {
        this.index = index;
		this.transactions = transactions;
		this.difficulty = difficulty;
        this.prevBlockHash = prevBlockHash;
        this.minedBy = minedBy;
        this.blockDataHash = this.createBlockDataHash();
        this.nonce = nonce;
        this.dateCreated = dateCreated;
        this.blockHash = this.createBlockHash();
    }
	
	createBlockDataHash() {
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
	
	
	//Roangalo to fill in logic ini these 3 methods - Start
	getAllTransactions() {
		
		
		//insert logic here - combined confirmed and pending transactions and return as a single Transactions array

	}	
	
	getConfirmedBalances() {
		var confirmedBalances = [];  //can change to map if easier 
		//insert logic here - loop through confirmed transactions and apply logic to populate balances array or Map
		
		return confirmedBalances;
	}
	
	getAllBalances() {
		var allBalances = [];  //can change to map if easier 
		//insert logic here - loop through all transactions and apply logic to populate balances array or Map. Same as funcion above except this one goes over all transactions, not just confirmed. 
		//Can combine into 1 function that takes a parameter if you want? (ALL or CONFIRMED)
		
		return allBalances;
	}
	
	getAllBalances(address) {
		var balance = [];  //can change to map if easier , in this case its a single object that will be returned  
		//insert logic here - loop through all transactions and apply logic to populate balances array or Map for the specified address
		
		return balance;
	}
	//Roangalo to fill in logic ini these 3 methods - End
	
	
	
	
	
	
	
	
	
}

class Transaction {
	constructor(from, to, value, fee, dateCreated, data, senderPubKey, transactionDataHash, senderSignature, minedInBlockIndex, transactionSuccessful) {
        this.from = from;
        this.to = to;
        this.value = value;
        this.fee = fee;
        this.dateCreated = new Date().toISOString();
		this.data = data;
		this.senderPubKey = senderPubKey;
		this.transactionDataHash = this.generateTransactionHash();
		this.senderSignature = senderSignature;
		this.minedInBlockIndex = minedInBlockIndex;
		this.transactionSuccessful = transactionSuccessful;
    }
	
	generateTransactionHash() {
        return cryptoJS.SHA256(JSON.stringify({from: this.from,
											     to: this.to,
											  value: this.value,
											    fee: this.fee,
									    dateCreated: this.dateCreated,
										   	   data: this.data,
									   senderPubKey: this.senderPubKey})).toString();
		
    }
}

function generateGenesisBlock() {
		let transaction = [new Transaction('0000000000000000000000000000000000000000',              //from
		                                  'f3a1e69b6176052fcc4a3248f1c5a91dea308ca9',               //to
										  1000000000000,                                            //value
										  0,														//fee
										  '2018 01 01T00:00:00.000Z',								//date created
										  'trusted third parties are security holes - Nick Szabo',	//data
										  '00000000000000000000000000000000000000000000000000000000000000000',	//senderPubKey
										  undefined,												//transaactionDataHash  FIX THIS
										  ["0000000000000000000000000000000000000000000000000000000000000000", "0000000000000000000000000000000000000000000000000000000000000000"],	//senderSig   
										  0,														//minedInBlockIndex
										  'true')];                                                   //transactionSuccessful

		let block = new Block (0,          															//index                                              
							   transaction,															//transactions
							   0,																	//difficulty
							   undefined,															//prevBlockHash
							   '0000000000000000000000000000000000000000',							//minedBy
							   undefined,															//blockDataHash
							   0,																	//nonce
							   '2018 01 01T00:00:00.000Z',											//dateCreated
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
		return JSON.stringify(obj,null,4);
		
	}
	
	//end point: /debug   
	getDebug() {
		let obj = {
			"selfUrl" : this.selfUrl,
			"peers" : JSON.stringify(this.peers, null, 4),          //needs fixing
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
	
	//end point: /trasnactions/pending
	getPendingTransactions() {
		
	}
	
	//end point: /trasnactions/confirmed            --DONE
	getConfirmedTransactions() {
		return JSON.stringify(this.blockchain.getConfirmedTransactions(), null, 4);
	}
	
	//end point: /trasnactions/:tranHash
	getTransaction() {
		
	}
	
	//end point: /balances
	getBalances() {
		
	}
	
	//end point: /address/:address/transactions
	getAddressTransactions() {
		
	}
	
	//end point: /address/:address/balance
	getAddressBalance() {
		
	}
	
	//end point: /debug/mine/:minerAddress/:difficulty
	getDifficulty() {
		
	}
	
	//end point: /transactions/send
	sendTransaction() {
		
	}
	
	//end point: /peers        --BROKEN/not working properly
	getPeers() {
		return JSON.stringify(utils.strMapToObj(this.getPeers()), 0, 4);
	}
	
	//end point: /peers/connect
	connectToPeers() {
		
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
	
	app.get('/blocks', (req, res) => res.send(node.getBlocks()));
	
	app.get('/debug/reset-chain', (req, res) => res.send(node.resetChain()));
	
	app.get('/blocks/:index', (req, res) => res.send(node.getBlock(req.params.index))); 
	
	app.get('/info', (req, res) => res.send(node.getInfo()));
	
	app.get('/debug', (req, res) => res.send(node.getDebug()));
	
	app.get('/transactions/confirmed', (req, res) => res.send(node.getConfirmedTransactions()));
	
	//TODO LIST


	

	
	app.get('/peers', (req, res) => res.send(node.getPeers()));
	
	app.get('/balances', (req, res) => res.send(node.getBalances()));
	

	
	
	app.get('/transactions/pending', (req, res) => res.send(node.getPendingTransactions()));

	
	
	app.get('/transactions/tranHash', (req, res) => res.send(node.getTransaction())); //fix params
	
	
	
	app.get('/debug/mine/minerAddress/difficulty', (req, res) => res.send(node.getDifficulty()));  //fix params
		
	app.get('/address/address/transactions', (req, res) => res.send(node.getAddressTransactions())); //fix params

	app.get('/address/address/balance', (req, res) => res.send(node.getAddressBalance())); //fix params
	
	app.post('/transaction/send', (req, res) => {
        node.sendTransaction();
        res.send();
    });
	
	
	app.post('/peers/connect', (req, res) => {
        node.connectToPeers();
        res.send();
    });
	
	app.post('/peers/notify-new-block', (req, res) => {
        node.newBlockNotify();
        res.send();
    });
	
	app.get('/mining/get-mining-job/address', (req, res) => res.send(node.getMiningAddress()));  //fix params

	app.post('/mining/submit-mined-block', (req, res) => {
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
	
	
	
	//command to start listening
    app.listen(DEFAULT_PORT, () => console.log('Listening http on port: ' + DEFAULT_PORT));  //check if need to get port as param and store/use
};

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







