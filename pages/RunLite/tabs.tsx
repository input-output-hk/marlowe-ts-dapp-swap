import React,  {  } from 'react'
import { Menu } from 'semantic-ui-react'
import { Tab } from 'semantic-ui-react'
import { useWalletState } from '../Hooks/Wallet'
import { About } from './about'

export const RunLiteTabs = () => { 
  let walletState = useWalletState();
  const panes = () => { switch (walletState.type) {
    case 'disconnected' : return panesDisconnected 
    case 'connecting'   : return panesConnecting
    case 'connected'    : return panesConnected
  }}  

  return (<div><Tab panes={panes()} /></div>)
  
   
} 

const panesConnected = [{
  menuItem: <Menu.Item key='About'>About</Menu.Item>,
  render: () => <About/>,}]

const panesDisconnected = [{
      menuItem: <Menu.Item key='About'>About</Menu.Item>,
      render: () => <About/>,}]

const panesConnecting = [{
      menuItem: <Menu.Item key='About'>About</Menu.Item>,
      render: () => <About/>,}]

   

