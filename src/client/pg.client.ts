import { PrismaClient } from '@prisma/client'
import getLogger from '../util/log.util'

const logger = getLogger('pgClient')

const pgClient = new PrismaClient({
  log: [
    {
      level: 'query',
      emit: 'event'
    }
  ]
})

pgClient
  .$connect()
  .then((data) => {
    logger.info('Database connection success')
    return data
  })
  .catch((e) => {
    logger.error(e)
  })

pgClient.$on('query', (e) => {
  logger.debug(e.query, e.params)
})

export default pgClient
