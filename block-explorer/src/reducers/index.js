import { combineReducers } from 'redux';

import blocks from './blockReducer';
import transactions from './transactionReducer';
import addresses from './addressReducer';


const rootReducer = combineReducers({
  blocks,
  transactions,
  addresses
});


export default rootReducer;
