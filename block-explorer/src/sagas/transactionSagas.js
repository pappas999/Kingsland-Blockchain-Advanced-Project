import {put, call} from 'redux-saga/effects';

import {getListPendingTransaction, getListConfirmedTransaction} from '../Api/explorer';

export function* listTransactionSaga({payload}) {

  try {
     const pendingTransaction = yield call(getListPendingTransaction, payload);
     const confirmedTransaction  = yield call(getListConfirmedTransaction, payload);
     const transactions = [];
     transactions['pending'] = pendingTransaction;
     transactions['confirm'] = confirmedTransaction;

      yield [
        put({type: types.LIST_TRANSACTION, transactions}),
      ]

  } catch (error) {
    yield put({type: 'LIST_TRANSACTION_ERROR', error})
  }

}
