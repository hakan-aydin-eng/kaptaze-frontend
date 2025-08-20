// KapTaze Cart Context - Sepet Yönetimi
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { message } from 'antd';

// Initial state
const initialState = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
  isLoading: false
};

// Action types
const CART_ACTIONS = {
  LOAD_CART: 'LOAD_CART',
  ADD_ITEM: 'ADD_ITEM',
  UPDATE_ITEM: 'UPDATE_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  CLEAR_CART: 'CLEAR_CART',
  SET_LOADING: 'SET_LOADING'
};

// Helper functions
const calculateTotals = (items) => {
  const totalItems = items.reduce((sum, item) => sum + item.adet, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.fiyat * item.adet), 0);
  return { totalItems, totalPrice };
};

const saveToLocalStorage = (items) => {
  try {
    localStorage.setItem('kaptaze_cart', JSON.stringify(items));
  } catch (error) {
    console.error('Sepet kaydetme hatası:', error);
  }
};

const loadFromLocalStorage = () => {
  try {
    const saved = localStorage.getItem('kaptaze_cart');
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Sepet yükleme hatası:', error);
    return [];
  }
};

// Reducer
const cartReducer = (state, action) => {
  let newItems;
  let totals;

  switch (action.type) {
    case CART_ACTIONS.LOAD_CART:
      totals = calculateTotals(action.payload);
      return {
        ...state,
        items: action.payload,
        ...totals,
        isLoading: false
      };

    case CART_ACTIONS.ADD_ITEM:
      const existingItemIndex = state.items.findIndex(
        item => item.id === action.payload.id
      );

      if (existingItemIndex >= 0) {
        // Mevcut item'ı güncelle
        newItems = [...state.items];
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          adet: newItems[existingItemIndex].adet + action.payload.adet
        };
      } else {
        // Yeni item ekle
        newItems = [...state.items, action.payload];
      }

      totals = calculateTotals(newItems);
      saveToLocalStorage(newItems);
      
      return {
        ...state,
        items: newItems,
        ...totals
      };

    case CART_ACTIONS.UPDATE_ITEM:
      newItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, adet: action.payload.adet }
          : item
      ).filter(item => item.adet > 0);

      totals = calculateTotals(newItems);
      saveToLocalStorage(newItems);
      
      return {
        ...state,
        items: newItems,
        ...totals
      };

    case CART_ACTIONS.REMOVE_ITEM:
      newItems = state.items.filter(item => item.id !== action.payload);
      totals = calculateTotals(newItems);
      saveToLocalStorage(newItems);
      
      return {
        ...state,
        items: newItems,
        ...totals
      };

    case CART_ACTIONS.CLEAR_CART:
      localStorage.removeItem('kaptaze_cart');
      return {
        ...state,
        items: [],
        totalItems: 0,
        totalPrice: 0
      };

    case CART_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };

    default:
      return state;
  }
};

// Context
const CartContext = createContext();

// Provider
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Local storage'dan sepeti yükle
  useEffect(() => {
    const savedCart = loadFromLocalStorage();
    dispatch({
      type: CART_ACTIONS.LOAD_CART,
      payload: savedCart
    });
  }, []);

  // Sepete ürün ekle
  const addToCart = (package_item, quantity = 1) => {
    try {
      const cartItem = {
        id: `${package_item._id}_${Date.now()}`, // Unique ID
        packageId: package_item._id,
        restoranId: package_item.restoranId,
        restoranAdi: package_item.restoranAdi,
        ad: package_item.ad,
        aciklama: package_item.aciklama,
        fiyat: package_item.indirimli_fiyat || package_item.fiyat,
        originalFiyat: package_item.fiyat,
        resimUrl: package_item.resimUrl,
        adet: quantity,
        kategori: package_item.kategori,
        sonTeslimSaati: package_item.son_teslim_saati,
        kisilik: package_item.kisilik,
        addedAt: new Date().toISOString()
      };

      // Stok kontrolü
      if (package_item.stok && package_item.stok < quantity) {
        message.error('Yeterli stok bulunmuyor');
        return false;
      }

      // Aynı restorandan mı kontrolü
      if (state.items.length > 0) {
        const firstRestaurant = state.items[0].restoranId;
        if (firstRestaurant !== package_item.restoranId) {
          message.warning('Sepetinizde başka restorandan ürün var. Önce sepeti temizleyin.');
          return false;
        }
      }

      dispatch({
        type: CART_ACTIONS.ADD_ITEM,
        payload: cartItem
      });

      message.success(`${package_item.ad} sepete eklendi`);
      return true;
    } catch (error) {
      console.error('Sepete ekleme hatası:', error);
      message.error('Ürün sepete eklenirken hata oluştu');
      return false;
    }
  };

  // Sepetteki ürün miktarını güncelle
  const updateCartItem = (itemId, newQuantity) => {
    if (newQuantity < 0) return;

    if (newQuantity === 0) {
      removeFromCart(itemId);
      return;
    }

    dispatch({
      type: CART_ACTIONS.UPDATE_ITEM,
      payload: { id: itemId, adet: newQuantity }
    });
  };

  // Sepetten ürün çıkar
  const removeFromCart = (itemId) => {
    const item = state.items.find(item => item.id === itemId);
    
    dispatch({
      type: CART_ACTIONS.REMOVE_ITEM,
      payload: itemId
    });

    if (item) {
      message.success(`${item.ad} sepetten çıkarıldı`);
    }
  };

  // Sepeti temizle
  const clearCart = () => {
    dispatch({ type: CART_ACTIONS.CLEAR_CART });
    message.success('Sepet temizlendi');
  };

  // Sepetteki ürün sayısı
  const getItemQuantity = (packageId) => {
    return state.items
      .filter(item => item.packageId === packageId)
      .reduce((sum, item) => sum + item.adet, 0);
  };

  // Sepet doğrulaması
  const validateCart = () => {
    if (state.items.length === 0) {
      return { isValid: false, message: 'Sepetiniz boş' };
    }

    // Minimum sipariş tutarı kontrolü (örnek: 50 TL)
    const minimumAmount = 50;
    if (state.totalPrice < minimumAmount) {
      return { 
        isValid: false, 
        message: `Minimum sipariş tutarı ${minimumAmount} TL'dir` 
      };
    }

    // Teslim saati kontrolü
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    for (let item of state.items) {
      if (item.sonTeslimSaati) {
        const [hours, minutes] = item.sonTeslimSaati.split(':').map(Number);
        const itemDeadline = hours * 60 + minutes;
        
        if (currentTime > itemDeadline) {
          return {
            isValid: false,
            message: `${item.ad} için teslim saati geçmiş`
          };
        }
      }
    }

    return { isValid: true };
  };

  // Sepet özeti
  const getCartSummary = () => {
    const validation = validateCart();
    
    return {
      items: state.items,
      totalItems: state.totalItems,
      totalPrice: state.totalPrice,
      isValid: validation.isValid,
      validationMessage: validation.message,
      restaurant: state.items.length > 0 ? {
        id: state.items[0].restoranId,
        ad: state.items[0].restoranAdi
      } : null
    };
  };

  const value = {
    ...state,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getItemQuantity,
    validateCart,
    getCartSummary
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Hook
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;