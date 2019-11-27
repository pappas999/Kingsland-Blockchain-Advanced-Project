import { takeLatest } from 'redux-saga/effects';
import searchMediaSaga from './mediaSagas';

import searchBlockSaga from './blockSagas';

import searchTransactionSaga from './transactionSagas';

import * as types from '../constants/actionTypes';

export  function* watchSearchMedia() {
  yield takeLatest(types.SEARCH_MEDIA_REQUEST, searchMediaSaga);
}


export  function* watchSearchBlock() {
  yield takeLatest(types.SEARCH_BLOCK_REQUEST, searchBlockSaga);
}

export function* watchSearchTransaction(){
  yield takeLatest(types.SEARCH_TRANSACTION_REQUEST, searchTransactionSaga);
}

