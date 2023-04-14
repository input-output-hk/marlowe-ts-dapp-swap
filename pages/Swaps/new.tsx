import React,  { Component, useContext, useEffect, useReducer, useState } from 'react'
import { Container, Dropdown, Icon, Label, Loader, Menu } from 'semantic-ui-react'
import  Logo  from './marlowe-logo.svg'
import * as A from 'fp-ts/Array'
import * as T from 'fp-ts/Task'
import * as O from 'fp-ts/Option'
import { CardanoWallet, WalletContext, useLovelace, useNetwork, useWallet, useWalletList,  } from '@meshsdk/react'

import { Segment, Tab } from 'semantic-ui-react'
import { useFieldArray, useForm } from "react-hook-form";
import {
  Button,
  Checkbox,
  Form,
  Input,
  Radio,
  Select,
  TextArea,
} from 'semantic-ui-react'



export const NewSwap = (onValidSubmission) => {
  type Currency = 'Djed' | '₳'
  const [amount ,SetAmount] = useState<number>(0)
  const [currency ,SetCurrency] = useState<Currency>('Djed')
  const [amountToSwap ,SetAmountToSwap] = useState<number>(0)
  const [currencyToSwap ,SetCurrencyToSwap] = useState<Currency>('₳')
  const ratioDjedToAda : number = 3
  const updateAmountAndCurrencyToSwap = (event) => {
    const newCurrency = event.target.value
    SetCurrency (newCurrency)
    if(newCurrency == 'Djed') {
      SetAmountToSwap(amount * ratioDjedToAda);
      SetCurrencyToSwap('₳')
    } else {
      SetAmountToSwap(amount / ratioDjedToAda)
      SetCurrencyToSwap('Djed')
    }
  }
  const submit = async (event) => {
    event.preventDefault();

    console.log(event);
  };
  console.log ("Render New Swap")
  return (<>
      <br/>
      <Form onSubmit={submit}>
        <Form.Group >
          <Form.Input 
            id='recipient' 
            label='Adressed to' 
            placeholder='Recipient address' 
            width={10} />
        
        </Form.Group>  
        <Form.Group inline >
          <Form.Input
            label='Deadline'
            type='datetime-local'
          />
        </Form.Group>
        
        <Form.Group inline > 
          <Form.Input 
              label="Amount" 
              type='number' 
              step='0' 
              value ={amount} 
              width={4}  />
          <Form.Field  control='select' value={currency} onChange={updateAmountAndCurrencyToSwap}  >
            <option value='Djed' >Djed</option>
            <option value='₳'>₳</option>
          </Form.Field> 
          <Icon name='angle right' color='grey' size='large' /> 
          <Form.Input  
            value={amountToSwap}   
            type='number' 
            readOnly  
            width={4}  />
          <Form.Input  
            value={currencyToSwap} 
            readOnly 
            width={2} />
          <span> (* ratio 1 Djed = {ratioDjedToAda} ₳  )</span>
        </Form.Group>

        <Form.Field
          control={TextArea}
          id='note'
          label='Note'
          placeholder='Add a note about you swap ...'
        />
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




