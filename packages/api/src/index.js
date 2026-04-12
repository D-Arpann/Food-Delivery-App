export { createAppClient } from './client.js'
export {
  sendPhoneOtp,
  verifyPhoneOtp,
  upsertCurrentUserProfile,
  verifyOtpAndSyncProfile,
  completeSignupProfile,
  fetchCustomerSettings,
  updateCustomerSettings,
  logout,
} from './auth.js'
export {
  fetchActiveRestaurants,
  fetchActiveMenu,
  fetchRestaurantFeed,
  fetchCustomerOrders,
  createOrder,
  createCheckoutOrder,
  updateOrderStatus,
} from './queries.js'
