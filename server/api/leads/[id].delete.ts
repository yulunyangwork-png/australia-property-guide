import { assertAdmin, deleteLead, readLeads } from '../../utils/storage'

export default defineEventHandler(async (event) => {
  assertAdmin(event)

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Lead id is required' })
  }

  const leads = await readLeads()
  const leadExists = leads.some((lead) => lead.id === id)

  if (!leadExists) {
    throw createError({ statusCode: 404, statusMessage: 'Lead not found' })
  }

  await deleteLead(id)

  return { ok: true }
})
