import { combineReducers } from 'redux';
import images from './imageReducer';
import videos from './videoReducer';

import blocks from './blockReducer';
import transactions from './transactionReducer';
import addresses from './addressesReducer';


const rootReducer = combineReducers({
  images,
  videos,
  blocks,
  transactions,
  addresses
});


export default rootReducer;
