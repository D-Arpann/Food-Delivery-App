import { TABLES, ORDER_STATUS } from '@repo/utils/constants.js';

export async function fetchActiveMenu(client, foodPlaceId) {
  try {
    const { data, error } = await client
      .from(TABLES.MENU_ITEMS)
      .select('*')
      .eq('food_place_id', foodPlaceId)
      .eq('is_available', true);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching active menu:', error);
    return { data: null, error };
  }
}

export async function createOrder(client, orderPayload) {
  try {
    const { data, error } = await client
      .from(TABLES.ORDERS)
      .insert([orderPayload])
      .select('id')
      .single();

    if (error) throw error;
    return { data: data.id, error: null };
  } catch (error) {
    console.error('Error creating order:', error);
    return { data: null, error };
  }
}

export async function updateOrderStatus(client, orderId, newStatus) {
  try {
    const { data, error } = await client
      .from(TABLES.ORDERS)
      .update({ status: newStatus })
      .eq('id', orderId)
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating order status:', error);
    return { data: null, error };
  }
}
