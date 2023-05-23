import React,  {  } from 'react'
import { Icon, Menu } from 'semantic-ui-react'
import { Tab } from 'semantic-ui-react'
import { useWalletState } from '../Hooks/Wallet'
import { About } from './about'
import { NewContract } from './new'

export const RunLiteTabs = () => { 
  let walletState = useWalletState();
  const panes = () => { switch (walletState.type) {
    case 'disconnected' : return panesDisconnected 
    case 'connecting'   : return panesConnecting
    case 'connected'    : return [{ menuItem: <Menu.Item key='new'><Icon name='add circle' color='grey' size='large' /> New Contract </Menu.Item>,
                                    render: () => <NewContract state={walletState}/>}]
  }}  

  return (<div><Tab panes={panes()} /></div>)
  
} 

const panesDisconnected = [{
      menuItem: <Menu.Item key='About'>About</Menu.Item>,
      render: () => <About/>,}]

const panesConnecting = [{
      menuItem: <Menu.Item key='About'>About</Menu.Item>,
      render: () => <About/>,}]

   

