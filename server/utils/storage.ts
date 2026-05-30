import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createError, getHeader, type H3Event } from 'h3'

export const articleCategories = ['布里斯本房產', '首次購屋', '投資區域', '澳洲生活'] as const

export type ArticleCategory = (typeof articleCategories)[number]

export interface Article {
  id: string
  title: string
  category: ArticleCategory
  heroImage: string
  excerpt: string
  content: string
  createdAt: string
}

export interface Lead {
  id: string
  name: string
  email: string
  messenger: string
  createdAt: string
}

interface ArticleRow {
  id: string
  title: string
  category: string
  hero_image: string
  excerpt: string
  content: string
  created_at: string
}

interface LeadRow {
  id: string
  name: string
  email: string
  messenger: string
  created_at: string
}

interface SupabaseConfig {
  url: string
  key: string
}

const dataDir = join(process.cwd(), '.data')
const articlesFile = join(dataDir, 'articles.json')
const leadsFile = join(dataDir, 'leads.json')
const defaultSupabaseUrl = 'https://aiprxncwrkahjgpsktrb.supabase.co'
const fallbackHero =
  'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1200&q=80'

const seededArticles: Article[] = [
  {
    id: 'brisbane-family-suburbs',
    title: 'Brisbane 哪些區域適合亞洲家庭？',
    category: '布里斯本房產',
    heroImage:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    excerpt: '從學校、交通、生活機能與預算角度，整理適合家庭居住的區域。',
    content:
      '<p>從學校、交通、生活機能與預算角度，整理適合家庭居住的區域。</p><p><strong>Brisbane 買房</strong>不只是比較房價，也要把家庭日常、孩子上學與通勤節奏一起放進考量。</p>',
    createdAt: '2026-05-28T09:00:00.000Z',
  },
  {
    id: 'australia-first-home-guide',
    title: '澳洲首次購屋完整攻略',
    category: '首次購屋',
    heroImage:
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
    excerpt: '整理首購補助、貸款準備、頭期款與看房流程。',
    content:
      '<p>整理首購補助、貸款準備、頭期款與看房流程。</p><p>首次購屋最重要的是先建立順序：預算、貸款、區域、物件，再進入出價與合約。</p>',
    createdAt: '2026-05-24T09:00:00.000Z',
  },
  {
    id: 'logan-investment-potential',
    title: 'Logan 還值得投資嗎？',
    category: '投資區域',
    heroImage:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    excerpt: '用租金、成長性、交通與人口結構分析投資潛力。',
    content:
      '<p>用租金、成長性、交通與人口結構分析投資潛力。</p><p>投資判斷不能只看價格，也要看租客需求、交通動線與長期人口結構。</p>',
    createdAt: '2026-05-20T09:00:00.000Z',
  },
]

export function assertAdmin(event: H3Event) {
  const password = getHeader(event, 'x-admin-password')
  const expectedPassword = process.env.NUXT_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'Angela2026'

  if (password !== expectedPassword) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid admin password',
    })
  }
}

export function isArticleCategory(value: unknown): value is ArticleCategory {
  return typeof value === 'string' && articleCategories.includes(value as ArticleCategory)
}

export async function readArticles() {
  const supabaseArticles = await readSupabaseArticles()

  if (supabaseArticles) {
    return sortByCreatedAt(supabaseArticles)
  }

  const articles = await readJson<Article[]>(articlesFile, seededArticles)

  return sortByCreatedAt(articles)
}

export async function writeArticles(articles: Article[]) {
  if (hasSupabaseConfig()) {
    await upsertSupabaseArticles(articles)
    return
  }

  await writeJson(articlesFile, articles)
}

export async function readLeads() {
  const supabaseLeads = await readSupabaseLeads()

  if (supabaseLeads) {
    return sortByCreatedAt(supabaseLeads)
  }

  const leads = await readJson<Lead[]>(leadsFile, [])

  return sortByCreatedAt(leads)
}

export async function writeLeads(leads: Lead[]) {
  if (hasSupabaseConfig()) {
    await upsertSupabaseLeads(leads)
    return
  }

  await writeJson(leadsFile, leads)
}

export function createArticleId(title: string) {
  const slug = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 42)

  return `${slug || 'article'}-${Date.now().toString(36)}`
}

export function createLeadId() {
  return `lead-${Date.now().toString(36)}`
}

export function createExcerpt(content: string) {
  const text = stripHtml(content)

  return text.length > 128 ? `${text.slice(0, 128)}...` : text
}

export function normalizeHeroImage(value: unknown) {
  if (typeof value !== 'string' || value.trim() === '') {
    return fallbackHero
  }

  try {
    const url = new URL(value.trim())

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return fallbackHero
    }

    return url.toString()
  } catch {
    return fallbackHero
  }
}

