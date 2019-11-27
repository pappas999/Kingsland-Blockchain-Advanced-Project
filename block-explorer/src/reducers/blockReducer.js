import initialState from './initialState';

import * as types from '../constants/actionTypes';

export default function ( state = initialState.blocks, action) {
   switch (action.type) {
     case types.LIST_BLOCK:
         console.log(types.LIST_BLOCK);
        console.log([...state, action.blocks]);
       return [...state, action.blocks]
     case types.SELECTED_BLOCK:
       return {...state, selectedBlock: action.block};
     default:
        return state;
   }
}
