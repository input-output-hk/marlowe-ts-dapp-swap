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
import { Predicate } from 'fp-ts/lib/Predicate'
import { Tag } from 'marlowe-ts-sdk/src/runtime/common/metadata/tag'
import { PolicyId } from 'marlowe-ts-sdk/src/runtime/common/policyId'
import { RoleName } from 'marlowe-ts-sdk/src/runtime/contract/role'



export const runtimeUrl = 'http://services.marlowe.run:23780'  
export const dAppName = 'dApp.swap.L1.v1.1'

export type SwapState = 'initialised' | 'provisionned' | 'requested' | 'done'



export type UserRequest 
   = { note : string
     , provider : { depositTimeout : Timeout
                , token:Token
                , amount:bigint}
     , swapper : { depositTimeout : Timeout
               , token:Token
               , amount:bigint} } 


export type MySwap 
   = { contractId : ContractId
     , state : State 
     , rolePolicyId : PolicyId 
     , note : string
     , provider : { roleName : RoleName
                , depositTimeout : Timeout
                , token:Token
                , amount:bigint}
     , swapper : { roleName : RoleName
                 , depositTimeout : Timeout
                 , token:Token
                 , amount:bigint}}              


export type State 
   = "initialized"
   | "provisionned"
   | "requested"
   

export type SwapServices = 
  {mySwaps : 
      { initialized : TE.TaskEither<Error | DecodingError,MySwap[]>
      , provisionned : TE.TaskEither<Error | DecodingError,MySwap[]> 
      , requested : TE.TaskEither<Error | DecodingError,MySwap[]> 
      , closed : TE.TaskEither<Error | DecodingError,MySwap[]>      
      }
  , initialize : (recipient : AddressBech32) => (request :UserRequest) =>  TE.TaskEither<Error | DecodingError,void> }   

export type Roles 
   = { provider : string
     , swapper : string}
     

export const swapServices : 
     (sdk : SDK) 
  => (dAppName : string)
  => (roles : Roles) 
  => SwapServices = 
  (sdk) =>  (dappName) => (roles) => 
    ({ mySwaps : 
         { initialized : fetchMySwaps (sdk) (dappName) (O.some("initialized")) 
         , provisionned : fetchMySwaps (sdk) (dappName) (O.some("provisionned"))
         , requested : fetchMySwaps (sdk) (dappName) (O.some("requested"))
         , closed : fetchMySwaps (sdk) (dappName) (O.none)
         }
                                      
     , initialize : (swapperAddress) => (request) => 
        pipe( TE.Do
            , TE.bind ('changeAddress', () => TE.fromTask(sdk.wallet.getChangeAddress))
            , TE.let ('sdkRequest', () => ({ a : { roleName : roles.provider
                                                 , depositTimeout   : request.provider.depositTimeout     
                                                 , token : request.provider.token
                                                 , amount : request.provider.amount }
                                           , b : { roleName : roles.swapper
                                                   , depositTimeout :request.swapper.depositTimeout
                                                   , token : request.swapper.token
                                                   , amount : request.swapper.amount }}))
            , TE.chainFirst ( ({changeAddress,sdkRequest}) => 
               sdk.commands.initialise 
                  ({ contract: Swaps.swap_tokenA_tokenB(sdkRequest)
                      , roles: { [roles.provider] : changeAddress
                               , [roles.swapper] : swapperAddress}
                      , version: 'v1'
                      , metadata: {}
                      , tags : { [dappName] : 
                                    { state : "initialized" as State
                                    , provider : sdkRequest.a
                                    , swapper : sdkRequest.b
                                    , note : request.note}   
                               }
                      , minUTxODeposit: 3_000_000}))
            , TE.map (constVoid)) 
     })
                                      
const fetchMySwaps : (sdk : SDK) => (dappName: string) => (stateOption: O.Option<State>) =>TE.TaskEither<Error | DecodingError,MySwap[]> = 
   (sdk) => (dappName) => (stateOption) => 
      pipe 
         (sdk.restAPI.contracts.getHeadersByRange (O.none) ([dAppName])
         , TE.map (data => 
               pipe 
               ( data.headers
               , A.map (header => 
                  ({ contractId : header.contractId
                   , state : header.tags[dappName].state  
                   , rolePolicyId : header.roleTokenMintingPolicyId
                   , note : header.tags[dappName].note  
                   , provider : header.tags[dappName].provider 
                   , swapper : header.tags[dappName].swapper  })) 
               , A.filter((swap) => pipe( stateOption, O.match (() => true ,state => swap.state == state)) 
         ))))



const getTags : (dappName: string) => (stateOption: O.Option<State>) => Tag[] = 
      (dAppName) => (stateOption) => 
         pipe
            (stateOption
            , O.match(
               () => [dAppName],
               (state) => [dAppName,state])
            )
                  
const isInitializedSwap : Predicate<MySwap> = 
     (myswap) => isNotTimedOut(myswap)

const isNotTimedOut : Predicate<MySwap> = 
     (myswap) => false