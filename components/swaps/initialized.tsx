/* eslint-disable react/jsx-key */
import { pipe } from 'fp-ts/lib/function';
import { Connected } from 'components/hooks/Wallet';
import React,  { useEffect, useState } from 'react'
import * as A from 'fp-ts/Array'
import { Button, Icon, Table } from 'semantic-ui-react'
import { unContractId } from 'marlowe-ts-sdk/src/runtime/contract/id';
import { Token, TokenValue } from 'marlowe-ts-sdk/src/language/core/v1/semantics/contract/common/token';
import { MySwap } from './service';
import { formatADAs } from 'components/common/tokens';
import { timeoutToDate } from 'components/common/date';
import {format} from 'date-fns'
import { unPolicyId } from 'marlowe-ts-sdk/src/runtime/common/policyId';

export const InitializedSwaps = ({initializedSwaps,connectedExtension }) => {
  console.log("initializedSwaps",initializedSwaps)
  const connected : Connected = connectedExtension
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
                           href={'http://marlowe.palas87.es:8002/contractView?tab=info&contractId=' + encodeURIComponent(unContractId(swap.contractId))}> 
                           <Icon link name='info circle' /> </a> </Table.Cell>
                      <Table.Cell>{swap.note}</Table.Cell>
                      <Table.Cell>
                       <a target="_blank" 
                           rel="noopener noreferrer" 
                           href={'https://preview.cardanoscan.io/tokenPolicy/' + unPolicyId(swap.rolePolicyId)}>
                            {"\""+swap.request.swapper.roleName+ "\"'"}s Owner
                       </a>      
                     </Table.Cell>
                      <Table.Cell>{displayToken ( swap.request.swapper.value,connected.isMainnnet) }</Table.Cell>
                      <Table.Cell>{displayToken ( swap.request.provider.value,connected.isMainnnet)}</Table.Cell>
                      <Table.Cell>{pipe(timeoutToDate(swap.request.provider.depositTimeout),(date) => format(date,"yyyy-MM-dd'T'hh:mm"))}</Table.Cell>
                      <Table.Cell collapsing>
                      <Button.Group>
                        <Button>Cancel</Button>
                        <Button.Or />
                        <Button positive>Provision</Button>
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
