import { FuelType } from '@prisma/client'
import joinDiscord from './joinDiscord'
import followTwitter from './followTwitter'
import retweet from './retweet'
import { Factory } from './factory'

export default {
  [FuelType.JOIN_DISCORD]: joinDiscord,
  [FuelType.FOLLOW_TWITTER]: followTwitter,
  [FuelType.RETWEET_TWITTER]: retweet
} as { [key: string]: Factory }
