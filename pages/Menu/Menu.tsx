import React,  { Component } from 'react'
import { Dropdown, Loader, Menu } from 'semantic-ui-react'
import  Logo  from './marlowe-logo.svg'
import * as A from 'fp-ts/Array'
import * as O from 'fp-ts/Option'

import { Image } from 'semantic-ui-react'
import { pipe } from 'fp-ts/lib/function'
import { Connected, useWalletState } from '../Hooks/Wallet'


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
        <Menu.Item> <h3>P2P Swaps </h3></Menu.Item>
        <Menu.Menu position='right'>
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
  const connected : Connected = state
  const { disconnect, extensionSelectedDetails , assetBalances , isMainnnet} = connected;
  console.log('state' , state)
  const lovelaceBalance = 
      pipe(assetBalances 
          ,A.findFirst((v) => v.unit === 'lovelace') 
          ,O.map((v) => parseInt (v.quantity,10))
          ,O.getOrElse(() => 0))

  const adas = (Math.trunc(lovelaceBalance / 1_000_000))
  const decimalADAs = (lovelaceBalance % 1_000_000)
  return  lovelaceBalance > 0 ? (
    <Dropdown
      trigger = {<><span className='small'><Image src={extensionSelectedDetails.icon} className="walletIcon" alt="" 
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
      trigger = {<><span className='small'><Image src={extensionSelectedDetails.icon}  className="walletIcon" alt="" 
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

