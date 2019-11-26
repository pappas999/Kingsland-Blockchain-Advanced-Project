import {put, call} from 'redux-saga/effects';

import {getBlocksInfo, getBlockDetail} from '../Api/explorer';


import * as types from '../constants/actionTypes';


export default function* searchBlockSaga({payload}) {

  try {
    const blocks = yield call(getBlocksInfo, payload);

    yield [
      put({type: types.LIST_BLOCK, blocks}),
      put({type: types.SELECTED_BLOCK, block: blocks[0]})
    ]

  } catch ( error) {
    yield put({type: 'SEARCH_BLOCK_ERROR', error});
  }
}
