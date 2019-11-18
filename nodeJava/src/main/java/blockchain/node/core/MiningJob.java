package blockchain.node.core;

public class MiningJob {
    private String index;

    private int transactionsIncluded;

    private int difficulty;

    private float expectedReward;

    private String rewardAddress;

    private String blockDataHash;

    public String getIndex() {
        return index;
    }

    public MiningJob setIndex(String index) {
        this.index = index;
        return this;
    }

    public int getTransactionsIncluded() {
        return transactionsIncluded;
    }

    public MiningJob setTransactionsIncluded(int transactionsIncluded) {
        this.transactionsIncluded = transactionsIncluded;
        return this;
    }

    public int getDifficulty() {
        return difficulty;
    }

    public MiningJob setDifficulty(int difficulty) {
        this.difficulty = difficulty;
        return this;
    }

    public float getExpectedReward() {
        return expectedReward;
    }

    public MiningJob setExpectedReward(float expectedReward) {
        this.expectedReward = expectedReward;
        return this;
    }

    public String getRewardAddress() {
        return rewardAddress;
    }

    public MiningJob setRewardAddress(String rewardAddress) {
        this.rewardAddress = rewardAddress;
        return this;
    }

    public String getBlockDataHash() {
        return blockDataHash;
    }

    public MiningJob setBlockDataHash(String blockDataHash) {
        this.blockDataHash = blockDataHash;
        return this;
    }
}
