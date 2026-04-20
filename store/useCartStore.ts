import { create } from 'zustand';
import axiosInstance from '../lib/axios';
import Cookies from 'js-cookie';

interface CartState {
  cartLength: number;
  lastAddedTimestamp: number | null;
  justAddedIds: number[]; // Menyimpan ID item yang baru saja ditambahkan
  fetchCartLength: () => Promise<void>;
  refreshCart: (newIds?: number[], shouldAnimate?: boolean) => Promise<void>; // Menerima array ID baru opsional
  clearJustAdded: () => void; // Reset ID setelah dipakai di halaman Cart
}

export const useCartStore = create<CartState>((set, get) => ({
  cartLength: 0,
  lastAddedTimestamp: null,
  justAddedIds: [],

  // DIGUNAKAN SAAT PAGE LOAD / REFRESH (TANPA ANIMASI)
  fetchCartLength: async () => {
    const token = Cookies.get('token');
    
    if (!token) {
      set({ cartLength: 0, lastAddedTimestamp: null, justAddedIds: [] });
      return;
    }

    try {
      const res = await axiosInstance.get('/cart');
      set({ cartLength: res.data.items.length });
    } catch (err) { 
      console.error("Cart error:", err);
      set({ cartLength: 0, lastAddedTimestamp: null });
    }
  },

  refreshCart: async (newIds = [], shouldAnimate = true) => { // Default true agar pemanggilan standar tetap ada animasi
    const token = Cookies.get('token');
    if (!token) return;
  
    try {
      const res = await axiosInstance.get('/cart');
      const newLength = res.data.items.length;
  
      set({ 
        cartLength: newLength,
        // Jika shouldAnimate false, kita jangan update timestamp pemicu animasi
        lastAddedTimestamp: shouldAnimate ? Date.now() : get().lastAddedTimestamp,
        justAddedIds: newIds 
      });
    } catch (err) {
      console.error("Refresh error:", err);
    }
  },

  // Fungsi untuk membersihkan "titipan" ID
  clearJustAdded: () => set({ justAddedIds: [] })
}));