"use client";
import { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import axiosInstance from '@/lib/axios';
import { useRouter } from 'next/navigation';
import { useCartStore } from "@/store/useCartStore";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { fetchCartLength } = useCartStore();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = Cookies.get('token');

    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // Fungsi helper agar tidak mengulang kode simpan data
  const handleAuthSuccess = (token, userData, callbackUrl) => {
    Cookies.set('token', token, { expires: 7 });
    localStorage.setItem('user', JSON.stringify({
      username: userData.username || userData.name // Google biasanya mengirim 'name'
    }));
    setUser(userData);
    fetchCartLength();
    router.push(callbackUrl || '/');
  };

  const login = async (credentials, callbackUrl) => {
    // JIKA LOGIN VIA GOOGLE (Data sudah ada)
    if (credentials.type === 'social') {
      handleAuthSuccess(credentials.data.token, credentials.data.user, callbackUrl);
      return;
    }

    // JIKA LOGIN MANUAL (Email & Password)
    const params = {
      login: credentials.email,
      password: credentials.password
    };

    const res = await axiosInstance.post('/login', params);
    handleAuthSuccess(res.data.token, res.data.user, callbackUrl);
  };

  //register
  const register = async (credentials) => {
    const res = await axiosInstance.post('/register', credentials);
    // HAPUS handleAuthSuccess dari sini agar tidak redirect otomatis
    return res.data; // Kembalikan data agar bisa dibaca di component
  };

  const verifyOtp = async (email, otp, callbackUrl) => {
    const res = await axiosInstance.post('/auth/verify-otp', { email, otp });
    handleAuthSuccess(res.data.token, res.data.user, callbackUrl);
    return res.data;
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const logout = () => {
    Cookies.remove('token');
    localStorage.removeItem('user');
    setUser(null);
    fetchCartLength();
    router.push('/login');
  };

  return (
  <AuthContext.Provider value={{ user, register, login, logout, loading, updateUser, verifyOtp }}>
    {children}
  </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);