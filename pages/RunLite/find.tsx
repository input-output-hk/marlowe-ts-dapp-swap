import React from 'react'
import {Button, Container, Form, Input} from 'semantic-ui-react'
import * as Marlowe from 'marlowe-ts-sdk/src/runtime/endpoints';
import {Connected} from 'pages/Hooks/Wallet';
import {ContractId, contractId} from 'marlowe-ts-sdk/src/runtime/contract/id';
import {pipe} from 'fp-ts/lib/function';
import {Contract} from 'marlowe-ts-sdk/src/language/core/v1/semantics/contract';
import {DecodingError} from 'marlowe-ts-sdk/src/runtime/common/codec';
import {ContractDetails} from 'marlowe-ts-sdk/src/runtime/contract/details';
import {MarloweJSONCodec} from 'marlowe-ts-sdk/src/adapter/json';
import { useWallet } from '@meshsdk/react';
import { setDefaultResultOrder } from 'dns/promises';
import { MarloweVersion } from 'marlowe-ts-sdk/src/runtime/common/version';
import { array } from 'fp-ts';


interface Props {
  walletState: Connected;
}

export const FindContract = (props : Props) => {
  const [contract, setContract] = React.useState(null);
  return (
    <>
      <FindContractSearch {...props} setContract={setContract} />
      {!!contract && <ShowContract {...props} contract={contract} />}
    </>
  );
};

type ContractAction = "choose" | "deposit";

const ShowContract = ({ contract, walletState }: Props & { contract : ContractDetails }) => {
  const [currentAction, setCurrentAction] = React.useState<ContractAction>();
  const [isSubmitting, setSubmitting] = React.useState(false);
  return (
    <Container>
      {MarloweJSONCodec.encode(contract)}
      {currentAction
        ? <>
          {currentAction == "deposit"
              ? <DepositForm contractId={contract.contractId} walletState={walletState} setSubmitting={setSubmitting} />
              : <ChoiceForm contractId={contract.contractId} walletState={walletState} setSubmitting={setSubmitting} />
          }
          <Button onClick={() => setCurrentAction(undefined)}>Cancel</Button>
          </>
        : <>
            <Button onClick={() => setCurrentAction("deposit")}>Deposit</Button>
            <Button onClick={() => setCurrentAction("choose")}>Make choice</Button>
            <Button>Notify</Button>
            <Button onClick={() => advanceContract(contract, walletState)}>Advance</Button>
          </>
      }
    </Container>
  );
};

const DepositForm = ({ contractId, walletState }: Props & { contractId : ContractId, setSubmitting: (isSubmitting: boolean) => void }) => {
  return <></>;
};

const ChoiceForm = ({ contractId, walletState }: Props & { contractId : ContractId, setSubmitting: (isSubmitting: boolean) => void }) => {
  return <></>;
};

const FindContractSearch = ({ walletState: { marloweSDK }, setContract }: Props & { setContract: (contract: ContractDetails) => void }) => {
  const [inputContractId, setContractId] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | DecodingError>();
  const findContract = async () => {
    setIsLoading(true);
    try {
        const result = await marloweSDK.restAPI.contracts.contract.get(contractId(inputContractId))();
        switch (result._tag) {
          case "Left":
            setError(result.left);
            break;
          case "Right":
            setContract(result.right);
            break;
        };
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Container>
      <Form>
        <Form.Field>
          <Input error={!!error} loading={isLoading} placeholder='Enter Contract ID' value={inputContractId} onChange={(event) => setContractId(event.target.value)}/>
        </Form.Field>
        <Button disabled={!inputContractId} onClick={!!inputContractId ? findContract : () => {}}>Find contract</Button>
      </Form>
    </Container>
  );
}

async function advanceContract(contractDetails : ContractDetails, walletState : Connected) {
  const {marloweSDK} = walletState;
  // const [contract, setContract] = React.useState(null);
  // const [isLoading, setIsLoading] = React.useState(false);
  // const [error, setError] = React.useState<Error | DecodingError>();
  // setIsLoading(true);
  // try {
    const result = await marloweSDK.commands.applyInputs(contractDetails.contractId)({ version: "v1"
                                                                                     , inputs: new Array()
                                                                                     , metadata: {}
                                                                                     , tags : {}
                                                                                     })();
    switch (result._tag) {
      case "Left":
        // setError(result.left);
        break;
      case "Right":
        // setContract(result.right.outputContract);
        break;
    };

  // } catch (err) {
  //   setError(err)
  // } finally {
  //   setIsLoading(false);
  // }

}



