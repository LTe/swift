import React, {Component} from 'react';
import './App.css';
import Badge from "react-bootstrap/Badge";
import Table from "react-bootstrap/Table";
import Row from "react-bootstrap/Row";
import Container from "react-bootstrap/Container";
import {BootstrapTable, TableHeaderColumn} from 'react-bootstrap-table';

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

  renderDetails() {
    const mappeddValues = this.props.mappedSwifts.map((value: any, id: any) => {
      const valueDate = this.findType(value, "98", "A", "VALU")[0]
      const exoticCurr = this.findType(value, "19", "B", "NETT")[0]
      const usdCurr = this.findType(value, "19", "B", "PSTA")[0]

      try {
        return {
          valueDate: valueDate.ast.Date,
          exoticCurr: exoticCurr.ast.Amount + ' ' + exoticCurr.ast["Currency Code"],
          usdCurr: usdCurr.ast.Amount + ' ' + usdCurr.ast["Currency Code"]
        }
      } catch (e) {
        return { valueDate: 'Unable to display', exoticCurr: 'Unable to display', usdCurr: 'Unable to display' }
      }
    })

    return (
      <BootstrapTable data={mappeddValues} striped hover>
        <TableHeaderColumn isKey dataField='valueDate' dataSort={ true }>Value Date</TableHeaderColumn>
        <TableHeaderColumn dataField='exoticCurr' dataSort={ true }>Exotic Currency</TableHeaderColumn>
        <TableHeaderColumn dataField='usdCurr' dataSort={ true }>USD Currency</TableHeaderColumn>
      </BootstrapTable>
    )
  }

  renderDuplicateDetails() {
    const renderedValues = this.props.duplicateValues.map((value: any) => {
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
    return renderedValues
  }

  renderRow(valueDate: any, exoticCurr: any, usdCurr: any) {
    return (
      <tr>
        <td>{valueDate.ast.Date}</td>
        <td>{exoticCurr.ast.Amount} {exoticCurr.ast["Currency Code"]}</td>
        <td>{usdCurr.ast.Amount} {usdCurr.ast["Currency Code"]}</td>
      </tr>
    )
  }

  findType(json: any, type: any, option: any, qualifier: any) {
    const details = json['block4']
    if (details) {
      return details.filter((element: any) => {
        return element.type === type && element.option === option && element.ast["Qualifier"] === qualifier
      }) || []
    } else {
      return []
    }
  }
}

export default Duplicate;
