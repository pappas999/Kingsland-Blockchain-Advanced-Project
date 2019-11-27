import initialState from './initialState';

import * as types from '../constants/actionTypes';

export default function (state = initialState.addresses, action) {
  switch(action.type) {
    case types.LIST_ADDRESS:
        return [...state, action.addresses]
    case types.SEARCH_TRANSACTION_ADDRESS:
        return {...state, selectedAddress: action.address};
    case types.SEARCH_BALANCE_SEARCH_ADDRESS_REQUEST:
        return {...state, selectedAddress: action.address};
    default:
      return state;
  }
}
