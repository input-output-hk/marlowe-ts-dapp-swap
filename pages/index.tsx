

import  { ConnectionWallet } from "../components/menu/Menu.js";
import { Container, Grid, Menu } from "semantic-ui-react";
import { SwapTabs } from "../components/swaps/tabs.jsx";
import { Component, useState } from "react";

import { Image } from 'semantic-ui-react'

export default function Home() {

  let [state, setState] = useState<any>({ activeItem: 'My Swaps' });
  const handleItemClick = (e, { name }) => setState({ activeItem: name })
  
  const { activeItem } = state
  return (
    <div className="container">
      <main>

      <Container > 
        <Menu secondary>
          <Menu.Item>
          <Image src='../components/menu/marlowe-logo.svg' alt=""/>
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
        <SwapTabs/> 
      </Container>
      
     
      </main>

      <footer>
        <Container textAlign="center"> <br/><p>Powered By Marlowe</p> </Container>
      </footer>
    </div>
  );
}

