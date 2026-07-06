import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createError, getHeader, type H3Event } from 'h3'

export const articleCategories = ['市場解讀', '地區分析', '買房步驟', '生活方式'] as const

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
const fallbackHero = '/images/brisbane-property-hero.png'

const seededArticles: Article[] = [
  {
    id: 'brisbane-market-trends',
    title: '2024 布里斯班房地產市場趨勢與機會',
    category: '市場解讀',
    heroImage: '/images/brisbane-river-hero-concept.png',
    excerpt:
      '利率、供應與人口增長如何影響未來的房價走勢。',
    content:
      '<p>布里斯班市場不只看單一房價數字，更要同時理解人口流入、供應限制、利率環境與區域生活機能。</p><p><strong>好的決策來自清楚比較。</strong> 當您知道哪些因素真正影響未來需求，就能更穩定地篩選房源。</p>',
    createdAt: '2026-05-28T09:00:00.000Z',
  },
  {
    id: 'brisbane-area-comparison',
    title: '熱門區域深度對比：內城 vs 東南 vs 西區',
    category: '地區分析',
    heroImage: '/images/brisbane-property-hero.png',
    excerpt:
      '學區、交通、生活配套與增值潛力全面對比。',
    content:
      '<p>每個區域都有不同的生活節奏與投資邏輯。內城重視便利性，東南區常與學區和家庭生活連結，西區則需要更仔細看交通與持有成本。</p><p>比較區域時，請把生活需求、預算、通勤和未來轉售一起放進同一張表。</p>',
    createdAt: '2026-05-24T09:00:00.000Z',
  },
  {
    id: 'first-home-buying-process',
    title: '首次置業完整流程：一步一步不踩坑',
    category: '買房步驟',
    heroImage:
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
    excerpt:
      '從貸款預批到交割入住，關鍵步驟與注意事項。',
    content:
      '<p>第一次買房最怕資訊分散：貸款、看房、出價、合約、驗屋、保險與交割，每一步都有時間點與風險。</p><p>先建立流程地圖，再開始看房，能幫助您更冷靜地比較選項，也避免在壓力下做出倉促決定。</p>',
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

  await writeJson(articlesFile, sortByCreatedAt(articles))
}

export async function saveArticle(article: Article) {
  if (hasSupabaseConfig()) {
    await upsertSupabaseArticles([article])
    return
  }

  const articles = await readJson<Article[]>(articlesFile, seededArticles)
  const articleIndex = articles.findIndex((item) => item.id === article.id)

  if (articleIndex >= 0) {
    articles[articleIndex] = article
  } else {
    articles.unshift(article)
  }

  await writeJson(articlesFile, sortByCreatedAt(articles))
}

export async function deleteArticle(id: string) {
  if (hasSupabaseConfig()) {
    await deleteSupabaseArticle(id)
    return
  }

  const articles = await readJson<Article[]>(articlesFile, seededArticles)

  await writeJson(
    articlesFile,
    articles.filter((article) => article.id !== id),
  )
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

  await writeJson(leadsFile, sortByCreatedAt(leads))
}

export async function deleteLead(id: string) {
  if (hasSupabaseConfig()) {
    await deleteSupabaseLead(id)
    return
  }

  const leads = await readJson<Lead[]>(leadsFile, [])

  await writeJson(
    leadsFile,
    leads.filter((lead) => lead.id !== id),
  )
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

  const trimmed = value.trim()

  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed
  }

  try {
    const url = new URL(trimmed)

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
    /<(?!\/?(?:p|br|strong|b|em|i|u|ol|ul|li|h2|h3|blockquote|a)\b)[^>]+>/gi,
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

async function deleteSupabaseArticle(id: string) {
  await supabaseRequest(`articles?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
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

async function deleteSupabaseLead(id: string) {
  await supabaseRequest(`leads?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
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
    category: isArticleCategory(row.category) ? row.category : '生活方式',
    heroImage: row.hero_image || fallbackHero,
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
