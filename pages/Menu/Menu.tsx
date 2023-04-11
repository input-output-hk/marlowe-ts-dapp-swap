import React,  { Component, useContext, useEffect, useReducer, useState } from 'react'
import { Container, Dropdown, Icon, Input, Label, Loader, Menu } from 'semantic-ui-react'
import  Logo  from './marlowe-logo.svg'
import * as A from 'fp-ts/Array'
import * as T from 'fp-ts/Task'
import * as O from 'fp-ts/Option'
import { CardanoWallet, WalletContext, useLovelace, useNetwork, useWallet, useWalletList,  } from '@meshsdk/react'

import { Image } from 'semantic-ui-react'
import { BrowserWallet } from '@meshsdk/core'
import { constant, pipe } from 'fp-ts/lib/function'


export default class MyMenu extends Component {
  state = { activeItem: 'home' }

  handleItemClick = (e, { name }) => this.setState({ activeItem: name })

  render() {
    const { activeItem } = this.state
    console.log("Render Menu" )
    return (
      <Menu secondary>
        <Menu.Item>
          <Logo />
        </Menu.Item>
        <Menu.Item> <h3>Swaps Demonstration powered by Marlowe</h3></Menu.Item>
        <Menu.Menu position='right'>
          <Menu.Item>
            <Input icon='search' placeholder='Search...' />
          </Menu.Item>
          <ConnectionWallet /> 
        </Menu.Menu>
      </Menu>
    )
  }
}


export const ConnectionWallet = () => {
  const walletState = useWalletState();
  console.log("Wallet State :" , walletState)
  switch (walletState.type) {
    case 'disconnected' : return <ConnectWallet  state = {walletState}  />
    case 'connecting'   : return <Dropdown trigger = {<><Loader active size='mini' inline></Loader> {' ... connecting'}</>} item labeled className='icon'/> 
    case 'connected'    : return <ConnectedWallet  state = {walletState} />
  }
}

export const ConnectWallet = ({ state }) => {
  const { connect, name , installedExtensions} = state;
  if(state.installedExtensions.length > 0) {
    return <Dropdown item text='Connect Wallet' labeled  className='icon'>
      <Dropdown.Menu>
      <Dropdown.Header content='Select Your Wallet Extensions' /> 
        { installedExtensions.map((wallet, index) => (
            <Dropdown.Item 
                key={index}
                active={name === wallet.name}
                onClick={() => connect(wallet.name)}
                text = {wallet.name }
                {...{image: { avatar: true, src: wallet.icon  }}}/>)) 
        }
      </Dropdown.Menu>
    </Dropdown>
  }
  else {
    return <Dropdown item text='Connect Wallet' labeled  className='icon'>
      <Dropdown.Menu>
        <Dropdown.Item >No Wallet Extension Installed</Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  }
  
}



export const ConnectedWallet = ({state}) => {
  const { disconnect, extensionSelected , lovelaceBalance , isMainnnet} = state;
  const adas = (Math.trunc(lovelaceBalance / 1_000_000))
  const decimalADAs = (lovelaceBalance % 1_000_000)
  return  lovelaceBalance > 0 ? (
    <Dropdown
      trigger = {<><span className='small'><Image src={extensionSelected.icon} className="walletIcon" alt="" 
                    />{(adas).toString()}.</span>
                     <span  style={{fontSize: "smaller"}}>{decimalADAs + ' '} </span> 
                     <span  style={{fontWeight: 'bold',fontSize: "smaller"}}> {isMainnnet ? ' ₳' : ' t₳' }</span>
                </>}
      item
      className='icon'>
      <Dropdown.Menu>
        <Dropdown.Item
          text="Disconnect"
          onClick={() => disconnect ()}
              />
      </Dropdown.Menu>
    </Dropdown>
  ) : (
    <Dropdown
      trigger = {<><span className='small'><Image src={extensionSelected.icon}  className="walletIcon" alt="" 
                    />0 {isMainnnet ? ' ₳ ' : ' t₳'}</span>
                </>}
      item
      className='icon'>
      <Dropdown.Menu>
        <Dropdown.Item
          text="Disconnect"
          onClick={() => disconnect ()}
              />
      </Dropdown.Menu>
    </Dropdown>
  )
};


type WalletBroswerExtension = {
    name: string,
    icon: string,
    version: string
}

type WalletState 
  = Connected
  | Connecting
  | Disconnected

type Connected = { type: 'connected',
                   isMainnnet : Boolean 
                   walletsdk : BrowserWallet,
                   lovelaceBalance : number,
                   extensionSelected : WalletBroswerExtension
                   disconnect : () => void
                 } 
type Connecting = { type: 'connecting' }

type Disconnected = { type: 'disconnected' 
                      connect: (walletName: string) => Promise<void>
                      installedExtensions : WalletBroswerExtension []
                    }

export const useWalletState : () => WalletState = 
  () => {
  const {
    connectedWalletName,
    connectedWalletInstance,
    connectingWallet,
    hasConnectedWallet,
    connectWallet,
    disconnect,
  } = useContext(WalletContext);
  
  const isMainnnet = pipe(useNetwork (), a => a == 1 )
  const installedExtensions = useInstalledWalletExtensions ()
  const lovelaceOption = pipe(useLovelace(), a => a != undefined ? O.some(parseInt (a,10)) : O.none)
  const connectOption 
    = pipe(  O.Do
          ,  O.bind ( 'walletSelected' ,  () => pipe (installedExtensions, A.findFirst(w => w.name == connectedWalletName)))
          ,  O.bind ( 'lovelaceBalance' , () => lovelaceOption) 
          ,  O.map (({walletSelected,lovelaceBalance}) => ({ type : 'connected' 
                                      , isMainnnet : isMainnnet
                                      , walletsdk : connectedWalletInstance
                                      , extensionSelected : walletSelected
                                      , lovelaceBalance : lovelaceBalance
                                      , disconnect : disconnect} as WalletState)))
  const connecting   = constant ({ type: 'connecting' } as WalletState)
  const disconnected = constant ({ type: 'disconnected' , installedExtensions : installedExtensions , connect : connectWallet} as WalletState)
  return pipe
          ( connectOption
          ,  O.getOrElse( connectingWallet || (hasConnectedWallet && O.isNone(lovelaceOption)) ? connecting : disconnected))

};

export const useInstalledWalletExtensions = () => {
  const [wallets, setWallets] = useState<WalletBroswerExtension[]>([]);

  useEffect(() => {
    setWallets(BrowserWallet.getInstalledWallets());
  }, []);

  return wallets;
};