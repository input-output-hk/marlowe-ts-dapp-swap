import "../styles/globals.css";
import type { AppProps } from "next/app.js";
import { MeshProvider } from "@meshsdk/react";

import '../components/menu/menu.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <MeshProvider>
      <Component {...pageProps} />
    </MeshProvider>
  );
}
