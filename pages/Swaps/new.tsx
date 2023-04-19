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
import {initialise} from 'marlowe-ts-sdk/src/runtime/write/command'
import { AxiosRestClient } from 'marlowe-ts-sdk/src/runtime/endpoints'
import { HexTransactionWitnessSet, MarloweTxCBORHex } from 'marlowe-ts-sdk/src/runtime/common/textEnvelope'
import * as Examples from 'marlowe-ts-sdk/src/language/core/v1/examples/swap'
import { datetoTimeout } from 'marlowe-ts-sdk/src/language/core/v1/semantics/contract/when'
import { token } from 'marlowe-ts-sdk/src/language/core/v1/semantics/contract/common/token'
import { addressBech32 } from 'marlowe-ts-sdk/src/runtime/common/address'


const waitConfirmation : (txHash : string ) => TE.TaskEither<Error,boolean> = (txHash) => TE.of (true) 
const signMarloweTx : (extension : BrowserWallet) => (cborHex :MarloweTxCBORHex) => TE.TaskEither<Error,HexTransactionWitnessSet> =
  (extension) => (cborHex) => TE.fromTask(() => extension.signTx(cborHex))

export const NewSwap = ({state }) => {
  const connectedWallet : Connected = state
  
  const defaultDeadlines = pipe(Date.now(),(date) => addDays(5,date),(date) => format(date,"yyyy-MM-dd'T'hh:mm"))
  const [amount ,setAmount] = useState<number>(0)
  const [unit ,setUnit] = useState<Unit>('lovelace')

  const getMaxAmount = (unit) => pipe(connectedWallet.assetBalances
    , A.findFirst((w : AssetExtended) => w.unit === unit) 
    , O.map (a => parseInt (a.quantity,10))
    , O.getOrElse(() => Number(0)) )

  const [amountToSwap ,setAmountToSwap] = useState<number>(0)
  const [policyIdToSwap ,setPolicyIdToSwap] = useState<string>('')
  const [tokenNameToSwap ,setTokenNameToSwap] = useState<string>('')
  const [recipient ,setRecipient] = useState<string>('')
  const [note ,setNote] = useState<string>('')
  const [submitFailed,setSubmitFailed] = useState<string>('')
  const [submitSucceed,setSubmitSucceed] = useState<string>('')


  const submit = async (event) => {
    event.preventDefault();
    const usedAddresses = await connectedWallet.walletsdk.getUsedAddresses ()
    const collaterals = await connectedWallet.walletsdk.getCollateral()
    const changeAddress = await connectedWallet.walletsdk.getChangeAddress ()
    const swapRequest = { adaDepositTimeout   : pipe(Date.now(),addDays(1),datetoTimeout)
                        , tokenDepositTimeout : pipe(Date.now(),addDays(2),datetoTimeout)
                        , amountOfADA   : 3n
                        , amountOfToken : 10n
                        , token :token(policyIdToSwap,tokenNameToSwap) }
    const swapWithExpectedInputs =  Examples.swapWithExpectedInputs(swapRequest)

    await pipe
      ( initialise 
          (AxiosRestClient('http://0.0.0.0:34104'))
          (waitConfirmation)
          (signMarloweTx(connectedWallet.walletsdk))
          ({ changeAddress: addressBech32(changeAddress)
            , usedAddresses: usedAddresses.length == 0 
                                ? O.none 
                                : pipe( usedAddresses
                                      , A.map(addressBech32)
                                      , O.some) 
            , collateralUTxOs: O.some(collaterals)})
          ({ contract: swapWithExpectedInputs.swap
              , roles: {'Ada provider'   : addressBech32(changeAddress) 
                        ,'Token provider' : addressBech32(recipient)}
              , version: 'v1'
              , metadata: {}
              , tags : { 'swap.react.demo' : 
                          { 'fromAddress' : changeAddress as any
                          , 'toAddress'   : recipient as any
                          , 'note'        : note as any}}
              , minUTxODeposit: 3_000_000})
      , TE.match (
          (error) => { console.log(error)
                       setSubmitFailed(JSON.stringify(error))},
          (contractDetails) => 
                     { console.log(contractDetails)
                       setSubmitSucceed(JSON.stringify(contractDetails)) })
      )()
  };

  console.log ("Render New Swap, currency" , unit)
  const fieldsetStyle = {
    border: '0px solid rgba(0, 0, 0, 0.05)', 
  };
  return (<>
      <br/>
      <Form onSubmit={submit}>
      <h4> Tokens Provided </h4>  
      <fieldset style={fieldsetStyle}>       
        <Form.Group  widths="equal" > 
          <Form.Field
              label="Asset"  
              control='select'
           
              value={unit}
              onChange= {(e) => {setUnit(e.target.value);setAmount(getMaxAmount(e.target.value))}} 
            > {connectedWallet.assetBalances.map(assetBalance => 
                  <option key={assetBalance.unit} value={assetBalance.unit}>
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
              max={getMaxAmount(unit)}
              min='0'
              onChange= {(e) => {setAmount(parseInt(e.target.value,10))}} 
              value ={amount} 
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
            type='number' 
            onChange= {(e) => {setAmountToSwap(parseInt(e.target.value,10))}} 
            value ={amountToSwap}   
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
            header='Marlowe Contract Initialised'
            content= {submitSucceed}
          /> : <></> }
        {(submitFailed !== '')? 
          <Message
            error
            header='Marlowe Contract Initialised'
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




