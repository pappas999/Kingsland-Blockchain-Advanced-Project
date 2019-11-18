package blockchain.node.mine;

import blockchain.node.core.Block;
import blockchain.node.util.CryptoUtil;
import blockchain.node.util.StringUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

public class Miner {

    private Logger logger = LoggerFactory.getLogger(Miner.class);

    public Map<String, Object> proofOfWork(Block block, int difficulty) {
        Map<String, Object> result = new HashMap<>();
        String data = block.getTimeStamp() + block.getMerkleRoot() + block.getPreviousHash() + difficulty;
        int nonce = 0;
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
        block.setDifficulty(difficulty);
        block.setNonce(nonce -1);
        result.put("createdDate", new Date());
        result.put("blockHash", nonceHash);
        result.put("nonce", nonce);
        return result;
    }


    public Map<String, Object> simpleMiningAlgorithm(int difficulty, String blockDatahash) {
        logger.info("Start mining");
        Date createdDate = new Date();
        int nonce = 1;

        Map<String,Object> result = new HashMap<>();

        String pow = "";
        String blockHash =getBlockHash(blockDatahash, createdDate,nonce);
        for(int i = 0; i < difficulty; i++) {
            pow += "0";
        }
        while(! blockHash.toString().startsWith(pow)) {
            pow += "0";
            blockHash = getBlockHash(blockDatahash, createdDate, nonce);
        }

        logger.info("mined block " + blockHash + " nonce: " + nonce);

        result.put("createdDate", createdDate);
        result.put("blockHash", blockHash);
        result.put("nonce", nonce);
        return result;

    }

    private String getBlockHash(String blockDataHash, Date createdDate, int nonce) {
        return CryptoUtil.getSHA3Hash(blockDataHash + createdDate.getTime() + nonce);
    }


}
