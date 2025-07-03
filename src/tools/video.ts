import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import i18n from '../common/i18n'
import { formatDuration, formatTimestamp, getVideoDetail } from '../common/utils'

export function registerVideoTools(server: McpServer): void {
  server.tool(
    'get_video_info',
    'get detailed information about a Bilibili video',
    {
      bvid: z.string().describe('bilibli video ID'),
    },
    async ({ bvid }) => {
      try {
        const t = i18n.video

        const videoDetail = await getVideoDetail(bvid) || {}
        const stats = videoDetail.stat || {}

        const detailLines = [
          `${t.title}: ${videoDetail.title}`,
          `${t.url}: https://www.bilibili.com/video/${videoDetail.bvid}`,
          `${t.aid}: ${videoDetail.aid}`,
          `${t.uploader}: ${videoDetail.owner?.name} (${t.uploaderUID}: ${videoDetail.owner?.mid})`,
          `${t.publishDate}: ${formatTimestamp(videoDetail.pubdate)}`,
          `${t.duration}: ${formatDuration(videoDetail.duration)}`,
          '',
          `${t.stats}:`,
          `- ${t.views}: ${stats.view?.toLocaleString()}`,
          `- ${t.danmaku}: ${stats.danmaku?.toLocaleString()}`,
          `- ${t.comments}: ${stats.reply?.toLocaleString()}`,
          `- ${t.likes}: ${stats.like?.toLocaleString()}`,
          `- ${t.coins}: ${stats.coin?.toLocaleString()}`,
          `- ${t.favorites}: ${stats.favorite?.toLocaleString()}`,
          `- ${t.shares}: ${stats.share?.toLocaleString()}`,
          '',
          `${t.description}:`,
          ...videoDetail.desc?.split('\n')?.map?.(line => line),
          '',
          `${t.tags}: ${videoDetail.tags?.join(', ')}`,
        ]
        const formattedDetail = detailLines.join('\n')

        return {
          content: [
            { type: 'text', text: formattedDetail.trim() },
          ],
        }
      }
      catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Failed to fetch video info: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        }
      }
    },
  )
}
