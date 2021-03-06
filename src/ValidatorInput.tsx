import React, { useState } from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import JSONPretty from "react-json-pretty";
import Details from "./Details";
import "./assets/css/App.css";
import Validator from "./Validator";
import { parse, ParsedSwift, useAccountInput } from "./utils";

interface ValidatorInputState {
  orderJSON: ParsedSwift;
  transactionJSON: ParsedSwift;
  mappedSwifts: ParsedSwift[];
}

function ValidatorInput(): JSX.Element {
  const [state, setState] = useState<ValidatorInputState>({
    orderJSON: {} as ParsedSwift,
    transactionJSON: {} as ParsedSwift,
    mappedSwifts: []
  });

  const accounts = useAccountInput([]);

  function onOrderChange(event: React.FormEvent<HTMLInputElement>): void {
    const value = event.currentTarget.value || "";
    setState({ ...state, orderJSON: parse(value) });
  }

  function onTransactionChange(event: React.FormEvent<HTMLInputElement>): void {
    const value = event.currentTarget.value || "";
    setState({ ...state, transactionJSON: parse(value) });
  }

  return (
    <Container className="mb-2 mt-sm-2">
      <Row>
        <Col>
          <Form>
            <Form.Group controlId="exampleForm.ControlTextarea1">
              <Form.Control
                placeholder="Swift order"
                as="textarea"
                rows="20"
                onChange={onOrderChange}
              />
            </Form.Group>
          </Form>
        </Col>
        <Col>
          <Form>
            <Form.Group controlId="exampleForm.ControlTextarea1">
              <Form.Control
                placeholder="Swift transaction"
                as="textarea"
                rows="20"
                onChange={onTransactionChange}
              />
            </Form.Group>
          </Form>
        </Col>
      </Row>
      <Row>
        <Col xs={12}>
          <Validator
            orderJSON={state.orderJSON}
            transactionJSON={state.transactionJSON}
            accounts={accounts.value}
          />
        </Col>
      </Row>
      <hr className="col-xs-12" />
      <Row>
        <Col xs={6}>
          <Details parsedSwift={state.orderJSON} />
        </Col>
        <Col xs={6}>
          <Details parsedSwift={state.transactionJSON} />
        </Col>
      </Row>
      <Row>
        <Col xs={6}>
          <JSONPretty data={state.orderJSON} />
        </Col>
        <Col xs={6}>
          <JSONPretty data={state.transactionJSON} />
        </Col>
      </Row>
      <Row>
        <Col>
          <Form>
            <Form.Group controlId="exampleForm.ControlTextarea1">
              <Form.Control
                placeholder="Accounts"
                as="textarea"
                rows="5"
                onChange={accounts.handleChange}
              />
            </Form.Group>
          </Form>
        </Col>
      </Row>
      <Row>
        <Col>
          <JSONPretty data={accounts} />
        </Col>
      </Row>
    </Container>
  );
}

export default ValidatorInput;
