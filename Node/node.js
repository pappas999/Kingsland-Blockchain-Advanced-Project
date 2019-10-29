var cryptoJS = require("crypto-js");
var express = require("express");
var bodyParser = require('body-parser');
var WebSocket = require("ws");
var http_port = process.env.HTTP_PORT || 3001;
var p2p_port = process.env.P2P_PORT || 6001;
var initialPeers = process.env.PEERS ? process.env.PEERS.split(',') : [];
var sockets = [];

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
	//constructor() {
     //   this.nodeId = ;
		//this.selfURL = ;
	//	this.peers = [];
	//	this.chain = new Blockchain();
   // }
	
}


class MiningJob {
	
}

var blockchain = new Blockchain();

var initHttpServer = () => {
	console.log('starting server');
    var app = express();
    app.use(bodyParser.json());

    app.get('/blocks', (req, res) => res.send(JSON.stringify(blockchain.blocks)));
   
    app.get('/peers', (req, res) => {
        res.send(sockets.map(s => s._socket.remoteAddress + ':' + s._socket.remotePort));
    });
    app.post('/addPeer', (req, res) => {
        connectToPeers([req.body.peer]);
        res.send();
    });
    app.listen(http_port, () => console.log('Listening http on port: ' + http_port));
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







