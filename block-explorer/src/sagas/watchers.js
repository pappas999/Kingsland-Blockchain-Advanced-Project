import { takeLatest } from 'redux-saga/effects';
import searchMediaSaga from './mediaSagas';

import searchBlockSaga from './blockSagas';
import * as types from '../constants/actionTypes';

export  function* watchSearchMedia() {
  yield takeLatest(types.SEARCH_MEDIA_REQUEST, searchMediaSaga);
}


export  function* watchSearchBlock() {
  yield takeLatest(types.SEARCH_BLOCK_REQUEST, searchBlockSaga);
}

export function* watchListTransaction(){
  yield takeLatest(types.LIST_TRANSACTION, listBlock)
}

