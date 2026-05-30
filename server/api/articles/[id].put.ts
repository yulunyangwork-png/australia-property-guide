import {
  assertAdmin,
  cleanText,
  createExcerpt,
  isArticleCategory,
  normalizeHeroImage,
  readArticles,
  sanitizeRichText,
  saveArticle,
  type Article,
} from '../../utils/storage'

export default defineEventHandler(async (event) => {
  assertAdmin(event)

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Article id is required' })
  }

  const articles = await readArticles()
  const existingArticle = articles.find((article) => article.id === id)

  if (!existingArticle) {
    throw createError({ statusCode: 404, statusMessage: 'Article not found' })
  }

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
    id,
    title,
    category,
    heroImage: normalizeHeroImage(body.heroImage),
    excerpt: createExcerpt(content),
    content,
    createdAt: existingArticle.createdAt,
  }

  await saveArticle(article)

  return article
})
