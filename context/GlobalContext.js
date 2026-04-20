"use client";
import { createContext, useContext, useState, useEffect } from 'react';

const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
  // 1. Tambahkan state untuk menyimpan item yang akan di-checkout
  const [checkoutItems, setCheckoutItems] = useState([]);
  const [globalSearch, setGlobalSearch] = useState("");
  

  // 2. Logic untuk menyimpan ke sessionStorage agar data tidak hilang saat refresh
  const updateCheckoutItems = (items) => {
    setCheckoutItems(items);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("pending_checkout", JSON.stringify(items));
    }
  };

  // 3. Ambil data dari sessionStorage saat pertama kali load (opsional tapi disarankan)
  useEffect(() => {
    const savedItems = sessionStorage.getItem("pending_checkout");
    if (savedItems && checkoutItems.length === 0) {
      setCheckoutItems(JSON.parse(savedItems));
    }
  }, []);

  const formatCurrency = (val) => {
    if (!val) return "Rp 0";
    const cleanNumber = Math.floor(parseFloat(String(val)));
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(cleanNumber || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
    loading: false
  });

  // Fungsi untuk memanggil dialog dari mana saja
  const confirm = ({ title, description, onConfirm }) => {
    setConfirmDialog({
      isOpen: true,
      title,
      description,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, loading: true }));
        await onConfirm();
        setConfirmDialog(prev => ({ ...prev, loading: false, isOpen: false }));
      },
      loading: false
    });
  };

  const closeConfirm = () => setConfirmDialog(prev => ({ ...prev, isOpen: false }));

  return (
    <GlobalContext.Provider value={{ 
      formatCurrency, 
      formatDate, 
      checkoutItems, // Kirim state-nya
      confirm, 
      confirmDialog, 
      closeConfirm,
      setCheckoutItems: updateCheckoutItems // Kirim fungsi update-nya
      , globalSearch, setGlobalSearch
    }}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobal = () => useContext(GlobalContext);