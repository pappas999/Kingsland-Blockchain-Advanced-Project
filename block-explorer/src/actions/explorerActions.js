import * as types from '../constants/actionTypes';

export const selectBlockAction = (blockIndex) => ({
  type: types.SELECTED_BLOCK,
  blockIndex
})


export const searchBlockAction = (payload) => ({
  type: types.SEARCH_BLOCK_REQUEST,
  payload
})

export const listBlockAction =(payload) =>({
  type: types.LIST_BLOCK,
  payload
})






export const listTransactionAction =(payload) =>({
  type: types.LIST_TRANSACTION,
  payload
})



export const searchAddressAction = (payload) => ({
  type: types.SEARCH_ADDRESS_REQUEST,
  payload
})


export const searchTransactionAddressAction = (payload) => ({
  type: types.SEARCH_TRANSACTION_ADDRESS_REQUEST,
  payload
})


export const listPeerAction = (payload) => ({
  type: types.LIST_PEER_REQUEST,
  payload
})
