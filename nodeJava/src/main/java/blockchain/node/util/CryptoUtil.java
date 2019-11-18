package blockchain.node.util;

import blockchain.node.NodeApplication;
import blockchain.node.core.Transaction;
import org.bouncycastle.jcajce.provider.digest.SHA3;
import org.bouncycastle.util.encoders.Hex;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.web3j.crypto.Sign;

import java.security.Key;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.Signature;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

public class CryptoUtil {
    private static final Logger logger = LoggerFactory.getLogger(CryptoUtil.class);

    public static byte[] applyECDSASign(PrivateKey privateKey, String input) {
        Signature dsa;
        byte[] output = new byte[0];
        try {
            dsa = Signature.getInstance("ECDSA","BC");
            dsa.initSign(privateKey);

            byte[] strByte = input.getBytes();
            dsa.update(strByte);

            byte[] realSig = dsa.sign();
            output = realSig;

        } catch (Exception e) {
           logger.error("Error at sign" + e);
        }
        return output;
    }

    public static boolean verifyECDSASign(PublicKey publicKey, String data, byte[] signature) {
        try {
            Signature ecdsaVerify = Signature.getInstance("ECDSA", "BC");
            ecdsaVerify.initVerify(publicKey);
            ecdsaVerify.update(data.getBytes());
            return ecdsaVerify.verify(signature);

        } catch (Exception e) {
            logger.info("error at verify signature");
        }
        return false;
    }

    public static String getStringFromKey(Key key) {
        return Base64.getEncoder().encodeToString(key.getEncoded());
    }


    public static String getMerkleRoot(List<Transaction> transactionArrayList) {
        int count = transactionArrayList.size();
        ArrayList<String> prevTreeLayer = new ArrayList<>();

        for(Transaction transaction: transactionArrayList) {
            prevTreeLayer.add(transaction.transactionDataHash);
        }

        ArrayList<String> treeLayer = prevTreeLayer;
        while(count > 1) {
            treeLayer = new ArrayList<String>();
            int  i = 1;
            for(i = 1; i < prevTreeLayer.size(); i += 2) {
                treeLayer.add(StringUtil.sha3(prevTreeLayer.get(i-1) + prevTreeLayer.get(i)));
            }

            // for the case there is extra last item
            if(i != prevTreeLayer.size() - 1) {
                treeLayer.add(StringUtil.sha3(prevTreeLayer.get(prevTreeLayer.size()-1)));
            }
            count = treeLayer.size();
            prevTreeLayer = treeLayer;
        }
        String merkleRoot = (treeLayer.size() == 1) ? treeLayer.get(0) :"";
        return merkleRoot;
    }


    public static String getSHA3Hash(String input) {

        SHA3.DigestSHA3 digestSHA3 = new SHA3.Digest256();
        digestSHA3.update(input.getBytes());
        String digestMessage = Hex.toHexString(digestSHA3.digest());
        return  digestMessage;
    }



}
