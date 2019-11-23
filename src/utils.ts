import patterns from "./metadata/patterns.json"
import React, {Component} from 'react'
import SwiftParser from 'swift-mock/lib/swiftParser'
import moment from 'moment'
import 'moment/locale/pl'

let FALLBACK_FORMAT = "F01TESTBIC12XXX0360105154\nO5641057130214TESTBIC34XXX26264938281302141757N\n108:2RDRQDHM3WO"
let parser = new SwiftParser(JSON.stringify(patterns))

export interface ParsedSwift {
  block1: Block1
  block2: Block2
  block3: Block3
  block4: Block4[]
}

export interface Block1 {
  blockId:        number
  content:        string
  applicationId:  string
  serviceId:      string
  receivingLtId:  string
  sessionNumber:  string
  sequenceNumber: string
}

export interface Block2 {
  content:        string
  blockId:        number
  direction:      string
  msgType:        string
  inputTime:      string
  inputDate:      string
  bic:            string
  sessionNumber:  string
  sequenceNumber: string
  outputDate:     string
  outputTime:     string
  prio:           string
}

export interface Block3 {
  "108": string
}

export interface Block4 {
  type:       string
  option:     string
  fieldValue: string
  content:    string
  ast:        SwiftAST
}

export interface SwiftAST {
  Qualifier?:               string
  Reference?:               string
  Function?:                string
  Indicator?:               string
  Date?:                    string
  Time?:                    string
  Value?:                   string
  "Account Number"?:        string
  "Data Source Scheme"?:    string
  "Place Code"?:            string
  "Currency Code"?:         string
  "Quantity Type Code"?:    string
  Balance?:                 string
  "Number Identification"?: string
  Quantity?:                string
  Amount?:                  string
  "Amount Type Code"?:      string
  Price?:                   string
  "First Currency Code"?:   string
  "Second Currency Code"?:  string
  Rate?:                    string
  "Party Identification"?:  string
  "Currency"?:              string
  "Identifier Code"?:       string
}

export interface AccountDetails {
  account: string
  fund: string
  nostro: string
}

export function onAccountChange(this: Component, event: React.ChangeEvent<HTMLInputElement>) {
  const value = event.target.value
  const lines = value.split('\n')
  const accounts: AccountDetails[] = lines.map((line: string) => {
    const accountDetails = line.split(',')
    const fundAccount = (accountDetails[1] || '').slice(0, -5) + '5-000'
    return {account: accountDetails[0], fund: fundAccount, nostro: accountDetails[2]}
  })

  this.setState({accounts: accounts})
}

export function tryParse(value: string) : ParsedSwift {
  value = value.replace(/\n{2,}/g, '\n')
  value = value.replace(/ :/g, '\n:')

  const lines = value.split('\n')
  const block_1 = "{1:" + lines[0] + "}"
  const block_2 = "{2:" + lines[1] + "}"
  const block_3 = "{3:{" + lines[2] + "}}"
  const block_4 = "{4:\n" + lines.slice(3).join('\n').replace('\n-', '').trim() + "\n-}"

  return parser.parse(block_1 + block_2 + block_3 + block_4)
}

export function parse(value: string) : ParsedSwift {
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

export function getAccountNumberFromFin(ast: SwiftAST) : string {
  const identify = ast['Party Identification']
  let partyIdentification = (identify || '').split('\n').find((line: any) => { return line.includes('ACCT/') }) || ''
  return partyIdentification.split("/")[2]
}

export function findTypes(json: ParsedSwift, type: string, option?: string, qualifier?: string) : Block4[] {
  try {
    const details = json['block4']
    if(details) {
      return details.filter((element: any)=> {
        return element.type === type && element.option === option && element.ast["Qualifier"] === qualifier
      }) || []
    } else {
      return []
    }
  } catch (e) {
    return []
  }
}

export function findType(json: ParsedSwift, type: string, option?: string, qualifier?: string) : Block4 | undefined {
  return findTypes(json, type, option, qualifier)[0]
}

export function renderDate(dateString?: string) : moment.Moment | string {
  try {
    const date = moment(dateString, 'YYYYMMDD')
    return date.format('DD/MM/YYYY') + " (" + date.fromNow() + ")"
  } catch (e) {
    return "Unable to render date"
  }
}

export function renderFloat(floatSting: string | undefined, precision = 2) : string {
  try {
    return parseFloat((floatSting || '').replace(',', '.')).toFixed(precision)
  } catch (e) {
    return "Unable to render number"
  }
}

export function renderCurrency(amount?: string, currency?: string) {
  try {
    return renderFloat(amount) + " " + currency
  } catch (e) {
    return "Unable to render currency"
  }
}
