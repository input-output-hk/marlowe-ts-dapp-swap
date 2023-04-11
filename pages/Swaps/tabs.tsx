import React,  { Component, useContext, useEffect, useReducer, useState } from 'react'
import { Container, Dropdown, Icon, Input, Label, Loader, Menu } from 'semantic-ui-react'
import  Logo  from './marlowe-logo.svg'
import * as A from 'fp-ts/Array'
import * as T from 'fp-ts/Task'
import * as O from 'fp-ts/Option'
import { CardanoWallet, WalletContext, useLovelace, useNetwork, useWallet, useWalletList,  } from '@meshsdk/react'

import { Button, Checkbox, Table } from 'semantic-ui-react'
import { Segment, Tab } from 'semantic-ui-react'
import { PendingSwaps } from './pending'
import { NewSwap } from './new'
import { RequestedSwaps } from './requested'

const panes = [
  {
    menuItem: <Menu.Item key='pending'>Pending<Label>2</Label></Menu.Item>,
    render: () => <PendingSwaps/>,
  },
  {
    menuItem: <Menu.Item key='requested'>Requested<Label>3</Label></Menu.Item>,
    render: () => <RequestedSwaps />,
  },
  {
    menuItem: <Menu.Item key='new'><Icon name='add circle' color='grey' size='large' /> New </Menu.Item>,
    render: () => <NewSwap/>,
  },
]

export class SwapTabs extends Component {
  state = {}

  handleChange = (e, data) => this.setState(data)

  render() {
    return (
      <div>
        <Tab panes={panes} onTabChange={this.handleChange} />
      </div>
    )
  }
}
