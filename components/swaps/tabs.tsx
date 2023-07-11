import React,  { Component, useCallback, useContext, useEffect, useReducer, useState } from 'react'
import { Container, Dropdown, Icon, Input, Label, Loader, Menu } from 'semantic-ui-react'
import  Logo  from './marlowe-logo.svg'
import * as A from 'fp-ts/Array'
import * as T from 'fp-ts/Task'
import * as O from 'fp-ts/Option'
import * as E from 'fp-ts/Either'
import { CardanoWallet, WalletContext, useLovelace, useNetwork, useWallet, useWalletList,  } from '@meshsdk/react'
import * as TE from 'fp-ts/TaskEither'
import { Button, Checkbox, Table } from 'semantic-ui-react'
import { Segment, Tab } from 'semantic-ui-react'
import { ProvisionnedSwaps } from './provisionned'
import { NewSwap } from './new'
import { RequestedSwaps } from './requested'
import { Connected, useWalletState } from '../hooks/Wallet'
import { InitializedSwaps } from './initialized'
import { constVoid, pipe } from 'fp-ts/lib/function'
import { ClosedSwaps } from './closed'
import { MySwap, SwapServices } from './service'
import { About } from './about'
import { Observable, distinctUntilChanged, from, interval, map } from 'rxjs'

import { Subscribe, bind } from '@react-rxjs/core'
import { Props } from 'next/script'



const noInitializedSwap : MySwap[] = []


export const SwapTabs = () => { 
  const walletState = useWalletState();

  switch (walletState.type) {
    case 'disconnected' : return (<div><Tab panes={panesDisconnected} /></div>) 
    case 'connecting'   : return (<div><Tab panes={panesConnecting} /></div>) 
    case 'connected'    : 
      const [usedInitializedSwaps, _]  = bind(walletState.swapServices.mySwaps.initialized,[]); 
      return <ConnectedSwapTabs usedInitializedSwaps={usedInitializedSwaps} walletState={walletState}/>
  }     
} 

export const ConnectedSwapTabs =  ({walletState, usedInitializedSwaps }: { usedInitializedSwaps,walletState : Connected }) => { 
 
  const initializedSwaps = usedInitializedSwaps()
  console.log("initializedSwaps", initializedSwaps)
  const panes = [{ menuItem: <Menu.Item key='new'><Icon name='add circle' color='grey' size='large' /> New  </Menu.Item>,
                render: () => <NewSwap state={ (walletState as Connected)}/>}, 
              menuInitializedSwaps(initializedSwaps,walletState)]
   
  return (<div><Subscribe><Tab panes={panes} /></Subscribe></div>)
  
   
} 

const menuInitializedSwaps = (initializedSwaps:MySwap[],connected :Connected) => (initializedSwaps.length === 0 ) ? {} : 
        ({ menuItem: <Menu.Item key='initialized'>Initialized<Label>{initializedSwaps.length}</Label></Menu.Item>,
          render: () => <InitializedSwaps initializedSwaps={initializedSwaps} connectedExtension={connected}/>,
         }) 

const menuProvisionnedSwaps = (provisionnedSwaps) => (provisionnedSwaps.length !== 0 ) ? {} : 
         ({ menuItem: <Menu.Item key='provisionned'>Provisionned<Label>{provisionnedSwaps.length}</Label></Menu.Item>,
           render: () => <ProvisionnedSwaps />,
          }) 
const menuClosedSwaps = (closedSwaps) => (closedSwaps.length !== 0 ) ? {} : 
          ({ menuItem: <Menu.Item key='closed'>Closed<Label>{closedSwaps.length}</Label></Menu.Item>,
            render: () => <ClosedSwaps />,
           }) 
const menuRequestedSwaps = (requestedSwaps:MySwap[],connected :Connected)  => (requestedSwaps.length !== 0 ) ? {} : 
           ({ menuItem: <Menu.Item key='requested'>Requested<Label>{requestedSwaps.length}</Label></Menu.Item>,
             render: () => <RequestedSwaps requestedSwaps={requestedSwaps} connectedExtension={connected} />,
            }) 
const panesDisconnected = [{
      menuItem: <Menu.Item key='About'>About</Menu.Item>,
      render: () => <About/>,}]

const panesConnecting = [{
      menuItem: <Menu.Item key='About'>About</Menu.Item>,
      render: () => <About/>,}]

   

