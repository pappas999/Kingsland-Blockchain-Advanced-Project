package blockchain.node.util;

import org.web3j.crypto.Hash;

import java.security.PublicKey;

public class StringUtil {

    /**
     * input utf8 string
     * @param input
     * @return
     */
    public static String sha3(String input) {
        return Hash.sha3String(input);
    }


}
