import React, {Component} from 'react';
import './App.css';
import Badge from "react-bootstrap/Badge";
import Table from "react-bootstrap/Table";

class Duplicate extends Component {
  render() {
    if (this.props.isDuplicate) {
      return (
          <React.Fragment>
            <Badge pill variant="danger"> Is duplicate </Badge>
            <Table className="mt-2" striped bordered hover>
              <thead>
              <tr>
                <th>Value date</th>
                <th>Exotic currency amount</th>
                <th>USD amount</th>
              </tr>
              </thead>
              <tbody>
                {this.renderDuplicateDetails()}
              </tbody>
            </Table>
          </React.Fragment>
      )
    } else {
      return (<Badge pill variant="success"> Is not duplicate </Badge>)
    }
  }
  renderDuplicateDetails() {
    const renderedValues = this.props.duplicateValues.map((value) => {
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

  renderRow(valueDate, exoticCurr, usdCurr) {
    return (
      <tr>
        <td>{valueDate.ast.Date}</td>
        <td>{exoticCurr.ast.Amount} {exoticCurr.ast["Currency Code"]}</td>
        <td>{usdCurr.ast.Amount} {usdCurr.ast["Currency Code"]}</td>
      </tr>
    )
  }

  findType(json, type, option, qualifier) {
    const details = json['block4']
    if(details) {
      return details.filter((element)=> {
        return element.type === type && element.option === option && element.ast["Qualifier"] === qualifier
      }) || []
    } else {
      return []
    }
  }
}

export default Duplicate;
