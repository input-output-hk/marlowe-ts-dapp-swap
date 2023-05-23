import React from 'react'
import {Button, Container, Form, Input} from 'semantic-ui-react'
import * as Marlowe from 'marlowe-ts-sdk/src/runtime/endpoints';
import {Connected} from 'pages/Hooks/Wallet';
import {contractId} from 'marlowe-ts-sdk/src/runtime/contract/id';
import {pipe} from 'fp-ts/lib/function';
import {Contract} from 'marlowe-ts-sdk/src/language/core/v1/semantics/contract';
import {DecodingError} from 'marlowe-ts-sdk/src/runtime/common/codec';
import {ContractDetails} from 'marlowe-ts-sdk/src/runtime/contract/details';
import {MarloweJSONCodec} from 'marlowe-ts-sdk/src/adapter/json';


interface Props {
  walletState: Connected;
}

export const FindContract = (props : Props) => {
  const [contract, setContract] = React.useState(null);
  return contract == null
    ? <FindContractSearch {...props} setContract={setContract} />
    : <ShowContract {...props} contract={contract} />;
};

const ShowContract = ({ contract }: Props & { contract : ContractDetails }) => {
  return <p>{MarloweJSONCodec.encode(contract)}</p>;
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

