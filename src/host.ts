import type {
  CallToolResult,
  ListResourcesResult,
  Resource,
} from '@modelcontextprotocol/sdk/types.js'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

/**
 * 客户端配置接口
 */
interface ClientConfig {
  name: string
  command: string
  args?: string[]
  env?: Record<string, string>
}

/**
 * 客户端实例信息
 */
interface ClientInstance {
  client: Client
  config: ClientConfig
  transport: StdioClientTransport
  isConnected: boolean
}

/**
 * MCP Host - 管理多个 MCP 客户端
 */
class MCPHost {
  private clients: Map<string, ClientInstance> = new Map()

  /**
   * 添加并连接一个新的 MCP 服务器
   */
  async addClient(config: ClientConfig): Promise<void> {
    if (this.clients.has(config.name)) {
      throw new Error(`Client ${config.name} already exists`)
    }

    console.log(`[Host] Connecting to ${config.name}...`)

    // 创建传输层 (stdio)
    const transport = new StdioClientTransport({
      command: config.command,
      args: config.args || [],
      env: config.env,
    })

    // 创建客户端实例
    const client = new Client(
      {
        name: 'my-mcp-host',
        version: '1.0.0',
      },
      {
        capabilities: {
          // 声明 Host 支持的能力
          roots: {
            listChanged: true,
          },
          sampling: {},
        },
      },
    )

    // 连接到服务器
    await client.connect(transport)

    // 存储客户端实例
    this.clients.set(config.name, {
      client,
      config,
      transport,
      isConnected: true,
    })

    console.log(`[Host] Connected to ${config.name}`)
  }

  /**
   * 获取指定客户端
   */
  getClient(name: string): Client | null {
    const instance = this.clients.get(name)
    return instance?.isConnected ? instance.client : null
  }

  /**
   * 列出所有已连接的客户端
   */
  listClients(): string[] {
    return Array.from(this.clients.keys()).filter(
      name => this.clients.get(name)?.isConnected,
    )
  }

  /**
   * 从指定客户端获取资源列表
   */
  async listResources(clientName: string): Promise<ListResourcesResult> {
    const client = this.getClient(clientName)
    if (!client) {
      throw new Error(`Client ${clientName} not found or not connected`)
    }

    const result = await client.listResources()
    console.log(`[Host] Resources from ${clientName}:`, result.resources)
    return result
  }

  /**
   * 从指定客户端读取资源
   */
  async readResource(clientName: string, uri: string): Promise<Resource> {
    const client = this.getClient(clientName)
    if (!client) {
      throw new Error(`Client ${clientName} not found`)
    }

    const result = await client.readResource({ uri })
    console.log(`[Host] Read resource ${uri} from ${clientName}`)
    return result
  }

  /**
   * 在指定客户端上调用工具
   */
  async callTool(
    clientName: string,
    toolName: string,
    args: Record<string, unknown>,
  ): Promise<CallToolResult> {
    const client = this.getClient(clientName)
    if (!client) {
      throw new Error(`Client ${clientName} not found`)
    }

    console.log(`[Host] Calling tool ${toolName} on ${clientName}`)
    const result = await client.callTool({ name: toolName, arguments: args })
    return result
  }

  /**
   * 聚合多个客户端的资源
   */
  async aggregateResources(): Promise<Map<string, Resource[]>> {
    const allResources = new Map<string, Resource[]>()

    for (const [name, instance] of this.clients.entries()) {
      if (instance.isConnected) {
        try {
          const result = await instance.client.listResources()
          allResources.set(name, result.resources)
        }
        catch (error) {
          console.error(`[Host] Error fetching resources from ${name}:`, error)
          allResources.set(name, [])
        }
      }
    }

    return allResources
  }

  /**
   * 关闭指定客户端
   */
  async closeClient(name: string): Promise<void> {
    const instance = this.clients.get(name)
    if (!instance) {
      throw new Error(`Client ${name} not found`)
    }

    console.log(`[Host] Closing client ${name}...`)
    await instance.client.close()
    instance.isConnected = false
    this.clients.delete(name)
    console.log(`[Host] Client ${name} closed`)
  }

  /**
   * 关闭所有客户端
   */
  async closeAll(): Promise<void> {
    console.log('[Host] Closing all clients...')
    const closePromises = Array.from(this.clients.keys()).map(name =>
      this.closeClient(name),
    )
    await Promise.all(closePromises)
    console.log('[Host] All clients closed')
  }

  /**
   * 处理服务器通知
   */
  setupNotificationHandlers(clientName: string): void {
    const instance = this.clients.get(clientName)
    if (!instance)
      return

    const client = instance.client

    // 监听资源列表变化
    client.setNotificationHandler({
      async resourceListChanged() {
        console.log(`[Host] Resource list changed in ${clientName}`)
        // 可以在这里重新获取资源列表
      },
      async toolListChanged() {
        console.log(`[Host] Tool list changed in ${clientName}`)
      },
      async promptListChanged() {
        console.log(`[Host] Prompt list changed in ${clientName}`)
      },
    })
  }
}

// ==================== 使用示例 ====================

async function main(): Promise<any> {
  const host = new MCPHost()

  try {
    // 1. 添加文件系统服务器
    await host.addClient({
      name: 'filesystem',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
    })

    // 2. 添加 SQLite 数据库服务器
    await host.addClient({
      name: 'sqlite',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-sqlite', '/path/to/db.sqlite'],
    })

    // 设置通知处理器
    host.setupNotificationHandlers('filesystem')
    host.setupNotificationHandlers('sqlite')

    // 3. 列出所有已连接的客户端
    console.log('\n=== Connected Clients ===')
    console.log(host.listClients())

    // 4. 聚合所有客户端的资源
    console.log('\n=== Aggregating Resources ===')
    const allResources = await host.aggregateResources()
    for (const [clientName, resources] of allResources.entries()) {
      console.log(`${clientName}: ${resources.length} resources`)
    }

    // 5. 调用特定客户端的工具
    console.log('\n=== Calling Tools ===')
    const result = await host.callTool('filesystem', 'read_file', {
      path: '/tmp/example.txt',
    })
    console.log('Tool result:', result)

    // 6. 读取资源
    const resources = await host.listResources('filesystem')
    if (resources.resources.length > 0) {
      const firstResource = resources.resources[0]
      const content = await host.readResource('filesystem', firstResource.uri)
      console.log('Resource content:', content)
    }
  }
  catch (error) {
    console.error('Error:', error)
  }
  finally {
    // 清理:关闭所有连接
    await host.closeAll()
  }
}

// 运行示例
if (require.main === module) {
  main().catch(console.error)
}

export { ClientConfig, ClientInstance, MCPHost }
