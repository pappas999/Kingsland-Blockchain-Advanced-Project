package blockchain.node.core;

import blockchain.node.util.CryptoUtil;
import blockchain.node.util.StringUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.web3j.abi.datatypes.Int;

import javax.swing.*;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

public class Block {

    private Logger logger = LoggerFactory.getLogger(Block.class);

    public int index;

    public int difficulty;

    public String minedBy;

    public String blockHash;

    public String dataHash;

    public String previousHash;

    public String merkleRoot;

    public List<Transaction> transactions = new ArrayList<Transaction>();

    private long timeStamp;

    private int nonce;


    public Block(String previousHash) {
        this.previousHash = previousHash;

        this.timeStamp = new Date().getTime();
        this.blockHash = createBlockHash();
    }

    public Block(int index, List<Transaction> transactionList, int difficulty, String previousHash, String minedBy, String dataHash, int nonce, long dateCreated, String blockHash) {
        this.index = index;
        this.transactions = transactionList;
        this.difficulty = difficulty;
        this.previousHash = previousHash;
        this.minedBy = minedBy;
        this.dataHash = dataHash;
        this.nonce = nonce;
        this.timeStamp = dateCreated;
        this.blockHash = blockHash;
    }





    public String getPreviousHash() {
        return previousHash;
    }

    public Block setPreviousHash(String previousHash) {
        this.previousHash = previousHash;
        return this;
    }


    public long getTimeStamp() {
        return timeStamp;
    }

    public Block setTimeStamp(long timeStamp) {
        this.timeStamp = timeStamp;
        return this;
    }

    public int getNonce() {
        return nonce;
    }

    public Block setNonce(int nonce) {
        this.nonce = nonce;
        return this;
    }

    public String createBlockDataHash() {
        String calculateHash = StringUtil.sha3(
                this.index +
                        CryptoUtil.getMerkleRoot(this.transactions) +
                        this.difficulty +
                        this.previousHash +
                        this.minedBy);
        return calculateHash;
    }



    public String createBlockHash() {
        return StringUtil.sha3(createBlockHash() + this.timeStamp + this.nonce);
    }


   /* public boolean addTransaction(Transaction transaction) {
        if(transaction == null) return false;

        if(previousHash != "0") {
            if(transaction.processTransaction() != true) {
                System.out.println("Transaction failed to process");
                return  false;
            }
        }
        transactions.add(transaction);
        logger.info("transaction successfully added to block");
        return true;
    }*/


    public String getMerkelRoot() {
        this.merkleRoot = CryptoUtil.getMerkleRoot(this.transactions);
        return this.merkleRoot;
    }


    public int getIndex() {
        return index;
    }

    public Block setIndex(int index) {
        this.index = index;
        return this;
    }

    public int getDifficulty() {
        return difficulty;
    }

    public Block setDifficulty(int difficulty) {
        this.difficulty = difficulty;
        return this;
    }

    public String getMinedBy() {
        return minedBy;
    }

    public Block setMinedBy(String minedBy) {
        this.minedBy = minedBy;
        return this;
    }

    public String getBlockHash() {
        return blockHash;
    }

    public Block setBlockHash(String blockHash) {
        this.blockHash = blockHash;
        return this;
    }

    public String getDataHash() {
        return dataHash;
    }

    public Block setDataHash(String dataHash) {
        this.dataHash = dataHash;
        return this;
    }

    public String getMerkleRoot() {
        return merkleRoot;
    }

    public Block setMerkleRoot(String merkleRoot) {
        this.merkleRoot = merkleRoot;
        return this;
    }

    public List<Transaction> getTransactions() {
        return transactions;
    }

    public Block setTransactions(List<Transaction> transactions) {
        this.transactions = transactions;
        return this;
    }
}
