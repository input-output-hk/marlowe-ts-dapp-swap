import { pipe } from 'fp-ts/lib/function'
import React,  { useState } from 'react'
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
import { token } from 'marlowe-ts-sdk/src/language/core/v1/semantics/contract/common/token'
import { addressBech32 } from 'marlowe-ts-sdk/src/runtime/common/address'
import { MarloweJSONCodec } from 'marlowe-ts-sdk/src/adapter/json'
import { Contract } from 'marlowe-ts-sdk/src/language/core/v1/semantics/contract'
import {formatValidationErrors} from 'jsonbigint-io-ts-reporters'

export const NewContract = ({state }) => {
  const connectedWallet : Connected = state


  const [contractAsString ,setContractAsString] = useState<string>('')

  const [submitFailed,setSubmitFailed] = useState<string>('')
  const [submitSucceed,setSubmitSucceed] = useState<string>('')


  const submit = async (event) => {
    event.preventDefault();
    const {runtime} = connectedWallet

    await pipe
      ( TE.Do 
      , TE.bind('contractAsJSON', () => TE.of(MarloweJSONCodec.decode(contractAsString)))
      , TE.bindW('contractTyped', ({contractAsJSON}) => 
              TE.fromEither(pipe( Contract.decode(contractAsJSON)
                                , E.mapLeft(formatValidationErrors))))
      , TE.chainW (({contractTyped}) => 
              runtime.initialise({ contract:  contractTyped})) 
      , TE.match (
          (error) => { console.log(error)
                       setSubmitFailed(JSON.stringify(error))
                       setSubmitSucceed('')},
          (contractId) => 
                     { 
                       setSubmitSucceed('Contract created. Contract ID: ' + contractId + '#1'  ) 
                       setSubmitFailed('') })
      )()
  };

  const fieldsetStyle = {
    border: '0px solid rgba(0, 0, 0, 0.05)', 
  };
  return (<>
      <br/>
      <Form onSubmit={submit} success={submitSucceed !== ''} error={submitFailed !== ''}>
      
        <Form.Field
          control={TextArea}
          id='contractRaw'
          label='Contract As a JSON'
          onChange= {(e) => {setContractAsString(e.target.value)}}
          value={contractAsString} 
          placeholder='Copy/Paste you Contract JSON here....'
        />
         
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
 
        <Form.Field control={Button}>Sign & Submit</Form.Field>
      </Form>
      </>
    )
}




