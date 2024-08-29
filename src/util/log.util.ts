import winston from 'winston'
import dayjs from 'dayjs'
import _ from 'lodash'

/*
 winston 默认日志级别
{
  none: 0,
  error: 1,
  trace: 2,
  warn: 3,
  info: 4,
  verbose: 5,
  debug: 6,
  silly: 7,
  all: 8
}
 */

const LOG_LEVEL: string = process.env.LOG_LEVEL || 'silly'

const instanceMap: { [key: string]: any } = {}

const formatSplatArr = (splatArr: any) => {
  return _.reduce(
    splatArr,
    (init, it) => {
      try {
        it = JSON.parse(it)
      } catch (e) {
        // do nothing
      }
      return init + JSON.stringify(it)
    },
    ''
  )
}

const myFormat = winston.format.printf((option) => {
  const { level, message, label, timestamp } = option
  return `${level} [${dayjs(timestamp).format(
    'YYYY-MM-DD HH:mm:ss.SSS'
  )}] [${label}]: ${message}`
})

const errorStackFormat = winston.format((info) => {
  if (info.level === 'error') {
    return Object.assign({}, info, {
      message: `Error: ${info.message}, Stack: ${info.stack}`
    })
  }
  return info
})

const metaFormat = winston.format((option) => {
  const splat = option[Symbol.for('splat')]
  if (!_.isEmpty(splat)) {
    option.message = option.message + ` ${formatSplatArr(splat)}`
  }
  return option
})

export default (category: string) => {
  if (instanceMap[category]) {
    return instanceMap[category]
  }

  instanceMap[category] = winston.createLogger({
    level: LOG_LEVEL,
    format: winston.format.combine(
      errorStackFormat(),
      metaFormat(),
      winston.format.label({ label: category }),
      winston.format.timestamp(),
      winston.format.json()
    ),
    exitOnError: false,
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(winston.format.colorize(), myFormat)
      })
    ]
  })

  return instanceMap[category]
}
