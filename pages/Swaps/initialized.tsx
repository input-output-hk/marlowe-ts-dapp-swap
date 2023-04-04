import { Connected } from 'pages/Hooks/Wallet';
import React,  { useEffect } from 'react'

import { Button, Table } from 'semantic-ui-react'

export const InitializedSwaps = ({state }) => {
  

  return (<Table compact celled striped>
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell>Note</Table.HeaderCell>
        <Table.HeaderCell>Addressed to</Table.HeaderCell>
        <Table.HeaderCell>Asked</Table.HeaderCell>
        <Table.HeaderCell>To Provision</Table.HeaderCell>
        <Table.HeaderCell>Deadline</Table.HeaderCell>
        <Table.HeaderCell />
         
      </Table.Row>
    </Table.Header>

    <Table.Body>
      <Table.Row>
        <Table.Cell>Djed Liquidity for DApp X</Table.Cell>
        <Table.Cell>addr_test1qqe34....87eq0td9ja</Table.Cell>
        <Table.Cell>100 Token B</Table.Cell>
        <Table.Cell>15 Token A</Table.Cell>
        <Table.Cell>11 day, 1h, 25 mins</Table.Cell>
        <Table.Cell collapsing>
        <Button.Group>
          <Button>Cancel</Button>
          <Button.Or />
          <Button positive>Provision</Button>
        </Button.Group>
        </Table.Cell>
      </Table.Row>
      <Table.Row>
        <Table.Cell>Djed Liquidity for DApp X</Table.Cell>
        <Table.Cell>addr_test1qqe34....87eq0td9ja</Table.Cell>
        <Table.Cell>100 Djeds </Table.Cell>
        <Table.Cell>25 ₳</Table.Cell>
        <Table.Cell>11 day, 1h, 25 mins</Table.Cell>
        <Table.Cell collapsing>
          <Button.Group>
            <Button>Cancel</Button>
            <Button.Or />
            <Button positive>Provision</Button>
          </Button.Group>
        </Table.Cell>
      </Table.Row>
    </Table.Body>
  </Table>)
}



