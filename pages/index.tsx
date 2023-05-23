import Head from "next/head";

import MyMenu from "./Menu/Menu";
import { Container, Grid, Menu } from "semantic-ui-react";
import { SwapTabs } from "./Swaps/tabs";
import { useState } from "react";
import { RunLiteTabs } from "./RunLite/tabs";

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
        <MyMenu/>
        <Grid>
        <Grid.Column width={4}>
            <Menu vertical>
            <Menu.Item>
              <Menu.Menu>
                <Menu.Item
                  name='My Swaps'
                  active={activeItem === 'My Swaps'}
                  onClick={handleItemClick}
                />
              </Menu.Menu>
              <Menu.Menu>
                <Menu.Item
                  name='Run Lite'
                  active={activeItem === 'swaps'}
                  onClick={handleItemClick}
                />
              </Menu.Menu>
            </Menu.Item>

          </Menu>
        </Grid.Column>
        <Grid.Column width={12}>
          {activeItem === 'My Swaps' ? <SwapTabs/> : <RunLiteTabs/>}
        </Grid.Column>
        
      </Grid>
      </Container>
      
     
      </main>

      <footer>
        <Container textAlign="center"> <br/><p>Powered By Marlowe</p> </Container>
      </footer>
    </div>
  );
}
