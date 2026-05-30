import { assertAdmin, deleteArticle, readArticles } from '../../utils/storage'

export default defineEventHandler(async (event) => {
  assertAdmin(event)

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Article id is required' })
  }

  const articles = await readArticles()
  const articleExists = articles.some((article) => article.id === id)

  if (!articleExists) {
    throw createError({ statusCode: 404, statusMessage: 'Article not found' })
  }

  await deleteArticle(id)

  return { ok: true }
})
