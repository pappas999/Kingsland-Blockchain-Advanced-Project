package blockchain.node;

import blockchain.node.Wallet.Wallet;
import blockchain.node.core.Block;
import blockchain.node.core.Transaction;
import blockchain.node.core.TransactionOutput;
import blockchain.node.util.CryptoUtil;
import com.google.gson.GsonBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.security.Security;
import java.util.ArrayList;
import java.util.HashMap;

@SpringBootApplication
public class NodeApplication implements CommandLineRunner {
	private static final Logger logger = LoggerFactory.getLogger(NodeApplication.class);

	public static ArrayList<Block> blockchain = new ArrayList<>();

	public static int difficult = 1;

	public static HashMap<String, TransactionOutput> UTXOs = new HashMap<>();

	public static float minimumTransaction =0.1f;

	public static Transaction genesisTransaction;




	public static void main(String[] args) {
		SpringApplication.run(NodeApplication.class, args);
	}

	@Override
	public void run(String... args) throws Exception {
		try{
			Security.addProvider(new org.bouncycastle.jce.provider.BouncyCastleProvider());

			Wallet wallet = new Wallet();
			Wallet wallet1 = new Wallet();

			Wallet walletA = new Wallet();
			Wallet walletB = new Wallet();
			Wallet coinbase = new Wallet();

			System.out.println("private and public key" + CryptoUtil.getStringFromKey(wallet.privateKey) + " - " + CryptoUtil.getStringFromKey(wallet.publicKey));

			Transaction transaction = new Transaction(wallet.publicKey, wallet1.publicKey, 5 , null);

			transaction.generateSignature(wallet.privateKey);

			System.out.println(("is signature verified" + transaction.verifySignature()));

			//runWithFewBlock();


			genesisTransaction = new Transaction(coinbase.publicKey, walletA.publicKey, 100f, null);
			genesisTransaction.generateSignature(coinbase.privateKey);	 //manually sign the genesis transaction
			genesisTransaction.transactionId = "0"; //manually set the transaction id
			genesisTransaction.outputs.add(new TransactionOutput(genesisTransaction.reciepient, genesisTransaction.value, genesisTransaction.transactionId)); //manually add the Transactions Output
			UTXOs.put(genesisTransaction.outputs.get(0).id, genesisTransaction.outputs.get(0)); //its important to store our first transaction in the UTXOs list.

			System.out.println("Creating and Mining Genesis block... ");
			Block genesis = new Block("0");
			genesis.addTransaction(genesisTransaction);
			addBlock(genesis);

			//testing
			Block block1 = new Block(genesis.hash);
			System.out.println("\nWalletA's balance is: " + walletA.getBalance());
			System.out.println("\nWalletA is Attempting to send funds (40) to WalletB...");
			block1.addTransaction(walletA.sendFunds(walletB.publicKey, 40f));
			addBlock(block1);
			System.out.println("\nWalletA's balance is: " + walletA.getBalance());
			System.out.println("WalletB's balance is: " + walletB.getBalance());

			Block block2 = new Block(block1.hash);
			System.out.println("\nWalletA Attempting to send more funds (1000) than it has...");
			block2.addTransaction(walletA.sendFunds(walletB.publicKey, 1000f));
			addBlock(block2);
			System.out.println("\nWalletA's balance is: " + walletA.getBalance());
			System.out.println("WalletB's balance is: " + walletB.getBalance());

			Block block3 = new Block(block2.hash);
			System.out.println("\nWalletB is Attempting to send funds (20) to WalletA...");
			block3.addTransaction(walletB.sendFunds( walletA.publicKey, 20));
			System.out.println("\nWalletA's balance is: " + walletA.getBalance());
			System.out.println("WalletB's balance is: " + walletB.getBalance());

			//isChainValid();

			/*Block genesisBlock = new Block( "0");
			System.out.println("hash first block" + genesisBlock.hash);
			blockchain.add(genesisBlock);
			blockchain.get(0).mineBlock(difficult);

			Block secondBlock = new Block(genesisBlock.getHash());
			System.out.println("second block" + secondBlock.getHash());
			blockchain.add(secondBlock);
			blockchain.get(1).mineBlock(difficult);

			Block thirdBlock = new Block(secondBlock.getHash());
			blockchain.add(thirdBlock);
			blockchain.get(2).mineBlock(difficult);

			System.out.println("third block: " + thirdBlock.getHash());


			System.out.println(blockchainJson);*/

			String blockchainJson = new GsonBuilder().setPrettyPrinting().create().toJson(blockchain);
			System.out.println(blockchainJson);

			if(isValidChain()) {
				System.out.println("Chain is correct");
			} else {
				System.out.println("Invalid chain");
			};
		} catch (Exception e) {
			logger.error("throw at main class" + e);
		}
	}

	public static void runWithFewBlock() {
		Block genesisBlock = new Block( "0");
		System.out.println("hash first block" + genesisBlock.hash);
		blockchain.add(genesisBlock);
		blockchain.get(0).mineBlock(difficult);

		Block secondBlock = new Block(genesisBlock.getHash());
		System.out.println("second block" + secondBlock.getHash());
		blockchain.add(secondBlock);
		blockchain.get(1).mineBlock(difficult);

		Block thirdBlock = new Block(secondBlock.getHash());
		blockchain.add(thirdBlock);
		blockchain.get(2).mineBlock(difficult);

		System.out.println("third block: " + thirdBlock.getHash());

		String blockchainJson = new GsonBuilder().setPrettyPrinting().create().toJson(blockchain);
		System.out.println(blockchainJson);
	}


	public static Boolean isValidChain() {
		Block currentBlock;
		Block previousBlock;

		String hashTarget = new String(new char[difficult]).replace('\0','0');

		for(int i = 1; i < blockchain.size(); i++) {
			currentBlock = blockchain.get(i);
			previousBlock = blockchain.get(i-1);

			if(! currentBlock.hash.equals(currentBlock.calculateHash())) {
				System.out.println("current hash is not equal" + i);
				return false;
			}

			if(! previousBlock.hash.equals(currentBlock.previousHash)) {
				System.out.println("Current block " + i + " is not equal to previous block" + (i -1));
				return false;
			}

			if(! currentBlock.hash.substring(0, difficult).equals(hashTarget)) {
				System.out.println("this block hasn't been mined");
				return false;
			}
		}
		return true;
	}

	public static void addBlock(Block newBlock) {
		newBlock.mineBlock(difficult);
		blockchain.add(newBlock);
	}



}
