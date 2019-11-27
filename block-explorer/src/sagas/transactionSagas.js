import {put, call} from 'redux-saga/effects';

import {getListPendingTransaction,
      getListConfirmedTransaction,
      getTransactionDetail } from '../Api/explorer';
      import * as types from '../constants/actionTypes';

export default function* searchTransactionSaga({payload}) {

  try {
     const selectedTransaction = yield call(getTransactionDetail, payload);
     const pendingTransactions = yield call(getListPendingTransaction,payload);
      const confirmedTransactions  = yield call(getListConfirmedTransaction,payload);

      console.log("pending transaction");
      console.log(confirmedTransactions);


     yield [
      put({type: types.LIST_TRANSACTION, confirmedTransactions: confirmedTransactions}),
      put({type: types.SELECTED_TRANSACTION, selectedTransaction: selectedTransaction })
     ]

  } catch (error) {
       yield put({type: 'SEARCH_TRANSACTION_ERROR', error});
  }

}
