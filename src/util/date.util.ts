import dayjs, { Dayjs } from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(isoWeek)
dayjs.extend(utc)
dayjs.extend(timezone)

dayjs.tz.setDefault('Asia/Shanghai')

export class DateUtil {
  public static getToday(): string {
    return dayjs().tz().format('YYYY-MM-DD 00:00:00+08:00')
  }

  public static getMonday(time?: string | number | Date | Dayjs): string {
    if (!time) {
      time = this.getToday()
    }
    return dayjs(time).tz().isoWeekday(1).format('YYYY-MM-DD 00:00:00+08:00')
  }

  public static isYesterday(time: string | number | Date | Dayjs): boolean {
    const start = dayjs().tz().subtract(1, 'd').startOf('day')
    const end = start.add(1, 'd')
    return start.isBefore(time) && end.isAfter(time)
  }

  public static isToday(time: string | number | Date | Dayjs): boolean {
    const start = dayjs().tz().startOf('day')
    const end = start.add(1, 'd')
    return start.isBefore(time) && end.isAfter(time)
  }
}
