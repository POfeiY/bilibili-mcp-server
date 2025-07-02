import type { SearchResult, UserInfo, VideoDetail } from './types'
import { searchAPI, userAPI, videoAPI } from './api'
import i18n from './i18n'

export async function getUserInfo(mid: number): Promise<UserInfo> {
  try {
    const userInfo = (await userAPI.getInfo(mid)) || {}

    const followerData = (await userAPI.getRelationStat(mid)) || {}

    userInfo.followInfo = {
      follower: followerData.followers,
      following: followerData.following,
    }

    return userInfo
  }
  catch (error) {
    console.error(`Error fetching user info:`, error)
    throw error
  }
}

export function formatUserInfo(user: UserInfo): string {
  const t = i18n.user
  const baseInfo = {
    [t.profile]: `https://space.bilibili.com/${user.mid}`,
    [t.uid]: user.mid,
  }
  const optionalInfo: Record<string, string | undefined> = {
    [t.nickname]: user.name,
    [t.followers]: user.followInfo?.follower?.toLocaleString(),
    [t.following]: user.followInfo?.following?.toLocaleString(),
    [t.level]: user.level?.toString(),
    [t.avatar]: user.face,
    [t.bio]: user.sign,
    [t.birthday]: user.birthday,
    [t.tags]: user.tags?.length > 0 ? user.tags.join(', ') : undefined,
    [t.verification]: user.official?.title,
    [t.verificationDesc]: user.official?.title
      ? user.official?.desc
      : undefined,
    [t.liveRoomUrl]: user.live_room?.url,
    [t.liveStatus]: user.live_room?.url
      ? user.live_room.liveStatus
        ? t.liveOn
        : t.liveOff
      : undefined,
  }

  let info = `${Object.entries(baseInfo)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n')}\n`

  info += Object.entries(optionalInfo)
    .filter(([_, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n')

  return info
}

export async function searchVideos(keyword: string, page: number = 1): Promise<SearchResult> {
  try {
    return await searchAPI.searchVideos(keyword, page)
  }
  catch (error) {
    console.error('Error searching videos', error)
    throw error
  }
}

/**
 * 格式化时间戳
 * @param timestamp
 * @returns
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  return date.toLocaleString()
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainSeconds = seconds % 60

  if (hours > 0)
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainSeconds.toString().padStart(2, '0')}`
  else
    return `${minutes.toString().padStart(2, '0')}:${remainSeconds.toString().padStart(2, '0')}`
}

export async function getVideoDetail(bvid: string): Promise<VideoDetail> {
  try {
    return await videoAPI.getDetail(bvid)
  }
  catch (error) {
    console.error('Error fetch video:', error)
    throw error
  }
}
