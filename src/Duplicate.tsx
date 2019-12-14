import React, { useState } from "react";
import "./assets/css/App.css";
import Badge from "react-bootstrap/Badge";
import Table from "react-bootstrap/Table";
import Row from "react-bootstrap/Row";
import Container from "react-bootstrap/Container";
import {
  BootstrapTable,
  BootstrapTableProps,
  TableHeaderColumn
} from "react-bootstrap-table";
import { Block4, findType, parse, ParsedSwift } from "./utils";
import { Col, Form } from "react-bootstrap";
import { isEqual } from "underscore";

interface TransactionDetails extends Readonly<BootstrapTableProps> {
  valueDate: string;
  exoticCurr: string;
  usdCurr: string;
}

interface DuplicateProps {
  mappedSwifts: ParsedSwift[];
  duplicateValues: ParsedSwift[];
  isDuplicate: boolean;
}

function renderDetails(mappedSwifts: ParsedSwift[]): JSX.Element {
  const mappedValues: TransactionDetails[] = mappedSwifts.map(
    (value: ParsedSwift) => {
      const valueDate = findType(value, "98", "A", "VALU");
      const exoticCurr = findType(value, "19", "B", "NETT");
      const usdCurr = findType(value, "19", "B", "PSTA");

      if (valueDate && exoticCurr && usdCurr) {
        return {
          valueDate: valueDate.ast.Date,
          exoticCurr:
            exoticCurr.ast.Amount + " " + exoticCurr.ast["Currency Code"],
          usdCurr: usdCurr.ast.Amount + " " + usdCurr.ast["Currency Code"]
        } as TransactionDetails;
      } else {
        return {
          valueDate: "Unable to display",
          exoticCurr: "Unable to display",
          usdCurr: "Unable to display"
        } as TransactionDetails;
      }
    }
  );

  return (
    <BootstrapTable data={mappedValues} striped hover>
      <TableHeaderColumn isKey dataField="valueDate" dataSort={true}>
        Value Date
      </TableHeaderColumn>
      <TableHeaderColumn dataField="exoticCurr" dataSort={true}>
        Exotic Currency
      </TableHeaderColumn>
      <TableHeaderColumn dataField="usdCurr" dataSort={true}>
        USD Currency
      </TableHeaderColumn>
    </BootstrapTable>
  );
}

function renderRow(
  valueDate: Block4,
  exoticCurr: Block4,
  usdCurr: Block4,
  index: number
): JSX.Element {
  return (
    <tr className="singleDuplicate" key={index}>
      <td>{valueDate.ast.Date}</td>
      <td>
        {exoticCurr.ast.Amount} {exoticCurr.ast["Currency Code"]}
      </td>
      <td>
        {usdCurr.ast.Amount} {usdCurr.ast["Currency Code"]}
      </td>
    </tr>
  );
}

function renderDuplicateDetails(duplicateValues: ParsedSwift[]): JSX.Element[] {
  return duplicateValues.map((value: ParsedSwift, index: number) => {
    const valueDate = findType(value, "98", "A", "VALU");
    const exoticCurr = findType(value, "19", "B", "NETT");
    const usdCurr = findType(value, "19", "B", "PSTA");

    if (valueDate && exoticCurr && usdCurr) {
      return renderRow(valueDate, exoticCurr, usdCurr, index);
    } else {
      return (
        <tr>
          <td>Unable to display</td>
          <td>Unable to display</td>
          <td>Unable to display</td>
        </tr>
      );
    }
  });
}

function badge(isDuplicate: boolean): JSX.Element {
  return isDuplicate ? (
    <Badge pill variant="danger">
      {" "}
      Is duplicate{" "}
    </Badge>
  ) : (
    <Badge pill variant="success">
      {" "}
      Is not duplicate{" "}
    </Badge>
  );
}

async function duplicateCheck(
  event: React.FormEvent<HTMLInputElement>
): Promise<DuplicateProps> {
  const target = event.target as HTMLInputElement;
  const swifts = (target.value || "").split(/\n{2,}/);
  const mappedSwifts = swifts.map(parse);
  const duplicatedOrders = mappedSwifts.filter((order: ParsedSwift) => {
    return (
      mappedSwifts.filter((swift: ParsedSwift) => {
        return isEqual(swift, order);
      }).length > 1
    );
  });
  const duplicateDetected = duplicatedOrders.length > 0;

  return {
    isDuplicate: duplicateDetected,
    duplicateValues: duplicatedOrders,
    mappedSwifts: mappedSwifts
  };
}

function Duplicate(props: DuplicateProps): JSX.Element {
  return (
    <Container>
      <Row>{badge(props.isDuplicate)}</Row>
      <Row>
        <h4>Possible duplicates</h4>
      </Row>
      <Row>
        <Table className="mt-2" striped bordered hover>
          <thead>
            <tr>
              <th>Value date</th>
              <th>Exotic currency amount</th>
              <th>USD amount</th>
            </tr>
          </thead>
          <tbody className="duplicatesList">
            {renderDuplicateDetails(props.duplicateValues)}
          </tbody>
        </Table>
      </Row>
      <Row>
        <h4>All swifts</h4>
      </Row>
      <Row>{renderDetails(props.mappedSwifts)}</Row>
    </Container>
  );
}

export function DuplicateCheck(): JSX.Element {
  const [state, setState] = useState<DuplicateProps>({
    isDuplicate: false,
    duplicateValues: [],
    mappedSwifts: []
  });

  function updateDuplicates(event: React.FormEvent<HTMLInputElement>): void {
    duplicateCheck(event).then(result => {
      setState(result);
    });
  }

  return (
    <Container className="mt-2">
      <Row>
        <Col>
          <Form>
            <Form.Group controlId="exampleForm.ControlTextarea1">
              <Form.Control
                className="ordersList"
                placeholder="Orders list"
                as="textarea"
                rows="10"
                onChange={updateDuplicates}
              />
            </Form.Group>
          </Form>
        </Col>
      </Row>
      <Row>
        <Duplicate {...state} />
      </Row>
    </Container>
  );
}

export default DuplicateCheck;
