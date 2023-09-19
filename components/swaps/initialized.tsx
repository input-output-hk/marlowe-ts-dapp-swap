/* eslint-disable react/jsx-key */
import { pipe } from 'fp-ts/lib/function.js';
import { Connected } from 'components/hooks/Wallet.js';
import React,  {  } from 'react'
import { Button, Icon, Table } from 'semantic-ui-react'
import { unContractId } from '@marlowe.tmp/legacy-runtime/contract/id';
import { MySwap } from './service.js';
import { formatADAs } from 'components/common/tokens.js';
import { timeoutToDate } from 'components/common/date.js';
import {format} from 'date-fns'
// import { unPolicyId } from '@marlowe.tmp/legacy-runtime/common/';
import { TokenValue } from '@marlowe.tmp/language-core-v1/tokenValue';
import { unPolicyId } from '@marlowe.tmp/legacy-runtime/common/policyId';




export const InitializedSwaps = ({initializedSwaps,connectedExtension }) => {
  console.log("initializedSwaps",initializedSwaps)
  unPolicyId
  const {isMainnnet,swapServices} : Connected = connectedExtension
  return (<Table compact celled striped>
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell/>
        <Table.HeaderCell>Note</Table.HeaderCell>
        <Table.HeaderCell>Addressed to</Table.HeaderCell>
        <Table.HeaderCell>Asked</Table.HeaderCell>
        <Table.HeaderCell>To Provision</Table.HeaderCell>
        <Table.HeaderCell>Deadline</Table.HeaderCell>
        <Table.HeaderCell />
         
      </Table.Row>
    </Table.Header>

    <Table.Body>
      {(initializedSwaps as  MySwap[]).map(swap => 
                  (<Table.Row key={unContractId(swap.contractId)}>
                      <Table.Cell>
                        <a target="_blank" 
                           rel="noopener noreferrer" 
                           href={'https://preprod.marlowescan.com/contractView?tab=info&contractId=' + encodeURIComponent(unContractId(swap.contractId))}> 
                           <Icon link name='info circle' /> </a> </Table.Cell>
                      <Table.Cell>{swap.note}</Table.Cell>
                      <Table.Cell>
                       <a target="_blank" 
                           rel="noopener noreferrer" 
                           href={'https://preprod.cardanoscan.io/tokenPolicy/' + unPolicyId(swap.rolePolicyId)}>
                            {"\""+swap.request.swapper.roleName+ "\"'"}s Owner
                       </a>      
                     </Table.Cell>
                      <Table.Cell>{displayToken ( swap.request.swapper.value,isMainnnet) }</Table.Cell>
                      <Table.Cell>{displayToken ( swap.request.provider.value,isMainnnet)}</Table.Cell>
                      <Table.Cell>{pipe(timeoutToDate(swap.request.provider.depositTimeout),(date) => format(date,"yyyy-MM-dd'T'hh:mm"))}</Table.Cell>
                      <Table.Cell collapsing>
                      <Button.Group>
                        <Button>Cancel</Button>
                        <Button.Or />
                        <Button positive onClick={swapServices.provision(swap)}>Provision</Button>
                      </Button.Group>
                      </Table.Cell>
                </Table.Row>)
           )}
    </Table.Body>
  </Table>)
}


const displayToken = (tokenValue: TokenValue,isMainnnet : Boolean) : string => {
    if (tokenValue.token.currency_symbol === '') 
    {
      let [adas,lovelaces,currency] = formatADAs (tokenValue.amount,isMainnnet)
      return adas + '.' + lovelaces + ' ' + currency
    }  
    else { return tokenValue.amount + ' ' + tokenValue.token.token_name }
}
