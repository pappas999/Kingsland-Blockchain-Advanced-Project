import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';

import '../styles/style.css';

import {
  selectBlockAction, searchBlockAction, listBlockAction
} from '../actions/explorerActions';

import {getBlocksInfo, getBlockDetail} from '../Api/explorer';

import ListBlockPage from '../components/ListBlockPage';

export class BlockPage extends Component {
  constructor() {
    super();
    this.handleSearch = this.handleSearch.bind(this);
    this.handleSelectBlock = this.handleSelectBlock.bind(this);
  }

  componentDidMount() {
    this.props.dispatch(searchBlockAction('0'));
  }

  handleSelectBlock(selectedBlock) {
    this.props.dispatch(selectBlockAction(selectedBlock));
  }

  handleSearch(event) {
    event.preventDefault();
    if (this.query !== null) {
      this.props.dispatch(searchBlockAction(this.query.value));
      this.query.value = '';
    }
  }

  render() {

    const { blocks, selectedBlock} = this.props;
    console.log('daata')
    console.log(blocks);
    console.log(selectedBlock);


    return(
    <div lassName="container-fluid">
         <input
            type="text"
            ref={ref => (this.query = ref)}
          />
          <input
            type="submit"
            className="btn btn-primary"
            value="Search Block"
            onClick={this.handleSearch}
          />

         {blocks && selectedBlock ? <div>
         <div  className="col-md-6">
            <h6> testing </h6>

            <table >
            	<tbody>
            		<tr>
            		   {blocks.map((value,index) => {
                                   return <tr>
                                          			<td> {value.index}</td>
                                          			<td> {value.blockDataHash}</td>
                                          			<td>{value.blockHash} </td>
                                          			<td> {value.dateCreated}</td>
                                          			<td> {value.minedBy}</td>
                                          			<td> {value.nonce}</td>
                                          		</tr>

                                 })}
            		</tr>
            	</tbody>
            </table>

         </div>

            </div> : 'loading ....'}
     </div>
     );

  }
}

BlockPage.propTypes = {
  blocks: PropTypes.array,
  selectedBlock: PropTypes.object,
  dispatch: PropTypes.func.isRequired
};

/* Subscribe component to redux store and merge the state into component\s props */
const mapStateToProps = ({ blocks }) => ({
  blocks: blocks[0],
  selectedBlock: blocks.selectedBlock
});

/* connect method from react-router connects the component with redux store */
export default connect(
  mapStateToProps)(BlockPage);
