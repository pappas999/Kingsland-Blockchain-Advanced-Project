import { fork } from 'redux-saga/effects';
import {watchSearchMedia, watchSearchBlock }from './watchers';


export default function* startForman() {
  yield [
       fork(watchSearchMedia),
       fork(watchSearchBlock)
   ]
}
