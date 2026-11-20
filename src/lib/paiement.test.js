import { expect, test } from 'vitest'
import { centimes, epc, euros, ogm, ogmLisible, total } from './paiement.js'

test('ogm : exemples réels de communications structurées', () => {
  expect(ogmLisible(ogm(10, 8068171))).toBe('+++010/8068/17183+++')
  expect(ogmLisible(ogm(90, 9337554))).toBe('+++090/9337/55493+++')
})

test('ogm : reste 0 → contrôle 97', () => {
  expect(ogm(0, 97)).toBe('000000009797')
})

test('ogm : refuse un compteur trop grand', () => {
  expect(() => ogm(1, 10_000_000)).toThrow()
})

test('centimes : saisie libre', () => {
  expect(centimes('12,5')).toBe(1250)
  expect(centimes(' 3 ')).toBe(300)
  expect(centimes('0.05')).toBe(5)
  expect(centimes('1,234')).toBe(null)
  expect(centimes('abc')).toBe(null)
})

test('euros et total', () => {
  expect(euros(1250)).toMatch(/^12,50\s€$/)
  expect(total([{ prix: 300, qte: 2 }, { prix: 150, qte: 1 }])).toBe(750)
})

const b = { nom: 'Champ du Mont', iban: 'BE68539007547034' }

test('epc : communication dans le champ structuré', () => {
  expect(epc(1250, '010806817183', { ...b, champRef: 'structure' })).toBe(
    'BCD\n002\n1\nSCT\n\nChamp du Mont\nBE68539007547034\nEUR12.50\n\n010806817183',
  )
})

test('epc : communication dans le champ libre', () => {
  expect(epc(500, '010806817183', { ...b, champRef: 'libre' })).toBe(
    'BCD\n002\n1\nSCT\n\nChamp du Mont\nBE68539007547034\nEUR5.00\n\n\n+++010/8068/17183+++',
  )
})
