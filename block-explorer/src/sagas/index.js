import { fork } from 'redux-saga/effects';
import {watchSearchMedia, watchSearchBlock, watchSearchTransaction }from './watchers';


export default function* startForman() {
  yield [
       fork(watchSearchMedia),
       fork(watchSearchBlock),
       fork(watchSearchTransaction)
   ]
}
