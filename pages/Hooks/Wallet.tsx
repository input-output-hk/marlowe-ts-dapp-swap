import React,  { Component, useContext, useEffect, useReducer, useState } from 'react'
import { Container, Dropdown, Icon, Input, Label, Loader, Menu } from 'semantic-ui-react'
import  Logo  from './marlowe-logo.svg'
import * as A from 'fp-ts/Array'
import * as T from 'fp-ts/Task'
import * as O from 'fp-ts/Option'
import { CardanoWallet, WalletContext, useNetwork, useWallet, useWalletList,  } from '@meshsdk/react'

import { Image } from 'semantic-ui-react'
import { AssetExtended, BrowserWallet, resolveFingerprint } from '@meshsdk/core'
import { constant, pipe } from 'fp-ts/lib/function'


export type WalletBroswerExtension = {
    name: string,
    icon: string,
    version: string
}

export type WalletState 
  = Connected
  | Connecting
  | Disconnected

export type Connected = { type: 'connected',
                   isMainnnet : Boolean 
                   walletsdk : BrowserWallet,
                   assetBalances : AssetExtended[],
                   extensionSelected : WalletBroswerExtension
                   disconnect : () => void
                 } 
export type Connecting = { type: 'connecting' }

export type Disconnected = { type: 'disconnected' 
                      connect: (walletName: string) => Promise<void>
                      installedExtensions : WalletBroswerExtension []
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
        
  const connectOption 
    = pipe(  O.Do
          ,  O.bind ( 'walletSelected' ,  () => pipe (installedExtensions, A.findFirst(w => w.name == connectedWalletName)))
          ,  O.map (({walletSelected}) => ({ type : 'connected' 
                                      , isMainnnet : isMainnnet
                                      , walletsdk : connectedWalletInstance
                                      , extensionSelected : walletSelected
                                      , assetBalances : assetBalances
                                      , disconnect : disconnect} as WalletState)))
  const connecting   = constant ({ type: 'connecting' } as WalletState)
  const disconnected = constant ({ type: 'disconnected' , installedExtensions : installedExtensions , connect : connectWallet} as WalletState)
  return pipe
          ( connectOption
          ,  O.getOrElse( connectingWallet || (hasConnectedWallet) ? connecting : disconnected))

  
};

export const useInstalledWalletExtensions = () => {
  const [wallets, setWallets] = useState<WalletBroswerExtension[]>([]);

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