import { assertAdmin, readLeads } from '../../utils/storage'

export default defineEventHandler(async (event) => {
  assertAdmin(event)

  return readLeads()
})
