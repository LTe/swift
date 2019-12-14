import React from 'react';
import { mount } from './enzyme';
import order from './fixtures/valid/order.json'
import transaction from './fixtures/valid/transaction.json'
import accounts from './fixtures/accounts.json'
import Generator from '../Generator'
import {ReactWrapper, ShallowWrapper} from "enzyme";
import {act} from "react-dom/test-utils";

describe('order generation', () => {
  let generator: ReactWrapper

  const generateEvent = (value: string) => {
    return { target: { value } }
  }

  const changeField = (name: string, value: string) => {
    generator.find(`[placeholder="${ name }"]`).forEach((node) => {
      node.simulate("change", generateEvent(value)) }
    )
  }

  beforeEach(() => {
    act(() => {
      generator = mount(<Generator/>)
    })

    act(() => {
      changeField('Orders', order.text)
    })

    act(() => {
      changeField('Accounts', accounts.text)
    })

    act(() => {
      changeField('Templates', transaction.text)
    })
  })

  it('copy an order', () => {
    expect(generator.find('.copiedOrder').first().text()).toContain(
      ":16R:GENL\n" +
      ":20C::CORP//01000912090001\n" +
      ":20C::SEME//0230KE1540958\n" +
      ":23G:NEWM\n" +
      ":22F::CAEV//REDM\n" +
      ":98C::PREP//20121017075400\n" +
      ":16R:LINK\n" +
      ":20C::CORP//01000912090001\n" +
      ":16S:LINK\n" +
      ":16S:GENL\n"
    )
  })

  it ('generates new transaction', () => {
    expect(generator.find('.generatedTransaction').first().text()).toContain(
      ":15A:\n" +
      ":20:EXAMPLENAME\n" +
      ":22A:NEWT\n" +
      ":94A:ASET\n" +
      ":83J:/ACCT/12312315-000\n" +
      "/NAME/Global\n" +
      "LU-2020 Ludmila\n" +
      ":82J:AAA/BBB\n" +
      "CCC/DDD\n" +
      ":87A:SCBLTHBXXXX\n" +
      ":15B:\n" +
      ":30T:20190421\n" +
      ":30V:20190421\n" +
      ":36:1,7\n" +
      ":32B:USD4000,\n" +
      ":33B:KWR5000,\n" +
      ":53A:IRVTUS3NXN,\n" +
      ":33B:THB1\n" +
      ":57A:CRESLULLXXX\n" +
      ":58J:/ACCT/123123123\n" +
      "/AST/123456\n" +
      "/NAME/LALALA"
    )
  })
})

