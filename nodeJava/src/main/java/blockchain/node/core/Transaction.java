package blockchain.node.core;

import blockchain.node.NodeApplication;
import blockchain.node.util.CryptoUtil;
import blockchain.node.util.StringUtil;
import org.web3j.crypto.Keys;
import org.web3j.crypto.Sign;

import javax.xml.soap.Node;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.Signature;
import java.util.ArrayList;

public class Transaction {


    public String from;

    public String to;

    public float value;

    public float fee;

    public long dateCreated;

    public String data;

    public  PublicKey senderPubKey;

    public String transactionDataHash;

    public Sign.SignatureData senderSiganture;

    public int minedInBlockIndex = -1;

    public boolean transactionSuccessful =false;


    public Transaction(String  fromAddr, String toAddr, float value, float fee, long dateCreated, String data, PublicKey senderPubKey) {
        this.from = fromAddr;
        this.to = toAddr;

        this.value = value;
        this.fee = fee;
        this.dateCreated = dateCreated;
        this.data = data;
        this.senderPubKey = senderPubKey;

    }

    private String calculateHash() {
        if ( this.data != null) {

            return StringUtil.sha3(this.from +
                  this.to +
                     this.value +
                     this.fee +
                    this.dateCreated +
                   this.data +
                    this.senderPubKey.toString());
        } else {
            return StringUtil.sha3(this.from +
                    this.to +
                    this.value +
                    this.fee +
                    this.dateCreated +
                    this.senderPubKey.toString());
        }
    }


    public String getTransactionDataHash() {
        return transactionDataHash;
    }

    public void setTransactionDataHash(String transactionDataHash) {
        this.transactionDataHash = transactionDataHash;
    }

    public Sign.SignatureData getSenderSiganture() {
        return senderSiganture;
    }

    public void setSenderSiganture(Sign.SignatureData senderSiganture) {
        this.senderSiganture = senderSiganture;
    }
}
