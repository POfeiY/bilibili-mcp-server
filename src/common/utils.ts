import type { UserInfo } from './types'
import { userAPI } from './api'

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

// export function formatUserInfo(user:UserInfo):string {
//   const t = i18n
// }
