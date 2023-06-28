import { useContext, useEffect, useState } from 'react'
import * as A from 'fp-ts/Array'
import * as O from 'fp-ts/Option'
import { WalletContext, useNetwork,  } from '@meshsdk/react'
import { AssetExtended, BrowserWallet, resolveFingerprint } from '@meshsdk/core'
import { constant, pipe } from 'fp-ts/lib/function'
import {SDK, cip30SDK} from 'marlowe-ts-sdk/src/runtime/'

import { SwapServices, dAppName, runtimeUrl, swapServices } from 'components/swaps/service'

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
                   marloweSDK : SDK,
                   meshExtensionSDK : MeshExtensionSDK
                   assetBalances : AssetExtended[],
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
  const assetBalances = useAssetBalance()
  const sdkCIP30 = cip30SDK(runtimeUrl)      
  const connectOption 
    = pipe(  O.Do
          ,  O.bind ( 'extensionSelectedDetails' ,  () => pipe (installedExtensions, A.findFirst(w => w.name == connectedWalletName)))
          ,  O.map (({extensionSelectedDetails}) => ({ type : 'connected' 
                                      , isMainnnet : isMainnnet
                                      , swapServices : 
                                          swapServices
                                            (sdkCIP30(connectedWalletName))
                                            (dAppName) 
                                            ({ provider :"Provider NFT Handle"
                                             , swapper : "Swapper NFT Handle" })
                                      , marloweSDK : sdkCIP30(connectedWalletName)
                                      , meshExtensionSDK : connectedWalletInstance
                                      , extensionSelectedDetails : extensionSelectedDetails
                                      , assetBalances : assetBalances
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

export const useAssetBalance = () => {
  const [assets, setAssets] = useState<AssetExtended[]>([])
  const {
    hasConnectedWallet,
    connectedWalletInstance,
  } = useContext(WalletContext);

  useEffect(() => {
    if (hasConnectedWallet) {
      getAssets(connectedWalletInstance).then(setAssets);
    }
  }, [hasConnectedWallet,connectedWalletInstance]);

  return assets;
};

const getAssets = async (connectedWalletInstance :BrowserWallet) => {
  const balance = await connectedWalletInstance.getBalance();
  return balance
    .map((v) => {
      const policyId = v.unit.slice(0, POLICY_ID_LENGTH);
      const assetName = v.unit.slice(POLICY_ID_LENGTH);
      const fingerprint = resolveFingerprint(policyId, assetName);

      return {
        unit: v.unit,
        policyId,
        assetName: toUTF8(assetName),
        fingerprint,
        quantity: v.quantity
      };
    });
}
const POLICY_ID_LENGTH = 56;
const toUTF8 = (hex: string) => Buffer.from(hex, 'hex').toString('utf-8');


