import React,  { Component, useContext, useEffect, useReducer, useState } from 'react'
import { Container, Dropdown, Icon, Input, Label, Loader, Menu } from 'semantic-ui-react'
import  Logo  from './marlowe-logo.svg'
import * as A from 'fp-ts/Array'
import * as T from 'fp-ts/Task'
import * as O from 'fp-ts/Option'
import { CardanoWallet, WalletContext, useLovelace, useNetwork, useWallet, useWalletList,  } from '@meshsdk/react'

import { Button, Checkbox, Table } from 'semantic-ui-react'
import { Segment, Tab } from 'semantic-ui-react'

export const ProvisionnedSwaps = () => (
  <Table compact celled striped>
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell>Note</Table.HeaderCell>
        <Table.HeaderCell>Addressed to</Table.HeaderCell>
        <Table.HeaderCell>Deal</Table.HeaderCell>
        <Table.HeaderCell>Deadline</Table.HeaderCell>
        <Table.HeaderCell>Fees</Table.HeaderCell>
        <Table.HeaderCell />
         
      </Table.Row>
    </Table.Header>

    <Table.Body>
      <Table.Row>
        <Table.Cell>Djed Liquidity for DApp X</Table.Cell>
        <Table.Cell>addr_test1qqe34....87eq0td9ja</Table.Cell>
        <Table.Cell>100 Djeds for 265,5 ₳</Table.Cell>
        <Table.Cell>11 day, 1h, 25 mins</Table.Cell>
        <Table.Cell>15 ₳</Table.Cell>
        <Table.Cell collapsing>
          <Button icon='cancel' size='tiny' content='Cancel' />
        </Table.Cell>
      </Table.Row>
      <Table.Row>
        <Table.Cell>Djed Liquidity for DApp X</Table.Cell>
        <Table.Cell>addr_test1qqe34....87eq0td9ja</Table.Cell>
        <Table.Cell>100 Djeds for 265,5 ₳</Table.Cell>
        <Table.Cell>11 day, 1h, 25 mins</Table.Cell>
        <Table.Cell>15 ₳</Table.Cell>
        <Table.Cell collapsing>
          <Button icon='cancel' size='tiny' content='Cancel' />
        </Table.Cell>
      </Table.Row>
    </Table.Body>
  </Table>
)



