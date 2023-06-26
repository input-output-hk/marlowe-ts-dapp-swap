/* eslint-disable react/jsx-key */
import { pipe } from 'fp-ts/lib/function';
import { Connected } from 'Components/Hooks/Wallet';
import React,  { useEffect, useState } from 'react'
import * as A from 'fp-ts/Array'
import { Button, Icon, Table } from 'semantic-ui-react'
import { unContractId } from 'marlowe-ts-sdk/src/runtime/contract/id';
import { format } from 'marlowe-ts-sdk/src/adapter/wallet/ada';
import { Token, ada } from 'marlowe-ts-sdk/src/language/core/v1/semantics/contract/common/token';
import { InitializedSwap } from './service';


export const InitializedSwaps = ({initializedSwaps }) => {
  console.log("initializedSwaps",initializedSwaps)
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
      {(initializedSwaps as  InitializedSwap[]).map(initializedSwap => 
                  (<Table.Row key={unContractId(initializedSwap.contractId)}>
                      <Table.Cell><a target="_blank" rel="noopener noreferrer" href={'http://marlowe.palas87.es:8002/contractView?tab=info&contractId=' + encodeURIComponent(unContractId(initializedSwap.contractId))}> <Icon link name='info circle' /> </a> </Table.Cell>
                      <Table.Cell>{initializedSwap.swap.note}</Table.Cell>
                      <Table.Cell>addr_test1qqe34....87eq0td9ja</Table.Cell>
                      <Table.Cell>{displayToken ( initializedSwap.swap.b.amount ,initializedSwap.swap.b.token) }</Table.Cell>
                      <Table.Cell>{displayToken ( initializedSwap.swap.self.amount, initializedSwap.swap.self.token)}</Table.Cell>
                      <Table.Cell>11 day, 1h, 25 mins</Table.Cell>
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


const displayToken = (amount:bigint, token: Token) : string => {
    if (token.currency_symbol === "lovelace") return format(amount).valueOf()
    else { return amount + ' ' + token.token_name }
}
