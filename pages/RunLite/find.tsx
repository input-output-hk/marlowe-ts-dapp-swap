import {pipe} from 'fp-ts/lib/function';
import * as O from 'fp-ts/lib/Option';
import {MarloweJSONCodec} from 'marlowe-ts-sdk/src/adapter/json';
import {InputChoice} from 'marlowe-ts-sdk/src/language/core/v1/semantics/contract/when/input/choice';
import {InputDeposit} from 'marlowe-ts-sdk/src/language/core/v1/semantics/contract/when/input/deposit';
import {DecodingError} from 'marlowe-ts-sdk/src/runtime/common/codec';
import {ContractDetails} from 'marlowe-ts-sdk/src/runtime/contract/details';
import {ContractId, contractId} from 'marlowe-ts-sdk/src/runtime/contract/id';
import {Connected} from 'pages/Hooks/Wallet';
import React from 'react';
import {Button, Container, Divider, Form, Input, Label, SemanticCOLORS, Table} from 'semantic-ui-react';

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
  async function advanceContract(isNotify : boolean = false) {
    const {marloweSDK} = walletState;
    setSubmitting(true);
    try {
      const result = await marloweSDK.commands.applyInputs(contract.contractId)({ version: "v1"
                                                                                , inputs: isNotify ? ['input_notify' ] : []
                                                                                , metadata: {}
                                                                                , tags : {}
                                                                                })();
      switch (result._tag) {
        case "Left":
          console.log(result.left)
          alert(result.left.toString())
          break;
        case "Right":
          alert(isNotify?"contract notified":"contract advanced");
          break;
      };

    } finally {
      setSubmitting(false);
    }

  }

  const [color, status] = pipe(
    contract.utxo,
    O.match(
      () => ["green" as SemanticCOLORS, "Closed"],
      () => ["blue" as SemanticCOLORS, "Open"],
    ),
  );

  return (
    <Container>
      <Divider />
      <Table color={color} celled striped>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell colSpan='3'>Contract Details <Label color={color}>{status}</Label></Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          <Table.Row>
            <Table.Cell collapsing>Contract ID</Table.Cell>
            <Table.Cell>{contract.contractId.toString()}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell collapsing>Roles currency</Table.Cell>
            <Table.Cell>{contract.roleTokenMintingPolicyId.toString()}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell collapsing>Marlowe version</Table.Cell>
            <Table.Cell>{contract.version.toString()}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell collapsing>Metadata</Table.Cell>
            <Table.Cell><pre>{JSON.stringify(contract.metadata, undefined, 2)}</pre></Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell collapsing>Initial contract</Table.Cell>
            <Table.Cell><pre>{JSON.stringify(JSON.parse(MarloweJSONCodec.encode(contract.initialContract)), undefined, 2)}</pre></Table.Cell>
          </Table.Row>
          {pipe(
            contract.currentContract,
            O.match(
              () => <></>,
              (c) => (
                <Table.Row>
                  <Table.Cell collapsing>Current contract</Table.Cell>
                  <Table.Cell><pre>{JSON.stringify(JSON.parse(MarloweJSONCodec.encode(c)), undefined, 2)}</pre></Table.Cell>
                </Table.Row>
              )
            ),
          )}
          {pipe(
            contract.state,
            O.match(
              () => <></>,
              (state) => (
                <>
                  <Table.Row>
                    <Table.Cell collapsing>Accounts</Table.Cell>
                    <Table.Cell><pre>{JSON.stringify(JSON.parse(MarloweJSONCodec.encode(state.accounts)), undefined, 2)}</pre></Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell collapsing>Bound values</Table.Cell>
                    <Table.Cell><pre>{JSON.stringify(JSON.parse(MarloweJSONCodec.encode(state.boundValues)), undefined, 2)}</pre></Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell collapsing>Choices</Table.Cell>
                    <Table.Cell><pre>{JSON.stringify(JSON.parse(MarloweJSONCodec.encode(state.choices)), undefined, 2)}</pre></Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell collapsing>Min time</Table.Cell>
                    <Table.Cell>{state.minTime.toString()}</Table.Cell>
                  </Table.Row>
                </>
              )
            ),
          )}
        </Table.Body>
      </Table>
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
            <Button onClick={() => advanceContract(true)}>Notify</Button>
            <Button onClick={() => advanceContract()}>Advance</Button>
          </>
      }
    </Container>
  );
};

