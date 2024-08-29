import fs from 'fs'
import _ from 'lodash'
import { File } from 'formidable'
import { Client, ForumChannel, GatewayIntentBits } from 'discord.js'
import getLogger from '../util/log.util'
const logger = getLogger('discordClient')

class DiscordClient {
  private client: Client

  constructor() {
    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages
      ]
    })

    client.on('ready', () => {
      logger.info(`Logged in as ${client.user?.tag}!`)
    })

    if (process.env.NODE_ENV && process.env.DISCORD_BOT_TOKEN) {
      client.login(process.env.DISCORD_BOT_TOKEN)
    }

    this.client = client
  }

  async sendPost(data: {
    title: string
    content: string
    tags: string[]
    files: File[]
  }) {
    // await client.login(
    //   'MTE4Nzg0MDA5NDE4MzM2MjU4MA.Gms-Tl.fKuYWTMr7S5Tnz4aQd-oEQLGqRDo2MEANuJsgk'
    // )
    // const channel = await this.client.channels.fetch('1201883352102342686')
    const channel = await this.client.channels.fetch('1099376090713166055')
    if (!channel) return
    const chTags = (channel as ForumChannel).availableTags
    const tags: any[] = []
    data.tags.forEach((tag) => {
      const chTag = _.find(chTags, { name: tag })
      if (chTag) {
        tags.push(chTag.id)
      }
    })
    // const ch = await (channel as ForumChannel).setAvailableTags(tags)
    await (channel as ForumChannel).threads.create({
      name: data.title,
      message: {
        content: data.content,
        files: _.map(data.files, (file) => {
          return fs.readFileSync(file.filepath)
        })
      },
      appliedTags: tags
    })
  }

  async hasMember(userId: string) {
    return this.client.users
      .fetch(userId)
      .then((user) => {
        logger.info(`get member: ${JSON.stringify(user)}`)
        return true
      })
      .catch((err) => {
        logger.info(`get member error: ${err.message}`)
        return false
      })
  }
}

export default new DiscordClient()