export function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : ''
}

export function sanitizeRichText(value: unknown) {
  if (typeof value !== 'string') {
    return ''
  }

  let html = value
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/\son\w+=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\sstyle=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')

  html = html.replace(/<a\b([^>]*)>/gi, (_match, attrs: string) => {
    const hrefMatch = attrs.match(/\shref=(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i)
    const href = hrefMatch?.[1] || hrefMatch?.[2] || hrefMatch?.[3] || ''

    if (!isSafeHref(href)) {
      return '<a>'
    }

    return `<a href="${escapeAttribute(href)}" target="_blank" rel="noopener noreferrer">`
  })

  html = html.replace(
    /<(\/?)(p|br|strong|b|em|i|u|ul|ol|li|h2|h3|blockquote)(?:\s[^>]*)?>/gi,
    '<$1$2>',
  )

  html = html.replace(
    /<(?!\/?(?:p|br|strong|b|em|i|u|ul|ol|li|h2|h3|blockquote|a)\b)[^>]+>/gi,
    '',
  )

  return html.trim()
}

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const file = await readFile(filePath, 'utf8')
    return JSON.parse(file) as T
  } catch {
    return fallback
  }
}

async function writeJson<T>(filePath: string, value: T) {
  await mkdir(dataDir, { recursive: true })
  await writeFile(filePath, JSON.stringify(value, null, 2), 'utf8')
}

async function readSupabaseArticles() {
  if (!hasSupabaseConfig()) {
    return null
  }

  const rows = await supabaseRequest<ArticleRow[]>(
    'articles?select=id,title,category,hero_image,excerpt,content,created_at&order=created_at.desc',
  )

  return rows.map(fromArticleRow)
}

async function upsertSupabaseArticles(articles: Article[]) {
  await supabaseRequest('articles?on_conflict=id', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify(articles.map(toArticleRow)),
  })
}

async function readSupabaseLeads() {
  if (!hasSupabaseConfig()) {
    return null
  }

  const rows = await supabaseRequest<LeadRow[]>(
    'leads?select=id,name,email,messenger,created_at&order=created_at.desc',
  )

  return rows.map(fromLeadRow)
}

async function upsertSupabaseLeads(leads: Lead[]) {
  await supabaseRequest('leads?on_conflict=id', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify(leads.map(toLeadRow)),
  })
}

async function supabaseRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const config = getSupabaseConfig()

  if (!config) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase service role key is not configured',
    })
  }

  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    ...options,
    headers: {
      ...getSupabaseAuthHeaders(config.key),
      ...(options.headers as Record<string, string> | undefined),
    },
  })

  const text = await response.text()

  if (!response.ok) {
    throw createError({
      statusCode: response.status,
      statusMessage: text || 'Supabase request failed',
    })
  }

  return text ? (JSON.parse(text) as T) : ([] as T)
}

function hasSupabaseConfig() {
  return Boolean(getSupabaseConfig())
}

function getSupabaseConfig(): SupabaseConfig | null {
  const url = (process.env.SUPABASE_URL || process.env.NUXT_SUPABASE_URL || defaultSupabaseUrl)
    .trim()
    .replace(/\/$/, '')
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NUXT_SUPABASE_SERVICE_ROLE_KEY ||
    ''
  ).trim()
  if (!url || !key) {
    return null
  }

  return { url, key }
}

function toArticleRow(article: Article): ArticleRow {
  return {
    id: article.id,
    title: article.title,
    category: article.category,
    hero_image: article.heroImage,
    excerpt: article.excerpt,
    content: article.content,
    created_at: article.createdAt,
  }
}

function fromArticleRow(row: ArticleRow): Article {
  return {
    id: row.id,
    title: row.title,
    category: isArticleCategory(row.category) ? row.category : '澳洲生活',
    heroImage: row.hero_image,
    excerpt: row.excerpt,
    content: row.content,
    createdAt: row.created_at,
  }
}

function getSupabaseAuthHeaders(key: string) {
  if (key.startsWith('sb_')) {
    return {
      apikey: key,
    }
  }

  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
  }
}

function toLeadRow(lead: Lead): LeadRow {
  return {
    id: lead.id,
    name: lead.name,
    email: lead.email,
    messenger: lead.messenger,
    created_at: lead.createdAt,
  }
}

function fromLeadRow(row: LeadRow): Lead {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    messenger: row.messenger,
    createdAt: row.created_at,
  }
}

function sortByCreatedAt<T extends { createdAt: string }>(items: T[]) {
  return items.toSorted((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function isSafeHref(href: string) {
  if (href.startsWith('/') || href.startsWith('#')) {
    return true
  }

  try {
    const url = new URL(href)
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol)
  } catch {
    return false
  }
}

function escapeAttribute(value: string) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}
