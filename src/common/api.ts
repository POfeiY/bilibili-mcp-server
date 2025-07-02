import type { BiliResponse, SearchResult, UserInfo, VideoDetail } from './types'
import fetch from 'node-fetch'
import { wbiSignParamsQuery } from './wbi'

if (!globalThis.fetch) {
  globalThis.fetch = fetch as unknown as typeof globalThis.fetch
}

const BASE_URL = 'https://api.bilibili.com'

// 预设请求头
const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
  'Referer': 'https://www.bilibili.com',
  'Cookie': 'buvid3=randomstring; path=/; domain=.bilibili.com',
}

export async function apiHttp<T>(endpoint: string, params?: Record<string, string | number>): Promise<T> {
  let url = `${BASE_URL}${endpoint}`

  if (params) {
    const signedParams = await wbiSignParamsQuery(params)
    url += `?${signedParams}`
  }

  const response = await fetch(url, {
    headers: DEFAULT_HEADERS,
  })

  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}`,
    )
  }

  const data = (await response.json()) as BiliResponse<T>

  if (data.code !== 0) {
    throw new Error(`API returned error: ${data.message || 'unknow error'}`)
  }

  return data.data
}

// user API
export const userAPI = {
  /**
   * 获取用户信息
   * @param mid 用户编号
   * @returns
   */
  async getInfo(mid: number): Promise<UserInfo> {
    return await apiHttp<UserInfo>('/x/space/wbi/acc/info', { mid })
  },
  /**
   * 获取用户关注和粉丝数
   * @param mid
   * @returns
   */
  async getRelationStat(mid: number): Promise<{ followers: number, following: number }> {
    return await apiHttp<{ followers: number, following: number }>(`/x/relation/stat`, { vmid: mid })
  },
}

/**
 * 搜索相关API
 */
export const searchAPI = {
  async searchVideos(keyword: string, page: number = 1) {
    return await apiHttp<SearchResult>('/x/web-interface/search/all/v2', {
      keyword,
      page,
      search_type: 'video',
    })
  },
}

/**
 * 视频 API
 */
export const videoAPI = {
  async getDetail(bvid: string) {
    return await apiHttp<VideoDetail>('/x/web-interface/view', { bvid })
  },
}
