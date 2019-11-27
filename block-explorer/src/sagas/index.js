import { fork } from 'redux-saga/effects';
import {watchSearchMedia,
watchSearchBlock,
watchSearchTransaction,
watchSearchAddress }from './watchers';


export default function* startForman() {
  yield [
       fork(watchSearchMedia),
       fork(watchSearchBlock),
       fork(watchSearchTransaction),
       fork(watchSearchAddress)
   ]
}
