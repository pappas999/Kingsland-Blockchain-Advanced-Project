package blockchain.node.httpApi;

import blockchain.node.core.Block;
import blockchain.node.mine.Miner;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
public class minerController {

    @RequestMapping(method = RequestMethod.POST, value ="/startMining")
    public ResponseEntity<Map<String, Object>>
    startMing(@RequestBody Block newBlock, @RequestBody int difficulty) {
        Miner miner = new Miner();
       return ResponseEntity.ok(miner.proofOfWork(newBlock, difficulty));
    }

}
