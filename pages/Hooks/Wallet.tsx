import React,  { Component, useContext, useEffect, useReducer, useState } from 'react'
import { Container, Dropdown, Icon, Input, Label, Loader, Menu } from 'semantic-ui-react'
import  Logo  from './marlowe-logo.svg'
import * as A from 'fp-ts/Array'
import * as T from 'fp-ts/Task'
import * as O from 'fp-ts/Option'
import { CardanoWallet, WalletContext, useNetwork, useWallet, useWalletList,  } from '@meshsdk/react'
import * as TE from 'fp-ts/TaskEither'
import { Image } from 'semantic-ui-react'
import { AssetExtended, BrowserWallet, DataSignature, resolveFingerprint } from '@meshsdk/core'
import { constant, pipe } from 'fp-ts/lib/function'
import { HexTransactionWitnessSet, MarloweTxCBORHex } from 'marlowe-ts-sdk-beta/src/runtime/common/textEnvelope'
import { AxiosRestClient } from 'marlowe-ts-sdk-beta/src/runtime/endpoints'
import { addressBech32 } from 'marlowe-ts-sdk-beta/src/runtime/common/address'
import { InitialisePayload } from 'marlowe-ts-sdk-beta/src/runtime/write/command'
import { DecodingError } from 'marlowe-ts-sdk-beta/src/runtime/common/codec'
import { ContractDetails } from 'marlowe-ts-sdk-beta/src/runtime/contract/details'
import {initialise} from 'marlowe-ts-sdk-beta/src/runtime/write/command'

export type WalletBroswerExtension = {
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
                   marloweSDK : MarloweSDK,
                   meshExtensionSDK : MeshExtensionSDK
                   assetBalances : AssetExtended[],
                   extensionSelected : WalletBroswerExtension
                   disconnect : () => void
                 } 
export type Connecting = { type: 'connecting' }

export type Disconnected = { type: 'disconnected' 
                      connect: (walletName: string) => Promise<void>
                      installedExtensions : WalletBroswerExtension []
                    }

const runtimeUrl = 'http://0.0.0.0:33891'  

const getExtensionInstance : (extensionName : string) => Promise<WalletInstance> = (extensionName) => { 
  console.log("extensionName", extensionName )
  return window.cardano[extensionName.toLowerCase()].enable()
  }
const waitConfirmation : (txHash : string ) => TE.TaskEither<Error,boolean> = (txHash) => TE.of (true) 
const signMarloweTx : (extensionName : string) => (cborHex :MarloweTxCBORHex) => TE.TaskEither<Error,HexTransactionWitnessSet> =
  (extensionName) => (cborHex) => 
    pipe( () => getExtensionInstance (extensionName)
        , T.chain((extensionInstance) => () => extensionInstance.signTx (cborHex,false))
        , TE.fromTask
        )


const initialiseWithExtension :
       (runtimeUrl : string)
    => (extensionName : string) 
    => (changeAddress : string, usedAddresses : string[],collaterals : string[])
    => (payload : InitialisePayload)
    => TE.TaskEither<Error | DecodingError,ContractDetails>  = 
  (runtimeUrl) => (extensionName) => (changeAddress,usedAddresses,collaterals) => (payload)  => 
        initialise 
              (AxiosRestClient(runtimeUrl)  )
              (waitConfirmation)
              (signMarloweTx(extensionName))
              ({ changeAddress: addressBech32(changeAddress)
                , usedAddresses: usedAddresses.length == 0 
                                    ? O.none 
                                    : pipe( usedAddresses
                                          , A.map(addressBech32)
                                          , O.some) 
                , collateralUTxOs: O.some(collaterals)})
              (payload)
  
export type MarloweSDK = 
  {initialise : 
       (changeAddress : string, usedAddresses : string[],collaterals : string[]) 
    => (payload: InitialisePayload) 
    => TE.TaskEither<Error | DecodingError, ContractDetails>}   

const buildMarloweSDK : 
     (runtimeUrl : string) 
  => (extensionName : string) 
  => MarloweSDK = 
  (runtimeUrl) =>  (extensionName) => 
    ({initialise : initialiseWithExtension (runtimeUrl)(extensionName) })
                                      

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
                                      , marloweSDK : buildMarloweSDK(runtimeUrl)(connectedWalletName)
                                      , meshExtensionSDK : connectedWalletInstance
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
type WalletInstance = {
  experimental: ExperimentalFeatures;
  getBalance(): Promise<string>;
  getChangeAddress(): Promise<string>;
  getNetworkId(): Promise<number>;
  getRewardAddresses(): Promise<string[]>;
  getUnusedAddresses(): Promise<string[]>;
  getUsedAddresses(): Promise<string[]>;
  getUtxos(): Promise<string[] | undefined>;
  signData(address: string, payload: string): Promise<DataSignature>;
  signTx(tx: string, partialSign: boolean): Promise<string>;
  submitTx(tx: string): Promise<string>;
};

type ExperimentalFeatures = {
  getCollateral(): Promise<string[] | undefined>;
};
