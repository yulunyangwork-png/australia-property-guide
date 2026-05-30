import { cleanText, createLeadId, readLeads, writeLeads, type Lead } from '../../utils/storage'

export default defineEventHandler(async (event) => {
  const body = await readBody<Partial<Lead>>(event)
  const name = cleanText(body.name)
  const email = cleanText(body.email)
  const messenger = cleanText(body.messenger)

  if (!name || !email || !messenger) {
    throw createError({ statusCode: 400, statusMessage: 'All fields are required' })
  }

  const lead: Lead = {
    id: createLeadId(),
    name,
    email,
    messenger,
    createdAt: new Date().toISOString(),
  }

  const leads = await readLeads()
  await writeLeads([lead, ...leads])

  return { ok: true, lead }
})
