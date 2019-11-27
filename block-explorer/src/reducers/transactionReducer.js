import initialState from './initialState';

import * as types from '../constants/actionTypes';

export default function (state = [initialState.confirmedTransactions, initialState.pendingTransactions], action) {
  switch(action.type) {
    case types.LIST_TRANSACTION:
      console.log(types.LIST_TRANSACTION);
      console.log(action);
       console.log([...state,action.confirmedTransactions]);
      return {...state,confirmedTransactions: action.confirmedTransactions, pendingTransactions: action.pendingTransactions}
    case types.SELECTED_TRANSACTION:
      return { ...state, selectedTransaction: action.selectedTransaction}
    default:
      return state;
  }
}
