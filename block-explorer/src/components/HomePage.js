import React from 'react';
import { Link } from 'react-router';

const HomePage = () => (
  <div className="jumbotron">
    <h1 className="lead">Welcome to block explorer </h1>
    <div className="col-md-4">
      <Link to="block">
        <button className="btn btn-lg btn-primary"> Visit block page</button>
      </Link>

    </div>


    <div className="col-md-4">

          <Link to="transaction">
                  <button className="btn btn-lg btn-primary"> Visit Transaction page</button>
           </Link>

    </div>

     <div className="col-md-4">

           <Link to="address">
                         <button className="btn btn-lg btn-primary"> Visit Address page</button>
            </Link>
        </div>
  </div>
);

export default HomePage;
