/**
 * Shared authentication helpers for @repo/api.
 *
 * These functions are platform-agnostic: the consuming app (Web or Mobile)
 * creates a Supabase client via `createAppClient` and passes it in.
 */

/**
 * Sign in an existing user with email and password.
 *
 * @param   {import('@supabase/supabase-js').SupabaseClient} client
 * @param   {string} email
 * @param   {string} password
 * @returns {Promise<{ data: object | null, error: object | null }>}
 */
export async function login(client, email, password) {
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  })

  return { data, error }
}

/**
 * Register a new user and create a matching row in the `profiles` table.
 *
 * Flow:
 *   1. `auth.signUp` → creates the auth user and returns `user.id`.
 *   2. Insert a row into `profiles` with the extra fields.
 *
 * @param   {import('@supabase/supabase-js').SupabaseClient} client
 * @param   {string}  email
 * @param   {string}  password
 * @param   {string}  full_name
 * @param   {string}  phone
 * @param   {string}  [role='customer']  - Defaults to `'customer'` when omitted.
 * @returns {Promise<{ data: object | null, error: object | null }>}
 */
export async function signup(
  client,
  email,
  password,
  full_name,
  phone,
  role = 'customer',
) {
  // ── 1. Create the auth user ──────────────────────────────────
  const { data: authData, error: authError } = await client.auth.signUp({
    email,
    password,
  })

  if (authError) {
    return { data: null, error: authError }
  }

  const userId = authData?.user?.id

  if (!userId) {
    return {
      data: null,
      error: { message: 'Signup succeeded but no user ID was returned.' },
    }
  }

  // ── 2. Insert profile row ───────────────────────────────────
  const { data: profileData, error: profileError } = await client
    .from('profiles')
    .insert({
      id: userId,
      full_name,
      phone,
      role,
    })
    .select()
    .single()

  if (profileError) {
    return {
      data: authData,
      error: {
        message: `Auth user created but profile insert failed: ${profileError.message}`,
        authData,
        profileError,
      },
    }
  }

  return {
    data: {
      user: authData.user,
      session: authData.session,
      profile: profileData,
    },
    error: null,
  }
}

/**
 * Sign out the currently authenticated user.
 *
 * @param   {import('@supabase/supabase-js').SupabaseClient} client
 * @returns {Promise<{ error: object | null }>}
 */
export async function logout(client) {
  const { error } = await client.auth.signOut()

  return { error }
}
