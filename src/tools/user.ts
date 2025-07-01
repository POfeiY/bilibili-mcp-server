import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { formatUserInfo, getUserInfo } from '../common/utils'

export function registerUserTools(server: McpServer): void {
  server.tool(
    'get_user_info',
    'get information about a bilibili user',
    {
      mid: z.number().int().positive().describe('user\'s identification ID'),
    },
    async ({ mid }) => {
      try {
        const userInfo = await getUserInfo(mid) || {}
        const formattedInfo = formatUserInfo(userInfo)

        return {
          content: [
            {
              type: 'text',
              text: formattedInfo,
            },
          ],
        }
      }
      catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `get user info failed: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        }
      }
    },
  )
}
