import initialState from './initialState';

import * as types from '../constants/actionTypes';

export default function (state = initialState.transactions, action) {
  switch(action.type) {
    case types.LIST_TRANSACTION:
      return [...state, action.transactions]
    default:
      return state;
  }
}
