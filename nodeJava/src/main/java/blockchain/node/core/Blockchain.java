package blockchain.node.core;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

;import java.util.ArrayList;
import java.util.List;

public class Blockchain {

    private static  final Logger logger = LoggerFactory.getLogger(Block.class);

    public List<Block> blockList = new ArrayList<>();

    public List<TransactionOutput> outputList = new ArrayList<>();

    public int difficulty;


    private Blockchain(){

    }

    public Blockchain(int difficulty){

        this.difficulty = difficulty;
    }

    public Boolean isValidChain() {
        Block currentBlock;
        Block previousBlock;
        for(int i = 1; i < blockList.size(); i++) {
            currentBlock = blockList.get(i);
            previousBlock = blockList.get(i-1);

            if(! currentBlock.getBlockHash().equals(currentBlock.blockHash)) {
                System.out.println("current hash is not equal" + i);
                return false;
            }

            if(! previousBlock.blockHash.equals(currentBlock.previousHash)) {
                System.out.println("Current block " + i + " is not equal to previous block" + (i -1));
                return false;
            }

        }
        return true;
    }


/*

    public Block generateGenesisBlock(){

    }

*/






}
