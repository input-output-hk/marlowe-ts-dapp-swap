import * as A from 'fp-ts/lib/Array.js'
import * as O from 'fp-ts/lib/Option.js'
import * as TE from 'fp-ts/lib/TaskEither.js'
import { constVoid, pipe } from 'fp-ts/lib/function.js'
// import { AddressBech32, unAddressBech32 } from '@marlowe.tmp/legacy-runtime/dist/common/address'
// import { DecodingError } from '@marlowe.tmp/legacy-runtime/dist//common/codec'
// import {Runtime} from '@marlowe.tmp/legacy-runtime/dist//runtime'

import * as Swaps from '@marlowe.tmp/language-core-v1/examples/swaps/swap-token-token'
// import { Timeout } from '@marlowe.tmp/language-core-v1/src/semantics/contract/when'
// import { TokenValue } from '@marlowe.tmp/language-core-v1/src/semantics/contract/common/tokenValue'
// import { ContractId } from '@marlowe.tmp/legacy-runtime/dist/contract/id'
// import { Predicate } from 'fp-ts/lib/Predicate'
// import { Tag } from '@marlowe.tmp/legacy-runtime/dist/common/metadata/tag'
import { PolicyId } from '@marlowe.tmp/legacy-runtime/common/policyId'
// import { toInput } from '@marlowe.tmp/language-core-v1/src/semantics/next/applicables/canDeposit'
import { Observable, distinctUntilChanged, from, interval, map, mergeMap, switchMap } from 'rxjs'
import * as E from 'fp-ts/lib/Either.js'
import { TokenValue } from '@marlowe.tmp/language-core-v1'

import { toInput } from '@marlowe.tmp/language-core-v1/next'
import { AddressBech32, unAddressBech32 } from '@marlowe.tmp/legacy-runtime/common/address'
import { DecodingError } from '@marlowe.tmp/legacy-runtime/common/codec'
import { ContractId } from '@marlowe.tmp/legacy-runtime/contract/id'
import { Runtime } from '@marlowe.tmp/legacy-runtime/runtime'
import { Timeout } from '@marlowe.tmp/language-core-v1/contract/when/index'

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

