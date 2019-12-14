import React from 'react';
import {mount} from './enzyme';
import order from './fixtures/valid/order.json'
import Duplicate from '../Duplicate'
import {ReactWrapper} from "enzyme";
import Badge from "react-bootstrap/Badge";
import {act} from "react-dom/test-utils";

describe('no duplications', () => {
  let duplicate: ReactWrapper

  const changeOrders = async (orders: string) => {
    await act(async () => {
      const event = { target: { value: orders } }
      duplicate.find('.ordersList').hostNodes().simulate('change', event)
    })
  }

  beforeEach(async () => {
    await act(async () => {
      duplicate = mount(<Duplicate />)
      await changeOrders(order.text)
    })
  })

  it('shows duplicate badge', () => {
    expect(duplicate.find(Badge).html()).toContain('Is not duplicate')
  })

  describe('with duplications', () => {
    beforeEach(async () => {
      await changeOrders(order.text.repeat(2))
    })

    it('await shows duplicate badge', async () => {
      expect(duplicate.find(Badge).html()).toContain('Is duplicate')
    })

    it('renders duplications', () => {
      expect(duplicate.find('.duplicatesList').render().find('tr').length).toBe(2)
    })
  })
})

