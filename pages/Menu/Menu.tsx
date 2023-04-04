import React,  { Component, useEffect } from 'react'
import { Dropdown, Icon, Input, Menu } from 'semantic-ui-react'
import  Logo  from './marlowe-logo.svg'

import { useLovelace, useWallet, useWalletList,  } from '@meshsdk/react'

import { Image } from 'semantic-ui-react'

export default class MyMenu extends Component {
  state = { activeItem: 'home' }

  handleItemClick = (e, { name }) => this.setState({ activeItem: name })

  render() {
    const { activeItem } = this.state
    
    return (
      <Menu secondary>
        <Menu.Item>
          <Logo />
        </Menu.Item>
        <Menu.Item
          name='Welcome'
          active={activeItem === 'home'}
          onClick={this.handleItemClick}
        />
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
  const walletsAvailable = useWalletList();
  const { connected,name,disconnect} = useWallet();

  if(connected)
  {
    return <ConnectedWallet  name = {name} disconnect= {disconnect}/>
  } else {
    return <ConnectWallet walletsAvailable={walletsAvailable} />
  }
}

export const ConnectWallet = ({ walletsAvailable }) => {
  const { connect, name } = useWallet();
  return <Dropdown item text='Connect Wallet' labeled  className='icon'>
      <Dropdown.Menu>
      <Dropdown.Header content='Available Wallets' /> 
        { walletsAvailable.length > 0 ? (
          walletsAvailable.map((wallet, index) => (
            <Dropdown.Item 
                key={index}
                active={name === wallet.name}
                onClick={() => connect(wallet.name)}
                text = {wallet.name }
                {...{image: { avatar: true, src: wallet.icon  }}}/>))
        ) : (<Dropdown.Item >No Wallet Extension Found</Dropdown.Item>)
        }
      </Dropdown.Menu>
    </Dropdown>
}



export const ConnectedWallet = ({name,disconnect}) => {
  const wallet = useWalletList().find((wallet) => wallet.name === name);
  const balance = useLovelace();

  return  balance && wallet?.icon ? (
    <Dropdown
      trigger = {<span><Image src={wallet.icon} avatar alt="" />  {'₳ ' + parseInt((parseInt(balance, 10) / 1_000_000).toString(), 10).toString()}</span>}
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
      text= "connecting..."
      item 
      labeled
      className='icon'>
      <Dropdown.Menu />
      
    </Dropdown>
  );
};