package blockchain.node.httpApi;

import blockchain.node.core.Block;
import blockchain.node.core.MiningJob;
import blockchain.node.core.Transaction;
import blockchain.node.mine.Miner;
import blockchain.node.util.CryptoUtil;
import com.google.gson.Gson;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.web3j.crypto.ECKeyPair;
import org.web3j.utils.Numeric;

import javax.net.ssl.HttpsURLConnection;
import java.io.*;
import java.math.BigInteger;
import java.net.*;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.URIParameter;
import java.util.*;

@RestController
public class minerController {

    private Logger logger = LoggerFactory.getLogger(minerController.class);

    @Value("${miner.address}")
    private String minerPublicAddress;

    @Value("${miner.private.key}")
    private String minerPrivateKey;

    private Block currentMiningBlock;

    @Value("${node.endpoint.getminingJob}")
    private String nodeEndpointMiningJob;

    @Value("${node.endpoint}")
    private String nodeEndPoint;

    @RequestMapping(method = RequestMethod.GET, value ="/startMining/{id}")
    public ResponseEntity<String>
    startMing(@PathVariable("id") int id) {

        try {
          MiningJob miningJob = getMiningJob();
          if(miningJob!= null) {

              Miner miner = new Miner();
              Map<String,Object> result =  new HashMap<>();
              if(id != 1) {
                  result =  miner.simpleMiningAlgorithm(miningJob.getDifficulty(), miningJob.getBlockDataHash());
              } else {
                  Date createdDate = new Date();
                  result.put("createdDate",createdDate);
                  result.put("nonce",miningJob.getDifficulty());
                  result.put("blockHash", CryptoUtil.getSHA3Hash( miningJob.getBlockDataHash() + createdDate.getTime() + miningJob.getDifficulty()));
              }
              if(result != null) {
                  postMiningTask(miningJob.getBlockDataHash(), (int) result.get("nonce"), (String) result.get("blockHash"), (Date)  result.get("createdDate"));
                  return ResponseEntity.ok("Done mining job well");
              }

          }
        }catch (Exception e) {
            logger.info("error " + e);
        }

       return ResponseEntity.ok("Failed to run a mining job");
    }


    private MiningJob getMiningJob() {
        String http_url = nodeEndPoint + "/" + nodeEndpointMiningJob + "/" + minerPublicAddress;
        try {
            URL url = new URL(http_url);
            HttpURLConnection con = (HttpURLConnection) url.openConnection();

            con.setDoOutput(true);
            con.setInstanceFollowRedirects(false);
            con.setRequestMethod("GET");
            con.setRequestProperty("Content-Type", "application/json");
            con.setRequestProperty("charset","utf-8");
            con.setRequestProperty("Access-Control-Allow-Origin", "*");

            int responseCode = con.getResponseCode();
            if(responseCode == HttpURLConnection.HTTP_OK) {
                BufferedReader in = new BufferedReader(new InputStreamReader(con.getInputStream()));
                String inputLine;
                StringBuffer response = new StringBuffer();

                while((inputLine = in.readLine()) != null) {
                    response.append(inputLine);
                }
                in.close();
                Gson gson = new Gson();
                MiningJob miningJob = gson.fromJson(response.toString(),MiningJob.class);
                return miningJob;

            }

        }catch (MalformedURLException e) {
            logger.error("malformed url " + e);
        } catch (IOException e) {
            logger.error("IO exception"  + e);
        }
        return null;

    }


    private void postMiningTask(String blockDataHash, int nonce, String blockHash, Date createdDate) {
        String update_mining = nodeEndPoint+ "/" +"mining/submit-mined-block";
        try {

            URL url = new URL(update_mining);
            Map<String, Object> params = new LinkedHashMap<>();
            params.put("blockDataHash", blockDataHash);
            params.put("dateCreated", createdDate);
            params.put("nonce", nonce);
            params.put("blockHash", blockHash);

            Gson gson = new Gson();
            String json = gson.toJson(params);

            byte[] postDataBytes = json.getBytes("UTF-8");
            HttpURLConnection conn = (HttpURLConnection)url.openConnection();

            conn.setRequestMethod("POST");
            conn.setRequestProperty("Access-Control-Allow-Origin", "*");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("Content-Length", String.valueOf(postDataBytes.length));
            conn.setRequestProperty("Accept", "application/json");
            conn.setDoOutput(true);
            conn.getOutputStream().write(postDataBytes);

            BufferedReader in = new BufferedReader(new InputStreamReader(conn.getInputStream(),"UTF-8"));
            StringBuffer response = new StringBuffer();
            String inputLine;
            while((inputLine = in.readLine()) != null) {
                response.append(inputLine);
            }
            in.close();

            logger.info("result: " + response.toString());

        } catch (UnsupportedEncodingException e) {
            logger.error("encoding error " + e);
        } catch (ProtocolException e) {
            logger.error("protocol exception " + e);
        } catch (IOException e) {
            logger.error("IO exception "  + e);
        }

    }











    private void collectFeeMiner(Block newBlock) {
        if(newBlock.getTransactions() != null) {
            List<Transaction> collectFeeTransactionList = new ArrayList<>();
            for (Transaction transaction : newBlock.getTransactions()) {
                Transaction collectFeeTransaction = new Transaction(transaction.from, minerPublicAddress, transaction.fee, 0, new Date().getTime(), "Collect for miner", getMinerPublicKey() );
                collectFeeTransaction.setTransactionDataHash(collectFeeTransaction.getTransactionDataHash());
            }
        }
    }


    private ECKeyPair getMinderKeyPair() {
        BigInteger privatekey = Numeric.toBigInt(minerPrivateKey);
        ECKeyPair keyPair = ECKeyPair.create(privatekey);
        return  keyPair;
    }

    private BigInteger getMinerPublicKey() {
        BigInteger privatekey = Numeric.toBigInt(minerPrivateKey);
        ECKeyPair keyPair = ECKeyPair.create(privatekey);
        return  keyPair.getPublicKey();
    }






}
