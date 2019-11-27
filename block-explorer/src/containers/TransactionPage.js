import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';

import '../styles/style.css';
import {
   listTransactionAction, searchTransactionAction
} from '../actions/explorerActions';

import {getListConfirmedTransaction, getTransactionDetail,
        getListPendingTransaction} from '../Api/explorer';


export class TransactionPage extends Component {
  constructor() {
    super();
    this.handleSearch = this.handleSearch.bind(this);
  }

  componentDidMount() {
    this.props.dispatch(searchTransactionAction('0'));
  }


  handleSearch(event) {
    event.preventDefault();
    if (this.query !== null) {
      this.props.dispatch(searchTransactionAction(this.query.value));
      this.query.value = '';
    }
  }

  render() {

    const { pendingTransactions, confirmedTransactions, selectedTransaction} = this.props;
    console.log("render")
    console.log(confirmedTransactions);
    return (
     <div className="container-fluid">
        <input
            type="text"
            ref={ref => (this.query = ref)}
          />
          <input
            type="submit"
            className="btn btn-primary"
            value="Search Transaction By Hash"
            onClick={this.handleSearch}
          />

          {confirmedTransactions ? <div>

                <h6> confirmed Transaction {confirmedTransactions[0].transactionDataHash} </h6>
          </div> : 'loading .....'}

      </div>
    );
  }
}

TransactionPage.propTypes = {
  pendingTransactions: PropTypes.array,
  confirmedTransactions: PropTypes.array,
  selectedTransaction: PropTypes.object,
  dispatch: PropTypes.func.isRequired
};

const mapStateToProps = ({ transactions }) => ({
  confirmedTransactions: transactions.confirmedTransactions,
  pendingTransactions: transactions.pendingTransactions

});

export default connect(
  mapStateToProps)(TransactionPage);
