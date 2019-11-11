package blockchain.node.core;

import blockchain.node.NodeApplication;
import blockchain.node.util.CryptoUtil;
import blockchain.node.util.StringUtil;

import javax.xml.soap.Node;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.Signature;
import java.util.ArrayList;

public class Transaction {

    public String transactionId;

    public PublicKey sender;

    public PublicKey reciepient;

    public float value;

    public byte[] signature;

    public ArrayList<TransactionInput> inputs = new ArrayList<>();

    public ArrayList<TransactionOutput> outputs = new ArrayList<>();

    private static int sequence = 0;

    public Transaction(PublicKey from, PublicKey to, float value, ArrayList<TransactionInput> inputs) {
        this.sender = from;
        this.reciepient = to;
        this.value = value;
        this.inputs = inputs;
    }

    private String calculateHash() {
        sequence++;
        return StringUtil.sha3(
                CryptoUtil.getStringFromKey(sender) +
                        CryptoUtil.getStringFromKey(reciepient) +
                        Float.toString(value) + sequence
        );
    }

    public void generateSignature(PrivateKey privateKey) {
        String data = CryptoUtil.getStringFromKey(sender) + CryptoUtil.getStringFromKey(reciepient) + Float.toString(value);
        this.signature = CryptoUtil.applyECDSASign(privateKey, data);
    }

    public boolean verifySignature() {
        String data = CryptoUtil.getStringFromKey(sender) + CryptoUtil.getStringFromKey(reciepient) + Float.toString(value);
        return CryptoUtil.verifyECDSASign(sender, data, signature);
    }

    public boolean processTransaction() {
        if(verifySignature() == false) {
            System.out.println("signature failed to verify");
            return  false;
        }

        for (TransactionInput i : inputs) {
            i.UTXO = NodeApplication.UTXOs.get(i.transactionOutputId);
        }

        if(getInputsValue() < NodeApplication.minimumTransaction) {
            System.out.println("Transaction input is small: " + getInputsValue());
            return  false;
        }

        float leftOver = getInputsValue() - value;

        transactionId = calculateHash();
        outputs.add(new TransactionOutput(this.reciepient, value, transactionId));
        outputs.add(new TransactionOutput(this.sender, leftOver, transactionId));

        for(TransactionOutput o : outputs) {
            NodeApplication.UTXOs.put(o.id, o);
        }

        for(TransactionInput i : inputs) {
            if(i.UTXO == null) continue;
            NodeApplication.UTXOs.remove(i.UTXO.id);
        }

        return true;




    }

    public float getInputsValue() {
        float  total = 0;
        for(TransactionInput i: inputs) {
            if(i.UTXO == null) continue;
            total += i.UTXO.value;
        }
        return total;
    }

    public float getOutputsValue() {
        float total = 0;
        for(TransactionOutput o : outputs) {
            total += o.value;
        }
        return total;
    }

}
