#!/usr/bin/env node

import process from 'node:process'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

import { registerSearchTools } from './tools/search'
import { registerUserTools } from './tools/user'
import { registerVideoTools } from './tools/video'

const server = new McpServer({
  name: 'bilibili-mcp-server',
  version: '0.0.1',
})

async function main(): Promise<void> {
  registerUserTools(server)
  registerSearchTools(server)
  registerVideoTools(server)

  const transport = new StdioServerTransport()
  await server.connect(transport)
  // console.log('bilibili MCP server runningon stdio')
}

main().catch((e) => {
  console.error('error in main():', e)
  // eslint-disable
  process.exit(1)
})
