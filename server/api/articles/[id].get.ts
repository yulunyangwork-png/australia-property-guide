import { readArticles } from '../../utils/storage'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const articles = await readArticles()
  const article = articles.find((item) => item.id === id)

  if (!article) {
    throw createError({ statusCode: 404, statusMessage: 'Article not found' })
  }

  return article
})
