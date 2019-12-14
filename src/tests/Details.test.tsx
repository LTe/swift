import React from 'react';
import { shallow } from './enzyme';
import order from './fixtures/order.json'
import transaction from './fixtures/transaction.json'
import {parse, ParsedSwift} from '../utils'
import Details from '../Details'

describe('transaction details', () => {
  let transactionDetails: string
  let parsedTransaction: ParsedSwift

  beforeEach(() => {
    parsedTransaction = parse(transaction.text)
    transactionDetails = shallow(<Details parsedSwift={parsedTransaction}/>).html()
  })

  it('renders Fund Account', () => {
    expect(transactionDetails).toContain('Fund number')
    expect(transactionDetails).toContain('12312315-000')
  })

  it('renders Nostro number', () => {
    expect(transactionDetails).toContain('Nostro number')
    expect(transactionDetails).toContain('123123123')
  })

  it('renders Sender Reference', () => {
    expect(transactionDetails).toContain('Sender&#x27;s Reference')
    expect(transactionDetails).toContain('EXAMPLENAME')
  })

  it('renders Fund', () => {
    expect(transactionDetails).toContain('Fund')
    expect(transactionDetails).toContain('/ACCT/12312315-000')
    expect(transactionDetails).toContain('/NAME/Global')
    expect(transactionDetails).toContain('LU-2020 Ludmila')
  })

  it('renders Value Date', () => {
    expect(transactionDetails).toContain('Value Date')
    expect(transactionDetails).toContain('21/04/2019')
  })

  it('renders Trade Date', () => {
    expect(transactionDetails).toContain('Trade Date')
    expect(transactionDetails).toContain('22/04/2019')
  })

  it('renders Exchange Rate', () => {
    expect(transactionDetails).toContain('Exchange Rate')
    expect(transactionDetails).toContain('1.70')
  })

  it('renders Amount Bought', () => {
    expect(transactionDetails).toContain('Amount Bought')
    expect(transactionDetails).toContain('2940.00 USD')
  })

  it('renders Amount Sold', () => {
    expect(transactionDetails).toContain('Amount Sold')
    expect(transactionDetails).toContain('5000.00 KWR')
  })
})

describe('order details', () => {
  let orderDetails: string
  let parsedOrder: ParsedSwift

  beforeEach(() => {
    parsedOrder = parse(order.text)
    orderDetails = shallow(<Details parsedSwift={parsedOrder}/>).html()
  })

  it('renders SAFE account number', () => {
    expect(orderDetails).toContain('Account Number (SAFE)')
    expect(orderDetails).toContain('02300000099999S1')
  });

  it('renders CASH account number', () => {
    expect(orderDetails).toContain('Account Number (CASH)')
    expect(orderDetails).toContain('02300000099999050000W')
  });

  it('renders Net Cash Amount', () => {
    expect(orderDetails).toContain('NETT')
    expect(orderDetails).toContain('5000.00 KWR')
  });

  it('renders PSTA', () => {
    expect(orderDetails).toContain('PSTA')
    expect(orderDetails).toContain('4000.00 USD')
  });

  it('renders Rate', () => {
    expect(orderDetails).toContain('Rate')
    expect(orderDetails).toContain('USD/KRW 1137.30')
  });

  it('render Value Date', () => {
    expect(orderDetails).toContain('VALU')
    expect(orderDetails).toContain('20/11/2012')
  })
})
