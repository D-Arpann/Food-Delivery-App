function toNumber(value, fallback = 0) {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : fallback;
}

export function clampQuantity(quantity) {
  const nextQuantity = Math.floor(toNumber(quantity, 0));
  return Math.max(0, nextQuantity);
}

export function getCartLineTotal(item = {}) {
  const price = toNumber(item.price, 0);
  const quantity = clampQuantity(item.quantity || 0);
  return price * quantity;
}

export function getCartSubtotal(items = []) {
  return items.reduce((sum, item) => sum + getCartLineTotal(item), 0);
}

export function getCartItemCount(items = []) {
  return items.reduce((sum, item) => sum + clampQuantity(item.quantity || 0), 0);
}

export function summarizeCart(items = [], deliveryFee = 0) {
  const subtotal = getCartSubtotal(items);
  const safeDeliveryFee = toNumber(deliveryFee, 0);

  return {
    itemCount: getCartItemCount(items),
    subtotal,
    deliveryFee: safeDeliveryFee,
    total: subtotal + safeDeliveryFee,
  };
}

export function normalizeDeliveryAddress(value, fallback = 'Naxal, Kathmandu') {
  const nextValue = String(value || '').trim();
  return nextValue || fallback;
}

export function isValidDeliveryAddress(value, minLength = 6) {
  const nextValue = String(value || '').trim();
  return nextValue.length >= minLength;
}

export function updateCartItems(items = [], nextItem, nextQuantity) {
  const quantity = clampQuantity(nextQuantity);
  const itemId = nextItem?.id;

  if (!itemId) {
    return items;
  }

  const existingIndex = items.findIndex((item) => item.id === itemId);

  if (existingIndex < 0) {
    if (!quantity) {
      return items;
    }

    return [
      ...items,
      {
        ...nextItem,
        quantity,
      },
    ];
  }

  if (!quantity) {
    return items.filter((item) => item.id !== itemId);
  }

  return items.map((item) => (
    item.id === itemId
      ? {
        ...item,
        ...nextItem,
        quantity,
      }
      : item
  ));
}
