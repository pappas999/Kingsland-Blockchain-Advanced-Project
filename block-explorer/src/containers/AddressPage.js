import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';
import '../styles/style.css';

import {
  searchAddressAction, searchTransactionAddressAction
} from '../actions/explorerActions';

import {getAccount, getAccountTransaction} from '../Api/explorer';

export class AddressPage extends Component {
  constructor() {
    super();
    //this.handleBalanceSearch = this.handleBalanceSearch.bind(this);
    this.handleTransactionSearch = this.handleTransactionSearch.bind(this);
  }

  componentDidMount() {
    this.props.dispatch(searchAddressAction('0000000000000000000000000000000000000000'));
  }

  /*handleBalanceSearch(event) {
    event.preventDefault();
    if (this.query !== null) {
      this.props.dispatch(searchAddressAction(this.query.value));
      this.query.value = '';
    }
  }*/


  handleTransactionSearch(event) {
    event.preventDefault();
    if( this.query !== null) {
      this.props.dispatch(searchTransactionAddressAction(this.query.value));
      this.query.value= '';
    }
  }


  render() {
    const { balAccount, tranAccount} = this.props;
    console.log("Account");
    console.log(tranAccount);
    return (
      <div>
      <div className="col-md-6">
        <input
                    type="text"
                    ref={ref => (this.query = ref)}
                  />
                  <input
                    type="submit"
                    className="btn btn-primary"
                    value="Search Transaction Account"
                    onClick={this.handleTransactionSearch}
                  />
          {balAccount ? <div>
               <h6> Transaction at 0</h6>
               <h6> from : {tranAccount[0].from}</h6>
               <h6> To : {tranAccount[0].to}</h6>
               <h6> Transaction DataHash : { tranAccount[0].transactionDataHash }</h6>

          </div>: 'loading....'}
      </div>


       </div>
    );
  }
}


/* <div className="col-md-6">
        <input
                    type="text"
                    ref={ref => (this.query = ref)}
                  />
                  <input
                    type="submit"
                    className="btn btn-primary"
                    value="Search Balance Account"
                    onClick={this.handleBalanceSearch}
                  />
          {balAccount ? <div>
               <h6> Balance Account</h6>
               <h6> Confirmed Balance : {balAccount.confirmedBalance}</h6>
               <h6> Pending Balance : {balAccount.pendingBalance}</h6>
               <h6> Safe Balance : { balAccount.safeBalance }</h6>

          </div>: 'loading....'}
      </div>*/

AddressPage.propTypes = {
  balAccount: PropTypes.object,
  tranAccount: PropTypes.array,
  dispatch: PropTypes.func.isRequired

};

/* Subscribe component to redux store and merge the state into component\s props */
const mapStateToProps = ({ addresses }) => ({
  balAccount: addresses.balAccount,
  tranAccount: addresses.transactionAccount
});

/* connect method from react-router connects the component with redux store */
export default connect(
  mapStateToProps)(AddressPage);
