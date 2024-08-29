import Redis from 'ioredis'
import config from 'config'
import getLogger from '../util/log.util'
const logger = getLogger('redis')

const cache = new Redis({
  port: config.get('redis.port'),
  host: config.get('redis.host'),
  db: 0,
  username: config.get('redis.username'),
  keyPrefix: config.get('redis.prefix')
  // tls: process.env.NODE_ENV ? {} : undefined
})

cache.on('connect', function () {
  logger.info(
    `redis ${config.get('redis.host')}:${config.get(
      'redis.port'
    )} connect successfully`
  )
})

cache.on('error', function (err) {
  logger.info(
    `redis ${config.get('redis.host')}:${config.get(
      'redis.port'
    )} connect error`,
    err
  )
})

export default cache
