import { searchAPI } from './common/api'

async function main(): Promise<void> {
  // console.log(await userAPI.getInfo(668380))
  // console.warn(await userAPI.getRelationStat(668380))
  console.warn(await searchAPI.searchVideos('mcp server', 1))
}

main()
