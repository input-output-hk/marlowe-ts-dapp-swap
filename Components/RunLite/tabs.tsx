import React,  {  } from 'react'
import { Container, Icon, Menu } from 'semantic-ui-react'
import { Tab } from 'semantic-ui-react'
import { useWalletState } from '../Hooks/Wallet'
import { About } from './about'
import { NewContract } from './new'
import { FindContract } from './find'

export const RunLiteTabs = () => { 
  const walletState = useWalletState();
  const panes = () => { switch (walletState.type) {
    case 'disconnected' : return panesDisconnected 
    case 'connecting'   : return panesConnecting
    case 'connected'    : return [
      {
        menuItem: <Menu.Item>Find contract</Menu.Item>,
        render: () => <Tab.Pane><FindContract walletState={walletState}/></Tab.Pane>
      },
      {
        menuItem: <Menu.Item key='new'><Icon name='add circle' color='grey' size='large' /> New Contract </Menu.Item>,
        render: () => <Tab.Pane><NewContract state={walletState}/></Tab.Pane>
      },
    ]
  }}  

  return (<Container><Tab panes={panes()} /></Container>)
  
} 

const panesDisconnected = [{
      menuItem: <Menu.Item key='About'>About</Menu.Item>,
      render: () => <About/>,}]

const panesConnecting = [{
      menuItem: <Menu.Item key='About'>About</Menu.Item>,
      render: () => <About/>,}]

   