const DepositForm = ({ contractId, walletState, setSubmitting }: Props & { contractId : ContractId, setSubmitting: (isSubmitting: boolean) => void }) => {
  const [partyAddress, setPartyAddress] = React.useState("");
  const [accountAddress, setAccountAddress] = React.useState("");
  const [isAda, setIsAda] = React.useState(true);
  const [currency_symbol, setCurrencySymbol] = React.useState("");
  const [token_name, setTokenName] = React.useState("");
  const [depositValue, setChosenValue] = React.useState(0);
  const submit = async () => {
    setSubmitting(true);
    try {
      const input: InputDeposit = {
        input_from_party: {
          address: partyAddress,
        },
        that_deposits: BigInt(depositValue),
        of_token: {
          currency_symbol: isAda ? "" : currency_symbol,
          token_name: isAda ? "" : token_name,
        },
        into_account: {
          address: accountAddress,
        },
      };
      const result = await walletState.marloweSDK.commands.applyInputs(contractId)({
        version: "v1",
        inputs: [input],
        metadata: {},
        tags: {},
      })();
      switch (result._tag) {
        case "Left":
          alert(result.left);
          break;
        case "Right":
          alert("It worked");
          break;
      }
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <Form>
      <Form.Input label="Deposit from" value={partyAddress} onChange={(ev) => setPartyAddress(ev.target.value)} />
      <Form.Input label="Asset quantity" type="number" value={depositValue} onChange={(ev) => setChosenValue(parseInt(ev.target.value))} />
      <Form.Checkbox label="ADA" checked={isAda} onChange={(_, data) => setIsAda(data.checked)} />
      <Form.Input label="Asset currency" disabled={isAda} value={currency_symbol} onChange={(ev) => setCurrencySymbol(ev.target.value)} />
      <Form.Input label="Asset token" disabled={isAda} value={token_name} onChange={(ev) => setTokenName(ev.target.value)} />
      <Form.Input label="Into account" value={accountAddress} onChange={(ev) => setAccountAddress(ev.target.value)} />
      <Form.Button onClick={submit}>Submit</Form.Button>
    </Form>
  );
};

const ChoiceForm = ({ contractId, walletState, setSubmitting }: Props & { contractId : ContractId, setSubmitting: (isSubmitting: boolean) => void }) => {
  const [choiceName, setChoiceName] = React.useState("");
  const [choiceParty, setChoiceParty] = React.useState("");
  const [chosenValue, setChosenValue] = React.useState(0);
  const submit = async () => {
    setSubmitting(true);
    try {
      const input: InputChoice = {
        input_that_chooses_num: BigInt(chosenValue),
        for_choice_id: {
          choice_name: choiceName,
          choice_owner: {
            address: choiceParty
          }
        },
      };
      const result = await walletState.marloweSDK.commands.applyInputs(contractId)({
        version: "v1",
        inputs: [input],
        metadata: {},
        tags: {},
      })();
      switch (result._tag) {
        case "Left":
          alert(result.left);
          break;
        case "Right":
          alert("It worked");
          break;
      }
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <Form>
      <Form.Input label="Choice name" value={choiceName} onChange={(ev) => setChoiceName(ev.target.value)} />
      <Form.Input label="Choice party" value={choiceParty} onChange={(ev) => setChoiceParty(ev.target.value)} />
      <Form.Input label="Chosen value" type="number" value={chosenValue} onChange={(ev) => setChosenValue(parseInt(ev.target.value))} />
      <Form.Button onClick={submit}>Submit</Form.Button>
    </Form>
  );
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



