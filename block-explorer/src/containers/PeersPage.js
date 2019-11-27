import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';
import '../styles/style.css';

import {getPeersMap} from '../Api/explorer';

export class PeersPage extends Component {
  constructor() {
    super();
  }

  componentDidMount() {
    getPeersMap().then(peers => this.props.peers = peers);
    console.log("peer");
    console.log(this.props.peers);
  }

  render() {
      return (
      <div> Peers
      </div>
      );
    }

}

PeersPage.propsTypes = {
  peers: PropTypes.array
}


export default connect()(PeersPage);


