import React,  {  } from 'react'

import { Button, Table } from 'semantic-ui-react'

export const ClosedSwaps = () => (
  <Table compact celled striped>
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell>Coming from</Table.HeaderCell>
        <Table.HeaderCell>Note</Table.HeaderCell>
        <Table.HeaderCell>Deal</Table.HeaderCell>
        <Table.HeaderCell>Deadline</Table.HeaderCell>
        <Table.HeaderCell>Fees</Table.HeaderCell>
        <Table.HeaderCell />
         
      </Table.Row>
    </Table.Header>

    <Table.Body>
      <Table.Row>
        <Table.Cell>addr_test1qqe34....87eq0td9ja</Table.Cell>
        <Table.Cell>Djed Liquidity for DApp X</Table.Cell>
        <Table.Cell>100 Djeds for 265,5 ₳</Table.Cell>
        <Table.Cell>11 day, 1h, 25 mins</Table.Cell>
        <Table.Cell>15 ₳</Table.Cell>
        <Table.Cell collapsing>
          <Button icon='dollar sign' size='tiny' content='swap' />
        </Table.Cell>
      </Table.Row>
      <Table.Row>
        <Table.Cell>addr_test1qqe34....87eq0xxxx</Table.Cell>
        <Table.Cell>Djed Liquidity for DApp X</Table.Cell>
        <Table.Cell>265,5₳  for 100 Djeds</Table.Cell>
        <Table.Cell>11 day, 1h, 25 mins</Table.Cell>
        <Table.Cell>15 ₳</Table.Cell>
        <Table.Cell collapsing>
          <Button icon='dollar sign' size='tiny' content='swap' />
        </Table.Cell>
      </Table.Row>
    </Table.Body>
  </Table>
)



