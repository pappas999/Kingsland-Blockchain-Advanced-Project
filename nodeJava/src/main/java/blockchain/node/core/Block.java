package blockchain.node.core;

import blockchain.node.util.CryptoUtil;
import blockchain.node.util.StringUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.web3j.abi.datatypes.Int;

import javax.swing.*;
import java.util.ArrayList;
import java.util.Date;

public class Block {

    private Logger logger = LoggerFactory.getLogger(Block.class);

    public String hash;

    public String previousHash;

    public String merkleRoot;

    public ArrayList<Transaction> transactions = new ArrayList<Transaction>();

    private long timeStamp;

    private int nonce;


    public Block(String previousHash) {
        this.previousHash = previousHash;

        this.timeStamp = new Date().getTime();
        this.hash = calculateHash();
    }

    public String getHash() {
        return hash;
    }

    public Block setHash(String hash) {
        this.hash = hash;
        return this;
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

    public String calculateHash() {
        String calculateHash = StringUtil.sha3(this.previousHash +
                Long.toString(timeStamp) +
                this.previousHash +
                Integer.toString(nonce) +
                this.merkleRoot);
        return calculateHash;
    }

    public void mineBlock(int difficulty) {
        merkleRoot = CryptoUtil.getMerkleRoot(transactions);
        String target = new String(new char[difficulty]).replace('\0','0');
        while(! hash.substring(0, difficulty).equals(target)) {
            nonce++;
            hash = calculateHash();
        }
        System.out.println("Block mined !!!: " + hash);
    }

    public boolean addTransaction(Transaction transaction) {
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
    }

}
