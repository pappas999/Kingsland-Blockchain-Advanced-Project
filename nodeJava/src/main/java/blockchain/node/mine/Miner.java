package blockchain.node.mine;

import blockchain.node.core.Block;
import blockchain.node.util.StringUtil;

import java.util.HashMap;
import java.util.Map;

public class Miner {

    public Map<String, Object> proofOfWork(Block block, int difficulty) {
        Map<String, Object> result = new HashMap<>();
        String data = block.getTimeStamp() + block.getMerkleRoot() + block.getPreviousHash() + difficulty;
        long nonce = 0;
        String nonceHash ="";
        boolean nonceFound = false;
        while(! nonceFound) {
            nonceHash = StringUtil.sha3(data + nonce);
            nonceFound = nonceHash.equals(StringUtil.sha3(data.substring(2)));
            nonce++;
            if(nonce == 100000) {
                break;
            }
        }
        result.put("hash", nonceHash);
        result.put("nonce", nonce);
        return result;
    }


}
