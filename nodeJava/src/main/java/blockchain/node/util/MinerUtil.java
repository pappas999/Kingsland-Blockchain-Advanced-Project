package blockchain.node.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.web3j.crypto.CipherException;
import org.web3j.crypto.Credentials;
import org.web3j.crypto.WalletUtils;

import java.io.File;
import java.io.IOException;

@Component
public class MinerUtil {

    private static final Logger logger = LoggerFactory.getLogger(MinerUtil.class);

    private static volatile Credentials minerWallet;

    private MinerUtil() {

    }

    private static String minerWalletPassword;

    private static String minerJsonKey;


    public static synchronized Credentials getTxRelay() {
        if (minerWallet == null) {
            synchronized (MinerUtil.class) {
                if ( null == minerWallet) {
                    try {
                        //URL url = URL.class.getResource("/" + txRelayKey + ".json");
                        //  URL url = URL.class.getResource("/files/OperationAdmin.json");
                        logger.info("tx relayer" + minerJsonKey);
                        File file = new File("src//main//resources//files//" + minerJsonKey + ".json");

                        logger.info("tx relay file" + file.getPath());


                        minerWallet = WalletUtils.loadCredentials(minerJsonKey, file.getPath());
                        logger.info("load tx Relayer successfully" + minerWallet.getAddress());

                    } catch (IOException e) {
                        logger.error("Failed to load txRelay " + minerJsonKey + "error " + e);
                    } catch (CipherException e) {
                        logger.error("Cipher Exception failed to load txRelay key" + minerJsonKey + " error" + e);
                    } catch (Exception e) {
                        logger.error("get Tx Relay failed at url " + e );
                    }
                }
            }
        }
        return  minerWallet;
    }




}
