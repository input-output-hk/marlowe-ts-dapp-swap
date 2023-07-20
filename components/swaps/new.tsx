import { pipe } from 'fp-ts/lib/function'
import React,  { useEffect, useState } from 'react'
import { Message } from 'semantic-ui-react'
import { addDays } from 'date-fns/fp'
import {format} from 'date-fns'
import {
  Button,
  Form,
  TextArea,
} from 'semantic-ui-react'
import { Connected } from '../hooks/Wallet'
import * as A from 'fp-ts/Array'
import * as TE from 'fp-ts/TaskEither'
import * as O from 'fp-ts/Option'
import { AssetExtended } from '@meshsdk/core'
import * as E from 'fp-ts/Either'
import { datetoTimeout } from 'marlowe-ts-sdk/src/language/core/v1/semantics/contract/when'

import { addressBech32 } from 'marlowe-ts-sdk/src/runtime/common/address'
import { TokenValue,adaValue, tokenValue } from 'marlowe-ts-sdk/src/language/core/v1/semantics/contract/common/tokenValue'
import * as TV from  'marlowe-ts-sdk/src/language/core/v1/semantics/contract/common/tokenValue'
import { Token, adaToken, token } from 'marlowe-ts-sdk/src/language/core/v1/semantics/contract/common/token'
import { contractId } from 'marlowe-ts-sdk/src/runtime/contract/id'
const findTokenValue = (tokenValues : TokenValue[]) => (token:Token) => 
  pipe(tokenValues
      , A.findFirst((w : TokenValue) => w.token === token)
      , O.getOrElse(() => adaValue (0n)))

export const NewSwap = ({state}) => {

  const connected : Connected = state
  const {runtime} = connected
          
  const getMaxAmount = (tokenValue:TokenValue) => tokenValue.amount
  
  const defaultDeadlines = pipe(Date.now(),(date) => addDays(5,date),(date) => format(date,"yyyy-MM-dd'T'hh:mm"))
  const [tokenValues ,setTokenValues] = useState<TokenValue[]>([])

  const [providerAmount ,setProviderAmount] = useState<bigint>(0n)
  const [providerToken ,setProviderToken] = useState<Token>(adaToken)

  const [swapperAmount ,setSwapperAmount] = useState<bigint>(0n)
  const [swapperTokenCurrencySymbol ,setSwapperTokenCurrencySymbol] = useState<string>('')
  const [swapperTokenName ,setSwapperTokenName] = useState<string>('')
  const [swapperAddress ,setSwapperAddress] = useState<string>('')
  const [note ,setNote] = useState<string>('')
  const [submitFailed,setSubmitFailed] = useState<string>('')
  const [submitSucceed,setSubmitSucceed] = useState<string>('')

  useEffect(() => {
    console.log("getTokenValues")
    pipe(runtime.wallet.getTokenValues,TE.map(values => setTokenValues(values)) )()
  }, [runtime]);

  const submit = async (event) => {
    event.preventDefault();
    const {swapServices} = state
    // await pipe
    //   ( runtime.withdraw ( { contractId : contractId("ea3e08b09afabdb068782232501d3679c07f00302e31973b38297c2995d4626c#1"), role : "WithdrawalTest1"})
          
    //   , TE.match (
    //       (error) => { console.log(error)
    //                    setSubmitFailed(JSON.stringify(error))
    //                    setSubmitSucceed('')},
    //       () => 
    //                  { 
    //                    setSubmitSucceed('Successfully created your swap')
    //                    setSubmitFailed('') })
    //   )()
    await pipe
      ( swapServices.initialize
          (addressBech32 (swapperAddress) )
          ({ note : note
           , provider : 
              { depositTimeout   : pipe(Date.now(),addDays(1),datetoTimeout)      
              , value : tokenValue (providerAmount)(providerToken)}
           , swapper : 
              { depositTimeout : pipe(Date.now(),addDays(2),datetoTimeout)
              , value : tokenValue (swapperAmount) (token(swapperTokenCurrencySymbol,swapperTokenName))}}) 
          
      , TE.match (
          (error) => { console.log(error)
                       setSubmitFailed(JSON.stringify(error))
                       setSubmitSucceed('')},
          () => 
                     { 
                       setSubmitSucceed('Successfully created your swap')
                       setSubmitFailed('') })
      )()
  };

  console.log ("Render New Swap, current asset" , tokenValues)
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
              label="Token"  
              control='select'
              value={providerToken}
              onChange= {(e) => {setProviderToken(token(e.target.value[0],e.target.value[1]));setProviderAmount(getMaxAmount(e.target.value[2]))}} 
            > {tokenValues.map(tokenValue => 
                  <option key={TV.toString(tokenValue)} value={[tokenValue.token.currency_symbol,tokenValue.token.token_name,tokenValue.amount.toString()]} >
                    {tokenValue.token.currency_symbol === '' ? 'Lovelaces':
                      tokenValue.token.token_name + ' (' + tokenValue.token.currency_symbol+')'}
                  </option>
                 )
              }
            
          </Form.Field>
          <Form.Input 
              label="Amount" 
              type='number' 
              step='0' 
              max={findTokenValue(tokenValues)(providerToken).amount}
              min='0'
              onChange= {(e) => {setProviderAmount(BigInt(e.target.value))}} 
              defaultValue="0"
              
                />
        </Form.Group>
      </fieldset>
      <h4> Tokens Requested </h4> 
      <fieldset style={fieldsetStyle}>        
        <Form.Group widths='equal'>  
          <Form.Input
            id='CurrencySymbol' 
            label="Currency Symbol"  
            value={swapperTokenCurrencySymbol} 
            onChange= {(e) => {setSwapperTokenCurrencySymbol(e.target.value)}} 
             />
          <Form.Input
            id='SwapperTokenName' 
            label="Token Name"  
            value={swapperTokenName} 
            onChange= {(e) => {setSwapperTokenName(e.target.value)}} 
             />
          </Form.Group>
          <Form.Group >
          <Form.Input  
            label="Amount"
            min="0"
            defaultValue="0"
            type='number' 
            onChange= {(e) => {setSwapperAmount(BigInt(e.target.value))}}   
            width={4}  />
          
        </Form.Group>
      </fieldset>
        <Form.Group >
          <Form.Input 
            id='SwapperAddress' 
            label='Adressed to' 
            placeholder='Swapper Address'
            onChange= {(e) => {setSwapperAddress(e.target.value)}} 
            value={swapperAddress} 
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





