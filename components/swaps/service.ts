import * as A from 'fp-ts/Array'
import * as O from 'fp-ts/Option'
import * as TE from 'fp-ts/TaskEither'
import { constVoid, pipe } from 'fp-ts/lib/function'
import { AddressBech32 } from 'marlowe-ts-sdk/src/runtime/common/address'
import { DecodingError } from 'marlowe-ts-sdk/src/runtime/common/codec'
import {Runtime} from 'marlowe-ts-sdk/src/runtime/'

import * as Swaps from 'marlowe-ts-sdk/src/language/core/v1/examples/swaps/swap-token-token'
import { Timeout } from 'marlowe-ts-sdk/src/language/core/v1/semantics/contract/when'
import { TokenValue } from 'marlowe-ts-sdk/src/language/core/v1/semantics/contract/common/token'
import { ContractId } from 'marlowe-ts-sdk/src/runtime/contract/id'
import { Predicate } from 'fp-ts/lib/Predicate'
import { Tag } from 'marlowe-ts-sdk/src/runtime/common/metadata/tag'
import { PolicyId } from 'marlowe-ts-sdk/src/runtime/common/policyId'


export const runtimeUrl = 'http://marlowe-runtime-preview-web.scdev.aws.iohkdev.io'  
export const dAppName = 'dApp.swap.L1.v1.3'

export type SwapState = 'initialised' | 'provisionned' | 'requested' | 'done'



export type UserRequest 
   = { note : string
     , provider : { depositTimeout : Timeout, value:TokenValue}
     , swapper : { depositTimeout : Timeout, value:TokenValue} } 


export type MySwap 
   = { contractId : ContractId
     , state : State 
     , rolePolicyId : PolicyId 
     , note : string
     , request : Swaps.SwapRequest}              


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
     (runtime : Runtime) 
  => (dAppName : string)
  => (roles : Roles) 
  => SwapServices = 
  (runtime) =>  (dappName) => (roles) => 
    ({ mySwaps : 
         { initialized : fetchMySwaps (runtime) (dappName) (O.some("initialized")) 
         , provisionned : fetchMySwaps (runtime) (dappName) (O.some("provisionned"))
         , requested : fetchMySwaps (runtime) (dappName) (O.some("requested"))
         , closed : fetchMySwaps (runtime) (dappName) (O.none)
         }
                                      
     , initialize : (swapperAddress) => (request) => 
        pipe( TE.Do
            , TE.bind ('changeAddress', () => TE.fromTask(runtime.wallet.getChangeAddress))
            , TE.let ('swapRequest', () => 
               ({ provider : 
                     { roleName : roles.provider
                     , depositTimeout   : request.provider.depositTimeout     
                     , value : request.provider.value}
                , swapper : 
                     { roleName : roles.swapper
                     , depositTimeout :request.swapper.depositTimeout
                     , value : request.swapper.value }}))
            , TE.chainFirst ( ({changeAddress,swapRequest}) => 
               runtime.initialise 
                  ({ contract: Swaps.mkSwapContract(swapRequest)
                      , roles: { [roles.provider] : changeAddress
                               , [roles.swapper] : swapperAddress}
                      , tags : { [dappName] : 
                                    { state : "initialized" as State
                                    , swapRequest : swapRequest
                                    , contractCreator : changeAddress
                                    , note : request.note}   
                               }}))
            , TE.map (constVoid)) 
     })
                                      
const fetchMySwaps : (runtime : Runtime) => (dappName: string) => (stateOption: O.Option<State>) =>TE.TaskEither<Error | DecodingError,MySwap[]> = 
   (runtime) => (dappName) => (stateOption) => 
      pipe 
         (runtime.restAPI.contracts.getHeadersByRange (O.none) ([dAppName])
         , TE.map (data => 
               pipe 
               ( data.headers
               , A.map (header => 
                  ({ contractId : header.contractId
                   , state : header.tags[dappName].state  
                   , rolePolicyId : header.roleTokenMintingPolicyId
                   , note : header.tags[dappName].note  
                   , request : header.tags[dappName].swapRequest 
                   })) 
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