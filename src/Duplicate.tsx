import React, {Component} from 'react';
import './App.css';
import Badge from "react-bootstrap/Badge";
import Table from "react-bootstrap/Table";
import Row from "react-bootstrap/Row";
import Container from "react-bootstrap/Container";
import {BootstrapTable, BootstrapTableProps, TableHeaderColumn} from 'react-bootstrap-table';
import {Block4, ParsedSwift} from "./utils";

interface TransactionDetails extends Readonly<BootstrapTableProps> {
  valueDate: string
  exoticCurr: string
  usdCurr: string
}

class Duplicate extends Component<any, any> {
  render() {
    const badge = this.props.isDuplicate ? (<Badge pill variant="danger"> Is duplicate </Badge>) : (
      <Badge pill variant="success"> Is not duplicate </Badge>)

    return (
      <Container>
        <Row>{badge}</Row>
        <Row><h4>Possible duplicates</h4></Row>
        <Row>
          <Table className="mt-2" striped bordered hover>
            <thead>
            <tr>
              <th>Value date</th>
              <th>Exotic currency amount</th>
              <th>USD amount</th>
            </tr>
            </thead>
            <tbody>{this.renderDuplicateDetails()}</tbody>
          </Table>
        </Row>
        <Row><h4>All swifts</h4></Row>
        <Row>
          {this.renderDetails()}
        </Row>
      </Container>
    )
  }

  renderDetails() : JSX.Element {
    const mappedValues : TransactionDetails[] = this.props.mappedSwifts.map((value: ParsedSwift, id: string) => {
      const valueDate = this.findType(value, "98", "A", "VALU")[0]
      const exoticCurr = this.findType(value, "19", "B", "NETT")[0]
      const usdCurr = this.findType(value, "19", "B", "PSTA")[0]

      try {
        return {
          valueDate: valueDate.ast.Date,
          exoticCurr: exoticCurr.ast.Amount + ' ' + exoticCurr.ast["Currency Code"],
          usdCurr: usdCurr.ast.Amount + ' ' + usdCurr.ast["Currency Code"]
        } as TransactionDetails
      } catch (e) {
        return { valueDate: 'Unable to display', exoticCurr: 'Unable to display', usdCurr: 'Unable to display' } as TransactionDetails
      }
    })

    return (
      <BootstrapTable data={mappedValues} striped hover>
        <TableHeaderColumn isKey dataField='valueDate' dataSort={ true }>Value Date</TableHeaderColumn>
        <TableHeaderColumn dataField='exoticCurr' dataSort={ true }>Exotic Currency</TableHeaderColumn>
        <TableHeaderColumn dataField='usdCurr' dataSort={ true }>USD Currency</TableHeaderColumn>
      </BootstrapTable>
    )
  }

  renderDuplicateDetails() : JSX.Element[] {
    return this.props.duplicateValues.map((value: any) => {
      const valueDate = this.findType(value, "98", "A", "VALU")[0]
      const exoticCurr = this.findType(value, "19", "B", "NETT")[0]
      const usdCurr = this.findType(value, "19", "B", "PSTA")[0]

      try {
        return this.renderRow(valueDate, exoticCurr, usdCurr)
      } catch (e) {
        return (
          <tr>
            <td>Unable to display</td>
            <td>Unable to display</td>
            <td>Unable to display</td>
          </tr>
        )
      }
    })
  }

  renderRow(valueDate: Block4, exoticCurr: Block4, usdCurr: Block4) : JSX.Element {
    return (
      <tr>
        <td>{valueDate.ast.Date}</td>
        <td>{exoticCurr.ast.Amount} {exoticCurr.ast["Currency Code"]}</td>
        <td>{usdCurr.ast.Amount} {usdCurr.ast["Currency Code"]}</td>
      </tr>
    )
  }

  findType(json: ParsedSwift, type: string, option: string, qualifier: string): Block4[] {
    const details : Block4[] = json['block4']
    if (details) {
      return details.filter((element: Block4) => {
        return element.type === type && element.option === option && element.ast["Qualifier"] === qualifier
      }) || []
    } else {
      return []
    }
  }
}

export default Duplicate;
