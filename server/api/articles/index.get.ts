import { readArticles } from '../../utils/storage'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const limit = Number(query.limit)
  const articles = await readArticles()

  if (Number.isFinite(limit) && limit > 0) {
    return articles.slice(0, limit)
  }

  return articles
})
