import initialState from './initialState';

import * as types from '../constants/actionTypes';

export default function (state = initialState.addresses, action) {
  switch(action.type) {
    case types.SELECTED_ACCOUNT:
        return {...state, balAccount: action.balAccount, transactionAccount: action.transactionAccount}
    default:
      return state;
  }
}
