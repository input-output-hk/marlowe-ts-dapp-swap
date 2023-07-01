import { useContext, useEffect, useState } from 'react'
import * as A from 'fp-ts/Array'

import * as O from 'fp-ts/lib/Option';
import { WalletContext, useNetwork,  } from '@meshsdk/react'
import { AssetExtended, BrowserWallet, resolveFingerprint } from '@meshsdk/core'
import { constant, pipe } from 'fp-ts/lib/function'
import { mkRuntimeCIP30 } from 'marlowe-ts-sdk/src/runtime/runtimeCIP30'

import { SwapServices, dAppName, runtimeUrl, swapServices } from 'components/swaps/service'
import { Runtime } from 'marlowe-ts-sdk/src/runtime';

export type BroswerExtensionDetails = {
    name: string,
    icon: string,
    version: string
}

export type WalletState 
  = Connected
  | Connecting
  | Disconnected

export type MeshExtensionSDK = BrowserWallet

export type Connected = { type: 'connected',
                   isMainnnet : Boolean 
                   swapServices : SwapServices,
                   runtime : Runtime,
                   meshExtensionSDK : MeshExtensionSDK
                   extensionSelectedDetails : BroswerExtensionDetails
                   disconnect : () => void
                 } 
export type Connecting = { type: 'connecting' }

export type Disconnected = { type: 'disconnected' 
                      connect: (walletName: string) => Promise<void>
                      installedExtensions : BroswerExtensionDetails []
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
  const runtimeOpt = useRuntime()     
  const connectOption 
    = pipe(  O.Do
          ,  O.bind ( 'extensionSelectedDetails' ,  () => pipe (installedExtensions, A.findFirst(w => w.name == connectedWalletName)))
          ,  O.bind ( 'runtime' ,  () => runtimeOpt)
          ,  O.map (({extensionSelectedDetails,runtime}) => ({ type : 'connected' 
                                      , isMainnnet : isMainnnet
                                      , swapServices : 
                                          swapServices
                                            (runtime)
                                            (dAppName) 
                                            ({ provider :"Provider NFT Handle"
                                             , swapper : "Swapper NFT Handle" })
                                      , runtime : runtime
                                      , meshExtensionSDK : connectedWalletInstance
                                      , extensionSelectedDetails : extensionSelectedDetails
                                      , disconnect : disconnect} as WalletState)))
  const connecting   = constant ({ type: 'connecting' } as WalletState)
  const disconnected = constant ({ type: 'disconnected' , installedExtensions : installedExtensions , connect : connectWallet} as WalletState)
  return pipe
          ( connectOption
          ,  O.getOrElse( connectingWallet || (hasConnectedWallet) ? connecting : disconnected))

  
};

export const useInstalledWalletExtensions = () => {
  const [wallets, setWallets] = useState<BroswerExtensionDetails[]>([]);

  useEffect(() => {
    setWallets(BrowserWallet.getInstalledWallets());
    
  }, []);

  return wallets;
};

export const useRuntime = () => {
  const [runtimeOption, setRuntime] = useState<(O.Option<Runtime>)>(O.none)
  const {
    connectedWalletName,
    hasConnectedWallet,
  } = useContext(WalletContext);

  useEffect(() => {
    if (hasConnectedWallet) {
      (mkRuntimeCIP30(runtimeUrl)(connectedWalletName)()).then((runtime) => setRuntime(O.some(runtime)))
    }
  }, [hasConnectedWallet,connectedWalletName]);

  return runtimeOption;
};


