const AUTH_REALM = 'Private site'

export default defineEventHandler((event) => {
  const password = process.env.SITE_LOCK_PASSWORD

  if (!password) {
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') {
      throw createError({
        statusCode: 503,
        statusMessage: 'Site locked',
      })
    }

    return
  }

  const username = process.env.SITE_LOCK_USERNAME || 'owner'
  const authorization = getRequestHeader(event, 'authorization') || ''
  const [scheme, encodedCredentials] = authorization.split(' ')

  if (scheme !== 'Basic' || !encodedCredentials) {
    return requireAuthentication(event)
  }

  let decodedCredentials = ''

  try {
    decodedCredentials = Buffer.from(encodedCredentials, 'base64').toString('utf8')
  } catch {
    return requireAuthentication(event)
  }

  const separatorIndex = decodedCredentials.indexOf(':')
  const receivedUsername = decodedCredentials.slice(0, separatorIndex)
  const receivedPassword = decodedCredentials.slice(separatorIndex + 1)

  if (separatorIndex === -1 || receivedUsername !== username || receivedPassword !== password) {
    return requireAuthentication(event)
  }
})

function requireAuthentication(event: Parameters<Parameters<typeof defineEventHandler>[0]>[0]) {
  setResponseHeader(event, 'WWW-Authenticate', `Basic realm="${AUTH_REALM}", charset="UTF-8"`)

  throw createError({
    statusCode: 401,
    statusMessage: 'Authentication required',
  })
}
