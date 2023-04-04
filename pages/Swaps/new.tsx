import { pipe } from 'fp-ts/lib/function'
import React,  { useState } from 'react'
import { Icon, Message } from 'semantic-ui-react'
import { addDays } from 'date-fns/fp'
import {format} from 'date-fns'
import {
  Button,
  Form,
  TextArea,
} from 'semantic-ui-react'
import { Connected } from '../Hooks/Wallet'
import * as A from 'fp-ts/Array'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import * as O from 'fp-ts/Option'
import { AssetExtended, BrowserWallet, Unit } from '@meshsdk/core'

import * as Swaps from 'marlowe-ts-sdk/src/language/core/v1/examples/swaps/swap-token-token'
import { datetoTimeout } from 'marlowe-ts-sdk/src/language/core/v1/semantics/contract/when'
import { token } from 'marlowe-ts-sdk/src/language/core/v1/semantics/contract/common/token'
import { addressBech32 } from 'marlowe-ts-sdk/src/runtime/common/address'
import { MarloweJSONCodec } from 'marlowe-ts-sdk/src/adapter/json'


export const NewSwap = ({state }) => {
  const connectedWallet : Connected = state
  const findAssetOrProvideDefault = (unit) => pipe(connectedWallet.assetBalances
    , A.findFirst((w : AssetExtended) => w.unit === unit) 
    , O.getOrElse(() => 
        ({ unit: "lovelace"
        , policyId: ""
        , assetName: ""
        , fingerprint: ""
        , quantity: "0"}) ))
  const lovelaceAsset = findAssetOrProvideDefault ("lovelace")
          
  const getMaxAmount = (asset) => BigInt(asset.quantity)
  
  const defaultDeadlines = pipe(Date.now(),(date) => addDays(5,date),(date) => format(date,"yyyy-MM-dd'T'hh:mm"))
  const [amount ,setAmount] = useState<bigint>(0n)
  const [asset ,setAsset] = useState<AssetExtended>(lovelaceAsset)

  const [amountToSwap ,setAmountToSwap] = useState<bigint>(0n)
  const [policyIdToSwap ,setPolicyIdToSwap] = useState<string>('')
  const [tokenNameToSwap ,setTokenNameToSwap] = useState<string>('')
  const [recipient ,setRecipient] = useState<string>('')
  const [note ,setNote] = useState<string>('')
  const [submitFailed,setSubmitFailed] = useState<string>('')
  const [submitSucceed,setSubmitSucceed] = useState<string>('')


  const submit = async (event) => {
    event.preventDefault();
    const {marloweSDK,meshExtensionSDK} = connectedWallet
    const usedAddresses = await meshExtensionSDK.getUsedAddresses ()
    const collaterals = await meshExtensionSDK.getCollateral()
    const changeAddress = await meshExtensionSDK.getChangeAddress ()

    const swapRequest = { tokenA_DepositTimeout   : pipe(Date.now(),addDays(1),datetoTimeout)
                        , tokenB_DepositTimeout : pipe(Date.now(),addDays(2),datetoTimeout)
                        , tokenA   : token(asset.policyId,asset.assetName)
                        , tokenA_Amount : amount
                        , tokenB : token(policyIdToSwap,tokenNameToSwap)
                        , tokenB_Amount : amountToSwap }
    const swap =  Swaps.swap_tokenA_tokenB(swapRequest)

    await pipe
      ( marloweSDK.initialise 
          (changeAddress,usedAddresses,collaterals)
          ({ contract: swap
              , roles: {'Ada provider'   : addressBech32(changeAddress) 
                        ,'Token provider' : addressBech32(recipient)}
              , version: 'v1'
              , metadata: {}
              , tags : {'swap.L1.dapp.by.marlowe.team' : { 'note' : note }
                       ,"initialised" : {}}
              , minUTxODeposit: 3_000_000})
      , TE.chainFirst ( () => marloweSDK.fetchInitializeContracts)
      , TE.match (
          (error) => { console.log(error)
                       setSubmitFailed(JSON.stringify(error))
                       setSubmitSucceed('')},
          (initializeContracts) => 
                     { console.log(initializeContracts)
                       setSubmitSucceed(MarloweJSONCodec.encode(initializeContracts))
                       setSubmitFailed('') })
      )()
  };

  console.log ("Render New Swap, current asset" , asset)
  const fieldsetStyle = {
    border: '0px solid rgba(0, 0, 0, 0.05)', 
  };
  return (<>
      <br/>
      <Form onSubmit={submit} success={submitSucceed !== ''} error={submitFailed !== ''}>
      <h4> Tokens Provided </h4>  
      <fieldset style={fieldsetStyle}>       
        <Form.Group  widths="equal" > 
          <Form.Field
              label="Asset"  
              control='select'
              value={asset.unit}
              onChange= {(e) => {setAsset(findAssetOrProvideDefault(e.target.value));setAmount(getMaxAmount(asset))}} 
            > {connectedWallet.assetBalances.map(assetBalance => 
                  <option key={assetBalance.unit} value={assetBalance.unit} >
                    {assetBalance.assetName === '' ? 'Lovelaces':
                      assetBalance.assetName + ' (' + assetBalance.fingerprint+')'}
                  </option>
                 )
              }
            
          </Form.Field>
          <Form.Input 
              label="Amount" 
              type='number' 
              step='0' 
              max={getMaxAmount(asset)}
              min='0'
              onChange= {(e) => {setAmount(BigInt(e.target.value))}} 
              defaultValue="0"
              
                />
        </Form.Group>
      </fieldset>
      <h4> Tokens Requested </h4> 
      <fieldset style={fieldsetStyle}>        
        <Form.Group widths='equal'>  
          <Form.Input
            id='policyId' 
            label="Policy Id"  
            value={policyIdToSwap} 
            onChange= {(e) => {setPolicyIdToSwap(e.target.value)}} 
             />
          <Form.Input
            id='tokenName' 
            label="Token Name"  
            value={tokenNameToSwap} 
            onChange= {(e) => {setTokenNameToSwap(e.target.value)}} 
             />
          </Form.Group>
          <Form.Group >
          <Form.Input  
            label="Amount"
            min="0"
            defaultValue="0"
            type='number' 
            onChange= {(e) => {setAmountToSwap(BigInt(e.target.value))}}   
            width={4}  />
          
        </Form.Group>
      </fieldset>
        <Form.Group >
          <Form.Input 
            id='recipient' 
            label='Adressed to' 
            placeholder='Recipient address'
            onChange= {(e) => {setRecipient(e.target.value)}} 
            value={recipient} 
            width={10} />
        
        </Form.Group>  
        <Form.Field
          control={TextArea}
          id='note'
          label='Note'
          onChange= {(e) => {setNote(e.target.value)}}
          value={note} 
          placeholder='Add a note about you swap ...'
        />
         <Form.Group inline >
          <Form.Input
            label='Deadline'
            type='datetime-local'
            defaultValue= {defaultDeadlines}
          />
        </Form.Group>
        {(submitSucceed !== '')? 
          <Message
            success
            header='Marlowe Contract Initialized'
            content= {submitSucceed}
          /> : <></> }
        {(submitFailed !== '')? 
          <Message
            error
            header='Marlowe Contract Initialization Failed'
            content= {submitFailed}
          /> : <></> }
        <span>
        N.B  <br/>
        * Creating this swap request will cost you 1.5 ₳ Transaction fees <br/>
        * Cancelling this swap request will cost you 1.5 ₳ Transaction fees <br/><br/>
        </span>
 
        <Form.Field control={Button}>Sign & Submit</Form.Field>
      </Form>
      </>
    )
}




