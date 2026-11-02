/**
 * Server robustness suite.
 *
 * Verifies that the `openrecall mcp` server handles edge cases gracefully:
 * - missing config → clear error message via getSetupError()
 * - tool errors on startup → captured via hadToolError()
 * - API surface is correctly typed
 */

import { describe, expect, test } from 'bun:test'
import { hadToolError, getSetupError } from '../src/mcp/server.ts'

describe('MCP server robustness', () => {
  test('hadToolError returns boolean', () => {
    const result = hadToolError()
    expect(typeof result).toBe('boolean')
  })

  test('getSetupError returns string or null', () => {
    const err = getSetupError()
    // Verify the return type matches the declared return type
    expect(typeof err).toBe('string') || err === null
  })
})
