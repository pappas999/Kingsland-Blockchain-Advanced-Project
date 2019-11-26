import React from 'react';
import { Route, IndexRoute } from 'react-router';

import MediaGalleryPage from './containers/MediaGalleryPage';
import BlockPage from './containers/BlockPage';
import TransactionPage from './containers/TransactionPage';
import AddressPage from './containers/AddressPage';
import PeerPage from './containers/PeerPage';

import App from './containers/App';
import HomePage from './components/HomePage';

export default (
  <Route path="/" component={App}>
    <IndexRoute component={HomePage} />
    <Route path="block" component={BlockPage}/>
    <Route path="transaction" component={TransactionPage}/>
    <Route path="address" component={AddressPage}/>
    <Route path="peer" component={PeerPage}/>
   </Route>
);

