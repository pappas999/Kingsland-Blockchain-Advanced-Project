import React from 'react';
import { Route, IndexRoute } from 'react-router';

import MediaGalleryPage from './containers/MediaGalleryPage';
import BlockPage from './container/BlockPage';
import TransactionPage from './container/TransactionPage';
import AddressPage from '/container/AddressPage';

import App from './containers/App';
import HomePage from './components/HomePage';

export default (
  <Route path="/" component={App}>
    <IndexRoute component={HomePage} />
    <Route path="library" component={MediaGalleryPage} />
    <Route path="block" component={BlockPage}/>
    <Route path="transaction" component={TransactionPage}/>
    <Route path="address" component={AddressPage}/>
   </Route>
);

