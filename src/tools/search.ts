import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { VideoSearchItem } from '../common/types'
import { z } from 'zod'
import { formatTimestamp, searchVideos } from '../common/utils'

export function registerSearchTools(server: McpServer): void {
  server.tool(
    'search-videos',
    'Search for videos on Bilibili',
    {
      keyword: z.string().describe('keyword to search for'),
      page: z.number().int().min(1).default(1).describe('page number, defaults to 1'),
      count: z.number().int().min(1).max(20).default(10).describe('Number of results to return, default 10, maxium 20'),
    },
    async ({ keyword, page, count }) => {
      try {
        const searchResult = await searchVideos(keyword, page) || {}

        if (!searchResult.result || searchResult.result.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `No videos found related to "${keyword}"`,
              },
            ],
          }
        }

        const videoResults = searchResult.result.filter(item => item.result_type === 'video')?.[0]
          ?.data
          ?.slice(0, count) as VideoSearchItem[]

        const formattedResults = videoResults
          .map((video, index) => {
            return [
              `${index + 1}. "${video.title}" - ${video.author}`,
              ` BV ID: ${video.bvid}`,
              ` Views: ${video.play?.toLocaleString()}`,
              ` Danmaku: ${video.danmaku?.toLocaleString()}`,
              ` Likes: ${video.like?.toLocaleString()}`,
              ` Duration: ${video.duration}`,
              ` Published: ${formatTimestamp(video.pubdate)}`,
              ` Description: ${video.description?.substring(0, 100)}${video.description?.length > 100 ? '...' : ''}`,
            ].join('\n')
          })
          .join('\n\n')

        return {
          content: [
            {
              type: 'text',
              text: [
                `Search results for "${keyword}"`,
                formattedResults,
                `Found ${searchResult.numPages} related videos in total, currently showing ${videoResults.length} results from page ${page}.`,
              ].join('\n'),
            },
          ],
        }
      }
      catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Failed to search videos: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        }
      }
    },
  )
}
