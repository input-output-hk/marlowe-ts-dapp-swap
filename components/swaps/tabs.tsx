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
import { pipe } from 'fp-ts/lib/function'
import { ClosedSwaps } from './closed'
import { MySwap, SwapServices } from './service'
import { About } from './about'


const fetchInitializedSwaps = (swapServices : SwapServices ) => 
{console.log("here")
 const noInitializedSwap : MySwap[] = []
 return pipe( swapServices.mySwaps.initialized
   , TE.fold( a => T.of(noInitializedSwap),a => T.of(a))) ()
   
}

export const SwapTabs = () => { 
  let walletState = useWalletState();
  let [requestedSwaps, setRequestedSwap]       = useState<MySwap[]>([]);
  let [initializedSwaps, setInitializedSwaps]  = useState<MySwap[]>([]);
  let [provisionnedSwaps, setProvisionnedSwap] = useState<MySwap[]>([]);
  let [closedSwaps, setClosedSwap]             = useState<MySwap[]>([]);
  console.log(initializedSwaps)
  const panes = () => { switch (walletState.type) {
    case 'disconnected' : return panesDisconnected 
    case 'connecting'   : return panesConnecting
    case 'connected'    : 
      return [
                  { menuItem: <Menu.Item key='About'>About</Menu.Item>, render: () => <About/>},
                  menuRequestedSwaps(requestedSwaps),
                  { menuItem: <Menu.Item key='new'><Icon name='add circle' color='grey' size='large' /> New  </Menu.Item>,
                    render: () => <NewSwap state={walletState}/>}, 
                  menuInitializedSwaps(initializedSwaps,walletState),
                  menuProvisionnedSwaps(provisionnedSwaps),
                  menuClosedSwaps (closedSwaps)
                ]
  }}  
  useEffect(() => {
    if(walletState.type == 'connected') {
      fetchInitializedSwaps(walletState.swapServices) 
       .then (setInitializedSwaps)
    }
    }
    , [walletState.type,initializedSwaps.length]);
  return (<div><Tab panes={panes()} /></div>)
  
   
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
const menuRequestedSwaps = (closedSwaps) => (closedSwaps.length !== 0 ) ? {} : 
           ({ menuItem: <Menu.Item key='requested'>Requested<Label>{closedSwaps.length}</Label></Menu.Item>,
             render: () => <RequestedSwaps />,
            }) 
const panesDisconnected = [{
      menuItem: <Menu.Item key='About'>About</Menu.Item>,
      render: () => <About/>,}]

const panesConnecting = [{
      menuItem: <Menu.Item key='About'>About</Menu.Item>,
      render: () => <About/>,}]

   

