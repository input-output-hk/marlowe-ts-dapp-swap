import React,  { Component, useEffect, useState } from 'react'
import { Dropdown, Loader, Menu } from 'semantic-ui-react'

import * as A from 'fp-ts/Array'
import * as O from 'fp-ts/Option'
import * as E from 'fp-ts/Either'
import { Image } from 'semantic-ui-react'
import { pipe } from 'fp-ts/lib/function'
import { Connected, useWalletState } from '../hooks/Wallet'
import { formatADAs } from 'components/common/tokens'



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
  const { disconnect, extensionSelectedDetails , runtime , isMainnnet} = connected;
  console.log('state' , state)
  const [lovelaceBalance, setLovelaceBalance] = useState<bigint>(0n)
  console.log('lovelaceBalance' , lovelaceBalance)
  useEffect(() => {
    (runtime.wallet.getLovelaces()).then((result) => pipe(result,E.getOrElse(() => 0n),setLovelaceBalance))
  }, [runtime]);

  const [adas,decimalADAs,currrency] = formatADAs (lovelaceBalance, isMainnnet)
  
  return  lovelaceBalance > 0 ? (
    <Dropdown
      trigger = {<><span className='small'><Image src={extensionSelectedDetails.icon} className="walletIcon" alt="" 
                    />{(adas).toString()}.</span>
                     <span  style={{fontSize: "smaller"}}>{decimalADAs + ' '} </span> 
                     <span  style={{fontWeight: 'bold',fontSize: "smaller"}}> {' ' + currrency}</span>
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
                    />0 {' ' + currrency}</span>
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

