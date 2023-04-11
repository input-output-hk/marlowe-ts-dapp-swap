import React,  { Component, useContext, useEffect, useReducer, useState } from 'react'
import { Container, Dropdown, Icon, Label, Loader, Menu } from 'semantic-ui-react'
import  Logo  from './marlowe-logo.svg'
import * as A from 'fp-ts/Array'
import * as T from 'fp-ts/Task'
import * as O from 'fp-ts/Option'
import { CardanoWallet, WalletContext, useLovelace, useNetwork, useWallet, useWalletList,  } from '@meshsdk/react'

import { Segment, Tab } from 'semantic-ui-react'

import {
  Button,
  Checkbox,
  Form,
  Input,
  Radio,
  Select,
  TextArea,
} from 'semantic-ui-react'

const options = [
  { key: '1h', text: '1 hour', value: '1h' },
  { key: '3h', text: '3 hours', value: '3h' },
  { key: '1d', text: '1 d', value: '1d' },
  { key: '1w', text: '1 week', value: '1w' },
]
export class NewSwap extends Component {
  state = {}

  handleChange = (e, { value }) => this.setState({ value })

  render() {
    const { value } = this.state
    return (<>
      <br/>
      <Form >
        <Form.Group >
          <Form.Input label='Adressed to' placeholder='Recipient address' width={10} />
        
        </Form.Group>  
        <Form.Group inline >
          <Form.Select
            label='Valid for'
            options={options}
            placeholder='1 hour'
          />
        </Form.Group>
        <Form.Group inline><label>Rate :</label> 1 djed = 2 ₳ </Form.Group>

        <Form.Field
          control={TextArea}
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
}


