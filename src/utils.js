import patterns from "./metadata/patterns.json"
import SwiftParser from 'swift-mock/lib/swiftParser'
import moment from 'moment'
import 'moment/locale/pl'

const FALLBACK_FORMAT = "F01TESTBIC12XXX0360105154\n" +
  "O5641057130214TESTBIC34XXX26264938281302141757N\n" +
  "108:2RDRQDHM3WO"

const parser = new SwiftParser(JSON.stringify(patterns))

export function onAccountChange(event) {
  const value = event.target.value
  const lines = value.split('\n')
  const accounts = lines.map((line) => {
    const accountDetails = line.split(',')
    const fundAccount = (accountDetails[1] || '').slice(0, -5) + '5-000'
    return {account: accountDetails[0], fund: fundAccount, nostro: accountDetails[2]}
  })

  this.setState({accounts: accounts})
}

export function tryParse(value) {
  value = value.replace(/\n{2,}/g, '\n')
  value = value.replace(/ :/g, '\n:')

  const lines = value.split('\n')
  const block_1 = "{1:" + lines[0] + "}"
  const block_2 = "{2:" + lines[1] + "}"
  const block_3 = "{3:{" + lines[2] + "}}"
  const block_4 = "{4:\n" + lines.slice(3).join('\n').replace('\n-', '').trim() + "\n-}"

  return parser.parse(block_1 + block_2 + block_3 + block_4)
}

export function parse(value) {
  try {
    return parser.parse(value)
  } catch (e) {
    try {
      return tryParse(value)
    } catch (e) {
      try {
        return tryParse(FALLBACK_FORMAT + value)
      } catch (e) {
        try {
          return tryParse(FALLBACK_FORMAT + ":\n" + value)
        } catch (e) {
          return e.message
        }
      }
    }
  }
}

export function getAccountNumberFromFin(ast) {
  const identify = ast['Party Identification']
  return identify.split('\n').find((line) => { return line.includes('ACCT/') }).split('/')[2]
}

export function findType(json, type, option, qualifier) {
  try {
    const details = json['block4']
    if(details) {
      return details.filter((element)=> {
        return element.type === type && element.option === option && element.ast["Qualifier"] === qualifier
      }) || []
    } else {
      return []
    }
  } catch (e) {
    return []
  }
}

export function renderDate(dateString) {
  try {
    const date = moment(dateString, "YYYYMMDD")
    return date.format('DD/MM/YYYY') + " (" + date.fromNow() + ")"
  } catch (e) {
    return "Unable to render date"
  }
}

export function renderFloat(floatSting, precision = 2) {
  try {
    return parseFloat((floatSting || '').replace(',', '.')).toFixed(precision)
  } catch (e) {
    return "Unable to render number"
  }
}

export function renderCurrency(amount, currency) {
  try {
    return renderFloat(amount) + " " + currency
  } catch (e) {
    return "Unable to render currency"
  }
}
