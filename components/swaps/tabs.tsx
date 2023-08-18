import React,  {  } from 'react'
import { Icon, Label, Menu } from 'semantic-ui-react'
import { Tab } from 'semantic-ui-react'
import { ProvisionnedSwaps } from './provisionned.js'
import { NewSwap } from './new.js'
import { RequestedSwaps } from './requested.js'
import { Connected, useWalletState } from '../hooks/Wallet.js'
import { InitializedSwaps } from './initialized.js'
import { ClosedSwaps } from './closed.js'
import { MySwap } from './service.js'
import { About } from './about.js'

import { Subscribe, bind } from '@react-rxjs/core'

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

   

