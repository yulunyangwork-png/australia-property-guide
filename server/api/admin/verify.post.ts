import { assertAdmin } from '../../utils/storage'

export default defineEventHandler((event) => {
  assertAdmin(event)

  return { ok: true }
})
