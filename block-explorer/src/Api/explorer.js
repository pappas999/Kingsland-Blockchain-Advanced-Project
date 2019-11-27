const URL_Host ="http://localhost:5555";


/**
view blocks
/blocks
/blocks/:index


view confirmed transactions
view pending transaction
/transactions/confirmed
/transactions/pending
/transactions/:tranHash

view accounts and balances
/address/:address/balance
/address/:address/transactions


view peers map
/peers
**/


export const getBlocksInfo=() => {
  const BLOCKS_URL = URL_Host + "/blocks";

  return fetch(BLOCKS_URL)
         .then(response => {

          return response.json();
         })


}

export const getBlockDetail = (index) => {
  const BLOCKS_DETAIL_URL = URL_Host + "/blocks" + "/" + index;
  return fetch(BLOCKS_DETAIL_URL)
        .then(response => {
          return response.json();
        })
}



export const getListPendingTransaction = () => {
  const PENDING_TRANSACTION_URL = URL_Host + "/transactions/pending";

  return fetch(PENDING_TRANSACTION_URL)
     .then(response => {
        return response.json();
     });
}


export const getListConfirmedTransaction = () => {
  const CONFIRMED_TRANSACTION_URL = URL_Host + "/transactions/confirmed";
  console.log(CONFIRMED_TRANSACTION_URL);
  return fetch(CONFIRMED_TRANSACTION_URL)
    .then(response => {
      return response.json();
    })
}


export const getTransactionDetail = (transactionHash) => {
  const TRANSACTION_DETAIL_URL = URL_Host + "/transactions" + "/" + transactionHash;

  return fetch(TRANSACTION_DETAIL_URL)
        .then(response => {
          return response.json();
        })
}


export const getAccount = (accountAddress) => {
  const ACCOUNT_BALANCE_URL = URL_Host + "/address/" + accountAddress + "/balance";

  return fetch(ACCOUNT_BALANCE_URL)
    .then(response => {
      return response.json();
    })
}

export const getAccountTransaction = (accountAddress) => {
  const ACCOUNT_TRANSACTION_URL = URL_Host + "/address/" + accountAddress + "/transactions";
  return fetch(ACCOUNT_TRANSACTION_URL)
     .then(response => {
      return response.json();
     })
}

export const getPeersMap = () => {
  const PEER_URL = URL_Host + "/peers";

  return fetch(PEER_URL)
     .then(response => {
        return response.json();
     })

}

