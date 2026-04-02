import memoize from 'lodash-es/memoize.js'
import type { Command } from '../commands.js'
import type { MCPServerConnection } from '../services/mcp/types.js'

/**
 * Local fallback for MCP-derived skills.
 *
 * Some branches reference this module from MCP client code, but the file may be
 * absent during partial cherry-picks. Returning an empty list keeps startup
 * healthy and preserves MCP prompt loading while skill extraction is unavailable.
 */
export const fetchMcpSkillsForClient = memoize(
  async (_client: MCPServerConnection): Promise<Command[]> => [],
  client => client.name,
)
