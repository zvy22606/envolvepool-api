import dotenv from 'dotenv'
dotenv.config()
import app from './app'
import './util/date.util'

process.on('uncaughtException', (err) => {
  console.error('[Launch pool] Uncaught Exception:', err)
  // Perform necessary cleanup or logging
})

process.on('unhandledRejection', (reason, promise) => {
  console.error(
    '[Launch pool] Unhandled Rejection at:',
    promise,
    'reason:',
    reason
  )
  // Perform necessary cleanup or logging
})

const PORT = Number(process.env.PORT || 3000)
app.listen(PORT, () => console.log(`Server running on port: ${PORT}`))
