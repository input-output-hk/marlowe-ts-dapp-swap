import React,  {  } from 'react'
import { Icon } from 'semantic-ui-react'

import { Button, Table } from 'semantic-ui-react'
import { Connected } from 'components/hooks/Wallet.js'
import { MySwap } from './service.js'

import { timeoutToDate } from 'components/common/date.js'
import { pipe } from 'fp-ts/lib/function.js'
import format from 'date-fns/format'
import { TokenValue } from '@marlowe.tmp/language-core-v1/tokenValue'
import { formatADAs } from 'components/common/tokens.js'
import { unPolicyId } from '@marlowe.tmp/legacy-runtime/common/policyId'
import { unContractId } from '@marlowe.tmp/legacy-runtime/contract/id'



export const RequestedSwaps = ({requestedSwaps,connectedExtension }) => {
  console.log("RequestedSwaps",requestedSwaps)
  const {isMainnnet,swapServices} : Connected = connectedExtension
  return (<Table compact celled striped>
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell/>
        <Table.HeaderCell>Note</Table.HeaderCell>
        <Table.HeaderCell>Coming from</Table.HeaderCell>
        <Table.HeaderCell>Provisionned</Table.HeaderCell>
        <Table.HeaderCell>Asked</Table.HeaderCell>
        <Table.HeaderCell>Deadline</Table.HeaderCell>
        <Table.HeaderCell />
         
      </Table.Row>
    </Table.Header>

    <Table.Body>
      {(requestedSwaps as  MySwap[]).map(swap => 
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
                      <Table.Cell>{displayToken ( swap.request.provider.value,isMainnnet)}</Table.Cell>
                      <Table.Cell>{displayToken ( swap.request.swapper.value,isMainnnet) }</Table.Cell>
                      <Table.Cell>{pipe(timeoutToDate(swap.request.swapper.depositTimeout),(date) => format(date,"yyyy-MM-dd'T'hh:mm"))}</Table.Cell>
                      <Table.Cell collapsing>
                      <Button.Group>
                        <Button>Cancel</Button>
                        <Button.Or />
                        <Button positive onClick={swapServices.provision(swap)}>Swap</Button>
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

