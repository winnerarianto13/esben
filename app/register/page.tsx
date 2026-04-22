"use client";

import { useState, Suspense, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams, useRouter } from "next/navigation";
import { useGoogleLogin } from '@react-oauth/google';
import axiosInstance from '@/lib/axios';
import { Loader2, ArrowLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

/**
 * Daftar kode negara
 */
const countryCodes = [
  { code: '+62', label: 'ID' },
  { code: '+1', label: 'US' },
  { code: '+60', label: 'MY' },
  { code: '+65', label: 'SG' },
];

const RegisterPage = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <Loader2 className="w-10 h-10 animate-spin text-neutral-400" />
      </div>
    }>
      <RegisterFormContent />
    </Suspense>
  );
};

const RegisterFormContent = () => {
  const [step, setStep] = useState<'register' | 'otp'>('register'); // State untuk pindah view
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+62');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']); // 6 kotak kosong
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [resendTimer, setResendTimer] = useState(0); // Dalam satuan detik
  const [isResendingOtp, setIsResendingOtp] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, login } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  // STEP 1: HANDLE REGISTER (Memicu OTP)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const fullPhone = `${countryCode}${phoneNumber.replace(/^0+/, '')}`;

    try {
      // Asumsi backend mengirim OTP setelah hit endpoint ini
      const res = await register({ 
        full_name: name,
        username: username,
        email: email,
        phone: fullPhone,
        password: password
       });
      
      setSuccess(res.message);
       
      // Jika berhasil, pindah ke tampilan OTP
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mendaftar. Silakan cek data kembali.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (isNaN(Number(value))) return; // Hanya terima angka
  
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1); // Ambil karakter terakhir
    setOtp(newOtp);
  
    // Pindah ke kotak berikutnya jika ada isinya
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    // Pindah ke kotak sebelumnya jika tombol Backspace ditekan dan kotak kosong
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };
  
  // Gabungkan array jadi string saat submit
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join('');
    if (otpString.length < 6) return setError('Masukkan kode lengkap');
    setError('');
    setIsSubmitting(true);
    try {
      // Kirim OTP ke backend untuk verifikasi akhir
      const res = await axiosInstance.post('/verify-otp ', { email: email,otp_code: otpString });
      
      // Jika valid, panggil fungsi login dari context untuk menyimpan session
      await login({ type: 'social', data: res.data }, callbackUrl);
      router.push(callbackUrl);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Kode OTP salah atau kedaluwarsa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  //fitur resend
  const handleResendOtp = async () => {
    if (resendTimer > 0) return; // Cegah klik jika timer masih jalan
  
    setError('');
    setIsResendingOtp(true);
    try {
      const res = await axiosInstance.post('/resend-otp', { email: email });
      toast.success("OTP Berhasil dikirim ulang", { position: "top-center", className: "mt-15" });

      // Setting hitung mundur (misal 60 detik agar tidak spam)
      // Jika ingin 10 menit, ganti menjadi 600
      setResendTimer(60); 
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengirim ulang kode.');
    } finally {
      setIsResendingOtp(false);
    }
  };

  // GOOGLE LOGIN (Tetap langsung karena biasanya tidak butuh OTP manual lagi)
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsSubmitting(true);
      setError('');
      try {
        const res = await axiosInstance.post('/auth/google', {
          token: tokenResponse.access_token,
        });
        await login({ type: 'social', data: res.data }, callbackUrl);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Gagal autentikasi Google.');
      } finally {
        setIsSubmitting(false);
      }
    },
    onError: () => setError('Registrasi Google dibatalkan.')
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);
  
  // Fungsi helper untuk mengubah detik ke format MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="py-20 bg-white dark:bg-black min-h-screen flex flex-col items-center justify-center px-4 font-sans">
      
      <div className="mb-12 text-center">
        <h1 className="text-2xl font-extrabold tracking-tighter uppercase dark:text-white">
          ESBEG <span className="font-light text-gray-400 dark:text-neutral-600">Store</span>
        </h1>
      </div>

      <div className="w-full max-w-125 bg-neutral-50 border dark:bg-neutral-900 p-8 md:p-12 rounded-3xl dark:border-neutral-800 shadow-sm">
        
        {step === 'register' ? (
          /* ================= VIEW REGISTER ================= */
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Daftar Akun</h2>
              <p className="text-gray-500 dark:text-neutral-400 text-sm mt-1">Lengkapi data dirimu untuk mulai belanja.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs rounded-xl border border-red-100 dark:border-red-900/50 font-medium font-sans">
                {error}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleRegisterSubmit}>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest mb-2">Full Name</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-neutral-200 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-800 rounded-xl dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
                  value={name} onChange={(e) => setName(e.target.value)} placeholder='Nama Lengkap' required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest mb-2">Username</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-neutral-200 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-800 rounded-xl dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-sm"
                  value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))} placeholder='username' required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest mb-2">Email Address</label>
                <input 
                  type="email" 
                  className="w-full px-4 py-3 bg-neutral-200 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-800 rounded-xl dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-sm"
                  value={email} onChange={(e) => setEmail(e.target.value)} placeholder='your@email.com' required
                />
              </div>

              <div>
                {/* Label tetap di luar grid agar tidak merusak alignment horizontal */}
                <Label className="text-[10px] font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest mb-2 block">
                  Phone Number
                </Label>
                
                <div className="flex flex-row items-center gap-2 w-full">
                  {/* Select Kode Negara */}
                  <Select
                    value={countryCode}
                    onValueChange={(value) => setCountryCode(value)}
                  >
                    <SelectTrigger 
                      className="bg-neutral-200 dark:bg-neutral-800 border-none rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white font-bold text-xs flex items-center justify-center shadow-none ring-offset-0 focus:ring-offset-0"
                      style={{ width: '90px', height: '50px' }}
                    >
                      <SelectValue placeholder="Code" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 rounded-xl">
                      {countryCodes.map((c) => (
                        <SelectItem key={c.code} value={c.code} className="cursor-pointer">
                          {c.label} {c.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Input Nomor Telepon */}
                  <Input
                    type="tel"
                    placeholder="8123456789"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                    className="flex-1 h-12 bg-neutral-200 dark:bg-neutral-800 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white text-sm shadow-none ring-offset-0 focus-visible:ring-offset-0 py-0" 
                    /* py-0 ditambahkan untuk memastikan padding tidak merusak height */
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest mb-2">Password</label>
                <input 
                  type="password" 
                  className="w-full px-4 py-3 bg-neutral-200 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-800 rounded-xl dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-sm"
                  value={password} onChange={(e) => setPassword(e.target.value)} placeholder='••••••••' required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest mb-2">Password</label>
                <input 
                  type="password" 
                  className="w-full px-4 py-3 bg-neutral-200 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-800 rounded-xl dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-sm"
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder='••••••••' required
                />
                <span className='text-xs text-red-500'>{password !== confirmPassword && 'Password tidak cocok'}</span>
              </div>

              <button 
                type="submit" disabled={isSubmitting || password !== confirmPassword || password.length < 6}
                className="w-full bg-black dark:bg-white text-white dark:text-black text-sm font-bold py-4 rounded-full mt-4 flex justify-center items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSubmitting ? 'Mengirim OTP...' : 'Daftar Sekarang'}
              </button>
            </form>

            <div className="relative my-10 flex items-center">
              <div className="grow border-t border-neutral-200 dark:border-neutral-800"></div>
              <span className="shrink mx-4 text-[10px] uppercase tracking-widest text-neutral-400 font-bold">Atau</span>
              <div className="grow border-t border-neutral-200 dark:border-neutral-800"></div>
            </div>

            <button 
              type="button" onClick={() => handleGoogleLogin()} disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-black dark:text-white text-sm font-bold py-4 rounded-full hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-all shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </button>

            <div className="mt-8 text-center text-sm text-neutral-500">
              Sudah punya akun? <Link href="/login" className="text-black dark:text-white font-bold hover:underline">Masuk</Link>
            </div>
          </>
        ) : (
          /* ================= VIEW OTP ================= */
          <>
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <button 
                onClick={() => setStep('register')} 
                className="flex items-center gap-2 text-xs font-bold text-neutral-400 hover:text-black dark:hover:text-white mb-6 transition-colors"
              >
                <ArrowLeft className="w-3 h-3" /> Kembali ke Pendaftaran
              </button>

              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Verifikasi Kode</h2>
                <p className="text-gray-500 dark:text-neutral-400 text-sm mt-1">
                  Kami mengirim kode ke <span className="text-black dark:text-white font-medium">{email}</span>
                </p>
                {success && (
                  <div className="mt-5 mb-6 p-4 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 text-xs rounded-xl border border-green-100 dark:border-green-900/50 font-medium font-sans">
                    {success}
                  </div>
                )}
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs rounded-xl border border-red-100 dark:border-red-900/50 font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleVerifyOtp}>
                {/* Grid Kotak OTP */}
                <div className="flex justify-between gap-2 mb-10">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      type="text"
                      maxLength={1}
                      ref={(el) => {
                        if (inputRefs.current) {
                          inputRefs.current[index] = el;
                        }
                      }}
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target.value, index)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      className="w-full h-14 md:h-16 text-center text-2xl font-bold bg-neutral-200 dark:bg-neutral-800 border-2 border-transparent focus:border-black dark:focus:border-white rounded-2xl dark:text-white focus:outline-none transition-all"
                    />
                  ))}
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting || otp.some(d => d === '')}
                  className="w-full bg-black dark:bg-white text-white dark:text-black text-sm font-bold py-4 rounded-full flex justify-center items-center gap-2 transition-all active:scale-95 disabled:opacity-30"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSubmitting ? 'Memverifikasi...' : 'Verifikasi Akun'}
                </button>
              </form>

              <div className="mt-8 text-center text-sm text-neutral-500">
                Tidak menerima kode?{' '}
                {resendTimer > 0 ? (
                  <span className="text-black dark:text-white font-bold">
                    Kirim ulang dalam {formatTime(resendTimer)}
                  </span>
                ) : (
                  <button 
                    type="button" 
                    className="text-black dark:text-white font-bold hover:underline disabled:opacity-50" 
                    onClick={handleResendOtp}
                    disabled={isResendingOtp}
                  >
                    Kirim Ulang
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;