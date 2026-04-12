import { normalizeDeliveryAddress } from './cart.js';

export function normalizeSavedAddresses(rawAddresses = [], fallbackAddress = '') {
  const normalized = (rawAddresses || [])
    .map((entry, index) => {
      const address = normalizeDeliveryAddress(entry?.address || entry?.value || '', '');
      if (!address) {
        return null;
      }

      const fallbackId = `address-${index + 1}`;
      const nextId = String(entry?.id || fallbackId).trim() || fallbackId;
      const nextLabel = String(entry?.label || `Address ${index + 1}`).trim() || `Address ${index + 1}`;

      return {
        id: nextId,
        label: nextLabel,
        address,
      };
    })
    .filter(Boolean);

  if (normalized.length) {
    return normalized;
  }

  const fallback = normalizeDeliveryAddress(fallbackAddress, '');
  if (!fallback) {
    return [];
  }

  return [
    {
      id: 'address-home',
      label: 'Home',
      address: fallback,
    },
  ];
}

export function resolveDefaultSavedAddressId(addresses = [], preferredId = '') {
  const normalizedId = String(preferredId || '').trim();
  if (normalizedId && addresses.some((entry) => entry.id === normalizedId)) {
    return normalizedId;
  }

  return addresses[0]?.id || '';
}

export function getDefaultSavedAddress(addresses = [], preferredId = '', fallbackAddress = '') {
  const resolvedId = resolveDefaultSavedAddressId(addresses, preferredId);
  return (
    addresses.find((entry) => entry.id === resolvedId)?.address ||
    normalizeDeliveryAddress(fallbackAddress, '')
  );
}
