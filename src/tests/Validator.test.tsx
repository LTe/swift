import React from 'react';
import { shallow } from './enzyme';
import order from './fixtures/valid/order.json'
import transaction from './fixtures/valid/transaction.json'
import accounts from './fixtures/accounts.json'
import {AccountDetails, parse, parseAccounts, ParsedSwift} from '../utils'
import Validator from '../Validator'
import {ShallowWrapper} from "enzyme";
import Badge from "react-bootstrap/Badge";


describe('valid transaction', () => {
  let parsedTransaction: ParsedSwift
  let parsedOrder: ParsedSwift
  let validator: ShallowWrapper
  let parsedAccounts: AccountDetails[]
  let validatorHTML: string

  const testValidation = (label: string, order: string, transaction: string, valid: boolean) => {
    it(`validate ${ label }`, () => {
      const field = validator.find(`[data-label="${label}"]`)
      expect(field.find('.order').html()).toContain(order)
      expect(field.find('.transaction').html()).toContain(transaction)

      if (valid) {
        expect(field.find(Badge).find({variant: 'success'}).exists()).toBeTruthy()
      } else {
        expect(field.find(Badge).find({variant: 'danger'}).exists()).toBeTruthy()
      }
    })
  }

  beforeEach(() => {
    parsedTransaction = parse(transaction.text)
    parsedOrder = parse(order.text)
    parsedAccounts = parseAccounts(accounts.text)

    validator = shallow(<Validator accounts={parsedAccounts} orderJSON={parsedOrder} transactionJSON={parsedTransaction} />)
    validatorHTML = validator.html()
  })

  it('renders titles for comparision', () => {
    expect(validatorHTML).toContain('What the order contain')
    expect(validatorHTML).toContain('What it should be')
  })

  testValidation('Sell Currency Amount', '5000', '5000', true)
  testValidation('Buy Currency Amount', '4000', '4000', true)
  testValidation('Value Date', '21/04/2019', '21/04/2019', true)
  testValidation('Trade Date', '21/04/2019', '21/04/2019', true)
  testValidation('Rate', '1.70', '1.70 (Calculated: 0.80)', true)
  testValidation('Fund Account Number', '02300000099999S1', '12312315-000', true)
  testValidation('Nostro Account Number', '02300000099999S1', '123123', true)
})

