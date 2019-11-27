import {put, call} from 'redux-saga/effects';

import * as types from '../constants/actionTypes';
import {getAccount, getAccountTransaction
       } from '../Api/explorer';

export default function* searchAccountSaga({payload}) {
  try {
    const balAccount = yield call(getAccount,payload);
    const transactionAccount = yield call(getAccountTransaction, payload);



     yield  put({type: types.SELECTED_ACCOUNT, balAccount: balAccount, transactionAccount: transactionAccount})


  } catch(error) {
     yield put({type: 'SEARCH_ACCOUNT_ERROR', error});
  }

}
