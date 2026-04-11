import { createContext, useCallback, useContext, useMemo, useReducer } from 'react';
import { summarizeCart, updateCartItems } from '@repo/utils';

const CartContext = createContext(null);

const ACTIONS = {
  SET_NOTICE: 'SET_NOTICE',
  CLEAR_NOTICE: 'CLEAR_NOTICE',
  SET_ITEM_QUANTITY: 'SET_ITEM_QUANTITY',
  CLEAR_CART: 'CLEAR_CART',
};

const initialState = {
  restaurant: null,
  items: [],
  notice: '',
};

function reduceCart(state, action) {
  switch (action.type) {
    case ACTIONS.SET_NOTICE:
      return {
        ...state,
        notice: action.payload || '',
      };

    case ACTIONS.CLEAR_NOTICE:
      return {
        ...state,
        notice: '',
      };

    case ACTIONS.CLEAR_CART:
      return {
        ...initialState,
      };

    case ACTIONS.SET_ITEM_QUANTITY: {
      const { restaurant, item, quantity } = action.payload || {};

      if (!restaurant?.id || !item?.id) {
        return state;
      }

      if (quantity > 0 && state.restaurant?.id && state.restaurant.id !== restaurant.id) {
        return {
          ...state,
          notice: `Your cart already has items from ${state.restaurant.name}. Clear it before adding from ${restaurant.name}.`,
        };
      }

      const nextItems = updateCartItems(state.items, item, quantity);
      const nextRestaurant = nextItems.length
        ? {
          id: restaurant.id,
          name: restaurant.name,
          image_url: restaurant.image_url || '',
          address: restaurant.address || '',
        }
        : null;

      return {
        ...state,
        restaurant: nextRestaurant,
        items: nextItems,
        notice: '',
      };
    }

    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(reduceCart, initialState);

  const setItemQuantity = useCallback((restaurant, item, quantity) => {
    dispatch({
      type: ACTIONS.SET_ITEM_QUANTITY,
      payload: { restaurant, item, quantity },
    });
  }, []);

  const incrementItem = useCallback((restaurant, item) => {
    const currentQuantity = state.items.find((entry) => entry.id === item?.id)?.quantity || 0;
    setItemQuantity(restaurant, item, currentQuantity + 1);
  }, [setItemQuantity, state.items]);

  const decrementItem = useCallback((restaurant, item) => {
    const currentQuantity = state.items.find((entry) => entry.id === item?.id)?.quantity || 0;
    setItemQuantity(restaurant, item, Math.max(0, currentQuantity - 1));
  }, [setItemQuantity, state.items]);

  const removeItem = useCallback((restaurant, item) => {
    setItemQuantity(restaurant, item, 0);
  }, [setItemQuantity]);

  const clearCart = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_CART });
  }, []);

  const dismissNotice = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_NOTICE });
  }, []);

  const setNotice = useCallback((notice) => {
    dispatch({
      type: ACTIONS.SET_NOTICE,
      payload: notice,
    });
  }, []);

  const baseSummary = useMemo(
    () => summarizeCart(state.items, 0),
    [state.items],
  );

  const getSummary = useCallback(
    (deliveryFee = 0) => summarizeCart(state.items, deliveryFee),
    [state.items],
  );

  const value = useMemo(() => ({
    restaurant: state.restaurant,
    items: state.items,
    notice: state.notice,
    itemCount: baseSummary.itemCount,
    subtotal: baseSummary.subtotal,
    setItemQuantity,
    incrementItem,
    decrementItem,
    removeItem,
    clearCart,
    setNotice,
    dismissNotice,
    getSummary,
  }), [
    state,
    baseSummary,
    setItemQuantity,
    incrementItem,
    decrementItem,
    removeItem,
    clearCart,
    setNotice,
    dismissNotice,
    getSummary,
  ]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used inside a CartProvider');
  }

  return context;
}
