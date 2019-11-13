package blockchain.node.httpApi;

import blockchain.node.core.Block;
import blockchain.node.core.Transaction;
import blockchain.node.mine.Miner;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.web3j.crypto.ECKeyPair;
import org.web3j.utils.Numeric;

import java.math.BigInteger;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;

@RestController
public class minerController {

    private Logger logger = LoggerFactory.getLogger(minerController.class);

    @Value("${miner.address}")
    private String minerPublicAddress;

    @Value("${miner.private.key}")
    private String minerPrivateKey;

    private Block currentMiningBlock;

    @RequestMapping(method = RequestMethod.POST, value ="/startMining")
    public ResponseEntity<Map<String, Object>>
    startMing(@RequestBody Block newBlock, @RequestBody int difficulty) {
        Miner miner = new Miner();

       return ResponseEntity.ok(miner.proofOfWork(newBlock, difficulty));
    }



    private void collectFeeMiner(Block newBlock) {
        if(newBlock.getTransactions() != null) {
            List<Transaction> collectFeeTransactionList = new ArrayList<>();
            for (Transaction transaction : newBlock.getTransactions()) {
                Transaction collectFeeTransaction = new Transaction(transaction.from, minerPublicAddress, transaction.fee, 0, new Date().getTime(), "Collect for miner", minerPublicKey );
                collectFeeTransaction.setTransactionDataHash(collectFeeTransaction.getTransactionDataHash());
            }
        }
    }


    private ECKeyPair getMinderKeyPair() {
        BigInteger privatekey = Numeric.toBigInt(minerPrivateKey);
        ECKeyPair keyPair = ECKeyPair.create(privatekey);
        return  keyPair;
    }

    private PublicKey getMinerPublicKey() {
        BigInteger privatekey = Numeric.toBigInt(minerPrivateKey);
        ECKeyPair keyPair = ECKeyPair.create(privatekey);
        return Numeric.  keyPair.getPublicKey();
    }






}
