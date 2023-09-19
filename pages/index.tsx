import Head from "next/head";

import  { ConnectionWallet } from "./Menu/Menu";
import { Container, Grid, Menu } from "semantic-ui-react";
import { SwapTabs } from "./Swaps/tabs";
import { Component, useState } from "react";
import { RunLiteTabs } from "./RunLite/tabs";
import  Logo  from './Menu/marlowe-logo.svg'

export default function Home() {

  let [state, setState] = useState<any>({ activeItem: 'My Swaps' });
  const handleItemClick = (e, { name }) => setState({ activeItem: name })
  
  const { activeItem } = state
  return (
    <div className="container">
      <Head>
        <title>Marlowe Lab</title>
        <meta name="description" content="A Cardano dApp powered my Marlowe" />

      </Head>
      <main>

      <Container > 
        <Menu secondary>
          <Menu.Item>
            <Logo />
          </Menu.Item>
          <Menu.Item
                  name='My Swaps'
                  active={activeItem === 'My Swaps'}
                  onClick={handleItemClick}
          />
          <Menu.Item
            name='Run Lite'
            active={activeItem === 'swaps'}
            onClick={handleItemClick}
          />
          <Menu.Menu position='right'>
            <ConnectionWallet /> 
          </Menu.Menu>
        </Menu>
        {activeItem === 'My Swaps' ? <SwapTabs/> : <RunLiteTabs/>}
      </Container>
      
     
      </main>

      <footer>
        <Container textAlign="center"> <br/><p>Powered By Marlowe</p> </Container>
      </footer>
    </div>
  );
}

