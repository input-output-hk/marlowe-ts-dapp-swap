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
import { Connected, WalletState, useWalletState } from '../Hooks/Wallet'

const loremIpsum = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'

const panes = (walletState : WalletState) => 
  {switch (walletState.type) {
    case 'disconnected' : return [{
      menuItem: <Menu.Item key='About'>About</Menu.Item>,
      render: () => <p> {loremIpsum}</p>,}]
    case 'connecting'   : return [{
      menuItem: <Menu.Item key='About'>About</Menu.Item>,
      render: () => <p> {loremIpsum}</p>,}]
    case 'connected'    : 
     return [
      {
        menuItem: <Menu.Item key='About'>About</Menu.Item>,
        render: () => <p> {loremIpsum}</p>},
      {
        menuItem: <Menu.Item key='new'><Icon name='add circle' color='grey' size='large' /> New  </Menu.Item>,
        render: () => <NewSwap state={walletState}/>,
      },
      {
        menuItem: <Menu.Item key='pending'>Pending<Label>2</Label></Menu.Item>,
        render: () => <PendingSwaps/>,
      },
      {
        menuItem: <Menu.Item key='requested'>Requested<Label>3</Label></Menu.Item>,
        render: () => <RequestedSwaps />,
      },
    ]}}

export const SwapTabs = () => { 
  const walletState = useWalletState();
  console.log("there", walletState)
  return (<div>
            <Tab panes={panes(walletState)} />
          </div>)
  
} 

