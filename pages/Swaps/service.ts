import { useContext, useEffect, useState } from 'react'
import * as A from 'fp-ts/Array'
import * as O from 'fp-ts/Option'
import { WalletContext, useNetwork,  } from '@meshsdk/react'
import * as TE from 'fp-ts/TaskEither'
import { AssetExtended, BrowserWallet, resolveFingerprint } from '@meshsdk/core'
import { constVoid, constant, pipe } from 'fp-ts/lib/function'
import { AddressBech32, addressBech32 } from 'marlowe-ts-sdk/src/runtime/common/address'
import { DecodingError } from 'marlowe-ts-sdk/src/runtime/common/codec'
import {SDK, cip30SDK} from 'marlowe-ts-sdk/src/runtime/'
import { GETByRangeResponse } from 'marlowe-ts-sdk/src/runtime/contract/endpoints/collection'

import * as Swaps from 'marlowe-ts-sdk/src/language/core/v1/examples/swaps/swap-token-token'
import { Timeout } from 'marlowe-ts-sdk/src/language/core/v1/semantics/contract/when'
import { Token } from 'marlowe-ts-sdk/src/language/core/v1/semantics/contract/common/token'
import { ContractId } from 'marlowe-ts-sdk/src/runtime/contract/id'


export const runtimeUrl = 'http://0.0.0.0:40124'  
export const dappName = 'dApp.swap.L1'

export type SwapState = 'initialised' | 'provisionned' | 'requested' | 'done'

export type SwapContext 
   = { note : string
     , self : { depositTimeout : Timeout
              , token:Token
              , amount:bigint}
     , b    : { depositTimeout : Timeout
              , token:Token
              , amount:bigint} } 

export type  InitializedSwap  = {contractId : ContractId, swap : SwapContext }
export type  ProvisionnedSwap = {contractId : ContractId, swap : SwapContext }
export type  RequestedSwap    = {contractId : ContractId, swap : SwapContext }
export type  ClosedSwap       = {contractId : ContractId, swap : SwapContext }

export type SwapServices = 
  { dAppName : string
  , mySwaps : { initializedSwaps : TE.TaskEither<Error | DecodingError,InitializedSwap[]> }
  , initialize : (recipient : AddressBech32) => (context :SwapContext) =>  TE.TaskEither<Error | DecodingError,void> }   



export const swapServices : 
     (sdk : SDK) 
  => (dAppName : string) 
  => SwapServices = 
  (sdk) =>  (dappName) =>
    ({ dAppName : dappName
     , mySwaps : { initializedSwaps : 
          pipe (sdk.restAPI.contracts.getHeadersByRange (O.none) ([dappName + '.initialised'])
               , TE.map (data => pipe (data.headers,
                                       A.map (header => ({ contractId : header.contractId
                                                          , swap : header.tags["context"] as SwapContext })) ) )) }
                                      
     , initialize : (recipient) => (swapContext) => 
        pipe( sdk.wallet.getChangeAddress
            , TE.fromTask
            , TE.chain ( changeAddress => 
               sdk.commands.initialise 
                  ({ contract: Swaps.swap_tokenA_tokenB({ a : { roleName : "Swap Request Handler"
                                                              , depositTimeout   : swapContext.self.depositTimeout     
                                                              , token : swapContext.self.token
                                                              , amount : swapContext.self.amount }
                                                        , b : { roleName : "Swap Exchange Handler"
                                                              , depositTimeout :swapContext.b.depositTimeout
                                                              , token : swapContext.b.token
                                                              , amount : swapContext.b.amount }})
                      , roles: { ["Swap Request Handler"] : changeAddress
                               , ["Swap Exchange Handler"] : recipient}
                      , version: 'v1'
                      , metadata: {}
                      , tags : { [dappName + '.initialised'] : { }
                                , context : swapContext }
                      , minUTxODeposit: 3_000_000}))
            , TE.map (constVoid)) 
     })
                                      

