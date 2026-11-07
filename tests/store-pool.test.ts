/**
 * Full reads fetch one blob per manifest entry. Without a bound, a namespace at
 * the 2000-entry cap becomes 2000 simultaneous store requests (S3 sockets or
 * filesystem descriptors). The property under test is the bound itself, not
 * just that every item ran.
 */

import { describe, expect, test } from 'bun:test'
import { mapPool } from '../src/memory.ts'

describe('mapPool', () => {
  test('keeps at most the requested number of calls in flight', async () => {
    for (const limit of [1, 3, 7]) {
      let active = 0
      let peak = 0
      const seen: number[] = []
      const items = Array.from({ length: 20 }, (_, i) => i)

      await mapPool(items, limit, async item => {
        active += 1
        peak = Math.max(peak, active)
        // Yield so the other workers can enter `fn` while this one is in
        // flight. An unbounded fan-out would overlap every item here.
        await new Promise(resolve => setTimeout(resolve, 1))
        seen.push(item)
        active -= 1
      })

      expect(peak).toBe(limit)
      expect(seen.sort((a, b) => a - b)).toEqual(items)
    }
  })

  test('a limit above the item count still runs every item once', async () => {
    const seen: number[] = []
    await mapPool([1, 2, 3], 256, async item => {
      seen.push(item)
    })
    expect(seen).toEqual([1, 2, 3])
  })

  test('an empty set runs no calls', async () => {
    let calls = 0
    await mapPool([], 16, async () => {
      calls += 1
    })
    expect(calls).toBe(0)
  })

  test('a rejected call rejects the whole pool', async () => {
    await expect(
      mapPool([1, 2, 3], 2, async item => {
        if (item === 2) throw new Error('store failed')
      }),
    ).rejects.toThrow('store failed')
  })
})
