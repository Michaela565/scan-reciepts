import { describe, expect, it } from 'vitest'
import { parseAlbertReceipt } from './albert'
import { groupIntoRows } from './rows'
import fixture from './__fixtures__/albert-2026-08-11.json'

describe('parseAlbertReceipt', () => {
  const receipt = parseAlbertReceipt(fixture)

  it('reads all items with prices in haléře', () => {
    expect(receipt.items).toHaveLength(10)
    expect(receipt.items[0]).toEqual({
      name: 'HROZNY BÍL.BEZS.500G', quantity: 1, unit: undefined, unitPrice: 3990, total: 3990, vatCode: 'A',
    })
    expect(receipt.items[4]).toMatchObject({ name: 'KAŠTANY MLÉČNÉ 45G', quantity: 4, unitPrice: 1490, total: 5960 })
    expect(receipt.items[7]).toMatchObject({ name: 'SAVO SPREJ UNI 700ML', vatCode: 'B' })
  })

  it('skips the loyalty-credits line inside the item list', () => {
    expect(receipt.items.map((i) => i.name)).not.toContain('Získané kredity: 4 kredity')
  })

  it('reads the header and footer', () => {
    expect(receipt).toMatchObject({
      chain: 'Albert',
      storeName: 'Praha 4, Arkády Pankrác',
      storeAddress: 'Na Pankráci 86, Praha 4',
      purchasedAt: '2026-08-11T13:08',
      receiptNumber: '04844',
      receiptId: '660000829001210001138820260811130714',
      total: 40250,
      savings: 4800,
    })
  })

  it('has no warnings when items add up to the total', () => {
    expect(receipt.warnings).toEqual([])
  })

  it('does not pick up the customer phone or card number', () => {
    expect(JSON.stringify(receipt)).not.toMatch(/\+420|\*\*\*\*/)
  })

  it('warns when the item sum does not match the total', () => {
    const broken = fixture.filter((r) => r[0] !== 'BOUNTY 57G' && r[0] !== '2 x 16.90 Kč')
    expect(parseAlbertReceipt(broken).warnings).toEqual([
      'Items add up to 368.7 Kč but the receipt total is 402.5 Kč',
    ])
  })

  it('handles weighed items', () => {
    const rows = [['Položka', 'Cena'], ['BANÁNY', 'A'], ['0.512 kg x 34.90 Kč', '17.87 Kč'], ['Celkem', '17.87 Kč']]
    expect(parseAlbertReceipt(rows).items[0]).toMatchObject({ quantity: 0.512, unit: 'kg', unitPrice: 3490, total: 1787 })
  })

  it('rejects something that is not an Albert receipt', () => {
    expect(parseAlbertReceipt([['hello']]).warnings).toHaveLength(1)
  })
})

describe('groupIntoRows', () => {
  it('groups by baseline and orders cells left to right', () => {
    expect(groupIntoRows([
      { str: '39.90 Kč', x: 200, y: 500 },
      { str: '1 x 39.90 Kč', x: 10, y: 500.8 },
      { str: ' ', x: 100, y: 500 },
      { str: 'HROZNY', x: 10, y: 520 },
    ])).toEqual([['HROZNY'], ['1 x 39.90 Kč', '39.90 Kč']])
  })
})
