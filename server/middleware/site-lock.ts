import { createHmac, timingSafeEqual } from 'node:crypto'

const COOKIE_NAME = 'site_preview_auth'
const LOGIN_PATH = '/_site-lock/login'
const TOKEN_INPUT = 'site-lock-preview:v1'
const FALLBACK_PREVIEW_PASSWORD = 'Angela2026'

export default defineEventHandler(async (event) => {
  const password = getPreviewPassword()

  if (isAuthenticated(event, password)) {
    return
  }

  const url = getRequestURL(event)

  if (url.pathname === LOGIN_PATH && event.method === 'POST') {
    const body = await readBody<{ password?: string, redirect?: string }>(event)

    if (safeEquals(body.password || '', password)) {
      setCookie(event, COOKIE_NAME, createToken(password), {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
        sameSite: 'lax',
        secure: isSecureRequest(event),
      })

      return sendRedirect(event, normalizeRedirect(body.redirect), 302)
    }

    return renderGate(event, {
      statusCode: 401,
      message: 'That password did not work. Please check it and try again.',
      redirect: normalizeRedirect(body.redirect),
    })
  }

  if (!acceptsHtml(event)) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Preview password required',
    })
  }

  return renderGate(event, {
    redirect: `${url.pathname}${url.search}`,
  })
})

function isAuthenticated(event: Parameters<Parameters<typeof defineEventHandler>[0]>[0], password: string) {
  const cookieToken = getCookie(event, COOKIE_NAME)

  return Boolean(cookieToken && safeEquals(cookieToken, createToken(password)))
}

function createToken(password: string) {
  return createHmac('sha256', password).update(TOKEN_INPUT).digest('hex')
}

function getPreviewPassword() {
  return process.env.SITE_LOCK_PASSWORD || process.env.ADMIN_PASSWORD || FALLBACK_PREVIEW_PASSWORD
}

function acceptsHtml(event: Parameters<Parameters<typeof defineEventHandler>[0]>[0]) {
  const accept = getRequestHeader(event, 'accept') || ''

  return event.method === 'GET' && accept.includes('text/html')
}

function isSecureRequest(event: Parameters<Parameters<typeof defineEventHandler>[0]>[0]) {
  const forwardedProto = getRequestHeader(event, 'x-forwarded-proto')

  return process.env.VERCEL === '1' || forwardedProto === 'https' || getRequestURL(event).protocol === 'https:'
}

function normalizeRedirect(value?: string) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/'
  }

  if (value.startsWith(LOGIN_PATH)) {
    return '/'
  }

  return value
}

function safeEquals(received: string, expected: string) {
  const receivedBuffer = Buffer.from(received)
  const expectedBuffer = Buffer.from(expected)

  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  )
}

function renderGate(
  event: Parameters<Parameters<typeof defineEventHandler>[0]>[0],
  options: { statusCode?: number, message?: string, redirect?: string, showForm?: boolean } = {},
) {
  const statusCode = options.statusCode || 200
  const message = options.message || 'Enter the preview password to view this site.'
  const redirect = normalizeRedirect(options.redirect)
  const showForm = options.showForm !== false

  setResponseStatus(event, statusCode)
  setResponseHeader(event, 'Content-Type', 'text/html; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'no-store')

  return `<!doctype html>
<html lang="en-AU">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Private Preview</title>
  <style>
    :root {
      color-scheme: light;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #17201c;
      background: #fbf8f1;
    }

    * {
      box-sizing: border-box;
    }

    body {
      min-height: 100vh;
      margin: 0;
      display: grid;
      place-items: center;
      padding: 24px;
      background:
        linear-gradient(135deg, rgba(49, 95, 77, 0.18), rgba(186, 104, 73, 0.12)),
        #fbf8f1;
    }

    main {
      width: min(100%, 430px);
      padding: 32px;
      border: 1px solid rgba(23, 32, 28, 0.14);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.94);
      box-shadow: 0 24px 70px rgba(23, 32, 28, 0.16);
    }

    p {
      margin: 0;
      line-height: 1.6;
      color: #65736c;
    }

    .eyebrow {
      margin-bottom: 10px;
      color: #ba6849;
      font-size: 12px;
      font-weight: 900;
      letter-spacing: 2px;
      text-transform: uppercase;
    }

    h1 {
      margin: 0 0 12px;
      color: #17201c;
      font-size: 30px;
      line-height: 1.15;
      letter-spacing: 0;
    }

    form {
      display: grid;
      gap: 14px;
      margin-top: 24px;
    }

    label {
      display: grid;
      gap: 8px;
      color: #24332d;
      font-size: 14px;
      font-weight: 800;
    }

    input {
      width: 100%;
      min-height: 48px;
      border: 1px solid rgba(23, 32, 28, 0.18);
      border-radius: 8px;
      padding: 0 14px;
      font: inherit;
      color: #17201c;
      background: #fbf8f1;
    }

    input:focus {
      outline: 3px solid rgba(49, 95, 77, 0.18);
      border-color: #315f4d;
    }

    button {
      min-height: 48px;
      border: 0;
      border-radius: 999px;
      padding: 0 18px;
      background: #1f4235;
      color: #ffffff;
      font: inherit;
      font-weight: 900;
      cursor: pointer;
    }

    button:hover {
      background: #172f27;
    }

    .message {
      margin-top: 16px;
      color: #a33a32;
      font-weight: 800;
    }
  </style>
</head>
<body>
  <main>
    <p class="eyebrow">Private Preview</p>
    <h1>Protected site</h1>
    <p>${escapeHtml(message)}</p>
    ${showForm ? `<form method="post" action="${LOGIN_PATH}">
      <input type="hidden" name="redirect" value="${escapeHtml(redirect)}">
      <label>
        Password
        <input type="password" name="password" autocomplete="current-password" autofocus required>
      </label>
      <button type="submit">Enter preview</button>
    </form>` : ''}
  </main>
</body>
</html>`
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}
