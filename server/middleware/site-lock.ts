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
      message: '密碼不正確，請再試一次。',
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
  const message = options.message || '請輸入預覽密碼即可查看網站。'
  const redirect = normalizeRedirect(options.redirect)
  const showForm = options.showForm !== false

  setResponseStatus(event, statusCode)
  setResponseHeader(event, 'Content-Type', 'text/html; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'no-store')

  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Private Preview</title>
  <style>
    :root {
      color-scheme: light;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #23312f;
      background: #f6f0e6;
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
        linear-gradient(135deg, rgba(38, 74, 66, 0.14), rgba(180, 137, 74, 0.12)),
        #f6f0e6;
    }

    main {
      width: min(100%, 420px);
      padding: 32px;
      border: 1px solid rgba(35, 49, 47, 0.14);
      border-radius: 8px;
      background: rgba(255, 252, 246, 0.94);
      box-shadow: 0 24px 70px rgba(35, 49, 47, 0.16);
    }

    p {
      margin: 0;
      line-height: 1.6;
      color: #586662;
    }

    .eyebrow {
      margin-bottom: 10px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0;
      color: #9a6a2f;
      text-transform: uppercase;
    }

    h1 {
      margin: 0 0 12px;
      font-size: 30px;
      line-height: 1.15;
      letter-spacing: 0;
      color: #1f3430;
    }

    form {
      display: grid;
      gap: 14px;
      margin-top: 24px;
    }

    label {
      display: grid;
      gap: 8px;
      font-size: 14px;
      font-weight: 700;
      color: #2b3f3a;
    }

    input {
      width: 100%;
      min-height: 48px;
      border: 1px solid rgba(35, 49, 47, 0.18);
      border-radius: 6px;
      padding: 0 14px;
      font: inherit;
      color: #1f3430;
      background: #fffaf2;
    }

    input:focus {
      outline: 3px solid rgba(180, 137, 74, 0.24);
      border-color: #b4894a;
    }

    button {
      min-height: 48px;
      border: 0;
      border-radius: 6px;
      padding: 0 18px;
      font: inherit;
      font-weight: 800;
      color: #fffaf2;
      background: #25463e;
      cursor: pointer;
    }

    button:hover {
      background: #1d3832;
    }

    .message {
      margin-top: 16px;
      color: #8f3e32;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <main>
    <p class="eyebrow">Private Preview</p>
    <h1>請輸入密碼</h1>
    <p>${escapeHtml(message)}</p>
    ${showForm ? `<form method="post" action="${LOGIN_PATH}">
      <input type="hidden" name="redirect" value="${escapeHtml(redirect)}">
      <label>
        密碼
        <input type="password" name="password" autocomplete="current-password" autofocus required>
      </label>
      <button type="submit">進入網站</button>
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
