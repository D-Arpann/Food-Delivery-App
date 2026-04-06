import { TABLES, USER_ROLES, onlyDigits } from '@repo/utils';

function fallbackEmail(phone, userId) {
  const phoneDigits = onlyDigits(phone);
  const seed = phoneDigits || userId?.slice(0, 10) || Date.now();
  return `phone-${seed}@chitomitho.local`;
}

function fallbackName(phone) {
  const phoneDigits = onlyDigits(phone);
  const suffix = phoneDigits.slice(-4);
  return suffix ? `User ${suffix}` : 'Customer';
}

async function findExistingProfile(client, phone, userId) {
  if (userId) {
    const { data: byId, error: byIdError } = await client
      .from(TABLES.PROFILES)
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (byIdError) {
      return { data: null, error: byIdError };
    }

    if (byId) {
      return { data: byId, error: null };
    }
  }

  if (phone) {
    const { data: byPhone, error: byPhoneError } = await client
      .from(TABLES.PROFILES)
      .select('*')
      .eq('phone', phone)
      .maybeSingle();

    if (byPhoneError) {
      return { data: null, error: byPhoneError };
    }

    if (byPhone) {
      return { data: byPhone, error: null };
    }
  }

  return { data: null, error: null };
}

export async function sendPhoneOtp(client, phone) {
  const { data, error } = await client.auth.signInWithOtp({ phone });
  return { data, error };
}

export async function verifyPhoneOtp(client, phone, token) {
  const { data, error } = await client.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  });
  return { data, error };
}

export async function upsertCurrentUserProfile(client, profileInput = {}) {
  const { data: userData, error: userError } = await client.auth.getUser();

  if (userError) {
    return { data: null, error: userError };
  }

  const user = userData?.user;

  if (!user?.id) {
    return {
      data: null,
      error: { message: 'No authenticated user found for profile sync.' },
    };
  }

  const phone =
    profileInput.phone ||
    user.phone ||
    user.user_metadata?.phone ||
    '';

  const fullName =
    profileInput.full_name ||
    profileInput.fullName ||
    user.user_metadata?.full_name ||
    fallbackName(phone);

  const email =
    profileInput.email ||
    user.email ||
    user.user_metadata?.email ||
    fallbackEmail(phone, user.id);

  const role = profileInput.role || user.user_metadata?.role || USER_ROLES.CUSTOMER;

  const profilePayload = {
    id: user.id,
    full_name: fullName,
    email,
    phone,
    role,
  };

  const { data, error } = await client
    .from(TABLES.PROFILES)
    .upsert(profilePayload, { onConflict: 'id' })
    .select()
    .single();

  return { data, error };
}

export async function verifyOtpAndSyncProfile(client, payload) {
  const { phone, token, profile } = payload;
  const { data: authData, error: authError } = await verifyPhoneOtp(
    client,
    phone,
    token,
  );

  if (authError) {
    return { data: null, error: authError };
  }

  if (!authData?.session) {
    return { data: authData, error: null };
  }

  const userId = authData?.user?.id || authData?.session?.user?.id;
  const { data: existingProfile, error: lookupError } = await findExistingProfile(
    client,
    phone,
    userId,
  );

  if (lookupError) {
    return { data: { ...authData, profile: null, needsSignup: false }, error: lookupError };
  }

  if (!existingProfile) {
    return {
      data: { ...authData, profile: null, needsSignup: true },
      error: null,
    };
  }

  if (!profile || Object.keys(profile).length === 0) {
    return {
      data: { ...authData, profile: existingProfile, needsSignup: false },
      error: null,
    };
  }

  const { data: profileData, error: profileError } = await upsertCurrentUserProfile(client, {
    phone,
    ...profile,
  });

  if (profileError) {
    return {
      data: { ...authData, profile: null, needsSignup: false },
      error: profileError,
    };
  }

  return {
    data: { ...authData, profile: profileData, needsSignup: false },
    error: null,
  };
}

export async function completeSignupProfile(client, payload) {
  const metadata = {};

  if (payload.full_name || payload.fullName) {
    metadata.full_name = payload.full_name || payload.fullName;
  }

  if (payload.email) {
    metadata.email = payload.email;
  }

  if (payload.date_of_birth || payload.dateOfBirth) {
    metadata.date_of_birth = payload.date_of_birth || payload.dateOfBirth;
  }

  if (Object.keys(metadata).length > 0) {
    const { error: updateError } = await client.auth.updateUser({ data: metadata });
    if (updateError) {
      return { data: null, error: updateError };
    }
  }

  const { data: profileData, error: profileError } = await upsertCurrentUserProfile(
    client,
    payload,
  );

  if (profileError) {
    return { data: null, error: profileError };
  }

  return { data: profileData, error: null };
}

export async function logout(client) {
  const { error } = await client.auth.signOut();
  return { error };
}
