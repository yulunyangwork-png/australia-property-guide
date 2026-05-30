import {
  assertAdmin,
  cleanText,
  createArticleId,
  createExcerpt,
  isArticleCategory,
  normalizeHeroImage,
  readArticles,
  sanitizeRichText,
  writeArticles,
  type Article,
} from '../../utils/storage'

export default defineEventHandler(async (event) => {
  assertAdmin(event)

  const body = await readBody<Partial<Article>>(event)
  const title = cleanText(body.title)
  const category = body.category
  const content = sanitizeRichText(body.content)

  if (!title) {
    throw createError({ statusCode: 400, statusMessage: 'Title is required' })
  }

  if (!isArticleCategory(category)) {
    throw createError({ statusCode: 400, statusMessage: 'Category is invalid' })
  }

  if (!content) {
    throw createError({ statusCode: 400, statusMessage: 'Content is required' })
  }

  const article: Article = {
    id: createArticleId(title),
    title,
    category,
    heroImage: normalizeHeroImage(body.heroImage),
    excerpt: createExcerpt(content),
    content,
    createdAt: new Date().toISOString(),
  }

  const articles = await readArticles()
  await writeArticles([article, ...articles])

  return article
})
