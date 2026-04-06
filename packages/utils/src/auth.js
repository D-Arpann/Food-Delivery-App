export const AUTH_OTP_LENGTH = 4;
export const NEPAL_COUNTRY_CODE = '+977';

export function onlyDigits(value = '') {
  return String(value).replace(/\D/g, '');
}

export function hasMinDigits(value, minDigits = 6) {
  return onlyDigits(value).length >= minDigits;
}

export function toE164Phone(value, countryCode) {
  const phoneDigits = onlyDigits(value);
  const countryDigits = onlyDigits(countryCode) || '977';

  if (phoneDigits.startsWith(countryDigits)) {
    return `+${phoneDigits}`;
  }

  return `+${countryDigits}${phoneDigits}`;
}

export function toNepalE164Phone(value) {
  return toE164Phone(value, NEPAL_COUNTRY_CODE);
}
