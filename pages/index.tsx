import Head from "next/head";

import MyMenu from "./Menu/Menu";
import { Container } from "semantic-ui-react";
import { SwapTabs } from "./Swaps/tabs";

export default function Home() {
  return (
    <div className="container">
      <Head>
        <title>Ada/Djed Swap DApp</title>
        <meta name="description" content="A Cardano dApp powered my Marlowe" />

      </Head>
      <main>

      <Container > 
        <MyMenu/>
        <SwapTabs />
      </Container>
      
     
      </main>

      <footer>
        <Container textAlign="center"> <br/><p>Powered By Marlowe</p> </Container>
      </footer>
    </div>
  );
}
