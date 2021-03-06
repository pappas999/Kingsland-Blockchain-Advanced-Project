import React from 'react';
import { Link, IndexLink } from 'react-router';

const Header = () => (
  <div className="text-center">
    <nav className="navbar navbar-default">
      <IndexLink to="/" activeClassName="active">Home</IndexLink>
      {" | "}
      <Link to="block" activeClassName="active">Block</Link>
      {" | "}
      <Link to="transaction" activeClassName="active">Transaction</Link>
       {" | "}
     <Link to="address" activeClassName="active">Address</Link>
     {" | "}
    <Link to="peer" activeClassName="active">Peer</Link>
    </nav>
  </div>
);

export default Header;
