import * as A from 'fp-ts/Array'
import * as O from 'fp-ts/Option'
import * as TE from 'fp-ts/TaskEither'
import { constVoid, pipe } from 'fp-ts/lib/function'
import { AddressBech32, unAddressBech32 } from 'marlowe-ts-sdk/src/runtime/common/address'
import { DecodingError } from 'marlowe-ts-sdk/src/runtime/common/codec'
import {Runtime} from 'marlowe-ts-sdk/src/runtime/'

import * as Swaps from 'marlowe-ts-sdk/src/language/core/v1/examples/swaps/swap-token-token'
import { Timeout } from 'marlowe-ts-sdk/src/language/core/v1/semantics/contract/when'
import { TokenValue } from 'marlowe-ts-sdk/src/language/core/v1/semantics/contract/common/tokenValue'
import { ContractId } from 'marlowe-ts-sdk/src/runtime/contract/id'
import { Predicate } from 'fp-ts/lib/Predicate'
import { Tag } from 'marlowe-ts-sdk/src/runtime/common/metadata/tag'
import { PolicyId } from 'marlowe-ts-sdk/src/runtime/common/policyId'
import { toInput } from 'marlowe-ts-sdk/src/language/core/v1/semantics/next/applicables/canDeposit'
import { Observable, distinctUntilChanged, from, interval, map, mergeMap, switchMap } from 'rxjs'
import * as E from 'fp-ts/Either'
export const runtimeUrl = 'http://0.0.0.0:33294'  
export const dAppName = 'dApp.swap.L1.v1.3'



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
   | "swapped"
   | "withdrawn"
   

export type SwapServices = 
  {mySwaps : 
      { initialized : Observable<MySwap[]>
      , provisionned : TE.TaskEither<Error | DecodingError,MySwap[]>
      , requested : TE.TaskEither<Error | DecodingError,MySwap[]>  
      , swapped : TE.TaskEither<Error | DecodingError,MySwap[]> 
      , closed : TE.TaskEither<Error | DecodingError,MySwap[]>      
      }
  , initialize : (recipient : AddressBech32) => (request :UserRequest) =>  TE.TaskEither<Error | DecodingError,ContractId>
  , provision : (swap: MySwap) => TE.TaskEither<Error | DecodingError,ContractId> 
  , swap : (swap: MySwap) => TE.TaskEither<Error | DecodingError,ContractId> }   

export type Roles 
   = { provider : string
     , swapper : string}

function arrayEquals(a, b) {
return Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((val, index) => val === b[index]);
}
    

export const swapServices : 
     (runtime : Runtime) 
  => (dAppName : string)
  => (roles : Roles) 
  => SwapServices = 
  (runtime) =>  (dappName) => (roles) => 
    ({ mySwaps : 
         { initialized :
            interval(5000)
               .pipe(switchMap (_ => from(pipe ( TE.fromTask(runtime.wallet.getChangeAddress)
                                    , TE.chainW ( (changeAddress) => fetchMySwaps (runtime) (dappName) (["initialized",unAddressBech32 (changeAddress)])))()))
               , map(E.match((e) => {throw e},(a) => a))
               , distinctUntilChanged((prev, curr) => arrayEquals(prev.map(x=>x.contractId),curr.map(x=>x.contractId))))  
         , provisionned : 
            pipe ( TE.fromTask(runtime.wallet.getChangeAddress)
                 , TE.chainW ( (changeAddress) => fetchMySwaps (runtime) (dappName) (["provisionned",unAddressBech32 (changeAddress)])))
         , requested : 
            pipe ( TE.fromTask(runtime.wallet.getChangeAddress)
                 , TE.chainW ( (changeAddress) => fetchMySwaps (runtime) (dappName) (["provisionned"])))  
         , swapped : fetchMySwaps (runtime) (dappName) ["swapped"]
         , closed : fetchMySwaps (runtime) (dappName) ([])
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
            , TE.chain ( ({changeAddress,swapRequest}) => 
               runtime.initialise 
                  ({ contract: Swaps.mkSwapContract(swapRequest)
                      , roles: { [roles.provider] : changeAddress
                               , [roles.swapper] : swapperAddress}
                      , tags : { [dappName] : { swapRequest : swapRequest, note : request.note},
                                 [unAddressBech32 (changeAddress)] : {},
                                 "initialized" : {}  
                               }})))
      , provision : (swap) =>
         pipe( TE.Do
             , TE.bind ('changeAddress', () => TE.fromTask(runtime.wallet.getChangeAddress)) 
             , TE.chain ( ({changeAddress}) => 
                  runtime.applyInputs
                     (swap.contractId)
                     ((next) =>
                        ({ inputs : [pipe(next.applicable_inputs.deposits[0],toInput)]
                        , tags : { [dappName] : { swapRequest : swap.request, note : swap.note},
                                   [unAddressBech32 (changeAddress)] : {}, 
                                    "provisionned" : {}  }})
                                    ))) 
      , swap : (swap) => 
            runtime.applyInputs
               (swap.contractId)
               ((next) =>
                   ({ inputs : [pipe(next.applicable_inputs.deposits[0],toInput)]
                    , tags : { [dappName] : { swapRequest : swap.request, note : swap.note},
                               "swapped" : {}  
                             }}))    
     })
                                      
const fetchMySwaps : (runtime : Runtime) => (dappName: string) => (tags: string[]) =>TE.TaskEither<Error | DecodingError,MySwap[]> = 
   (runtime) => (dappName) => (tags) => 
      pipe 
         (runtime.restAPI.contracts.getHeadersByRange (O.none) ([dAppName].concat (tags))
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
                
         )))

