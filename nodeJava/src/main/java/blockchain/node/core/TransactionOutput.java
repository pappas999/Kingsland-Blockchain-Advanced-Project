package blockchain.node.core;

import blockchain.node.util.CryptoUtil;
import blockchain.node.util.StringUtil;

import java.security.PublicKey;

public class TransactionOutput {

    public String id;

    public PublicKey recipient;

    public float value;

    public String parentTransactionId;

    public TransactionOutput(PublicKey recipient, float value, String parentTransactionId) {
        this.recipient = recipient;
        this.value = value;
        this.parentTransactionId = parentTransactionId;
        this.id = StringUtil.sha3(CryptoUtil.getStringFromKey(recipient));
    }

    public boolean isMine(PublicKey publicKey) {
        return (publicKey == recipient);
    }
}
