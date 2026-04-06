import { createClient } from '@supabase/supabase-js'

export function createAppClient({ supabaseUrl, supabaseKey, storageAdapter }) {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      '[@repo/api] createAppClient requires both "supabaseUrl" and "supabaseKey".',
    )
  }

  const options = {}

  if (storageAdapter) {
    options.auth = {
      storage: storageAdapter,
    }
  }

  return createClient(supabaseUrl, supabaseKey, options)
}
