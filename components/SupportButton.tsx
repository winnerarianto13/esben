"use client";

import { useState } from "react";
import axiosInstance from "@/lib/axios";
import { Loader2, X, AlertCircle } from "lucide-react";

const SupportButton = () => {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false); // State untuk Modal
  const message = "Halo Esbeg Store, saya ingin bertanya tentang...";

  const handleSupportClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      const res = await axiosInstance.get("/settings");
      
      // cari data yang variable key nya adalah store_phone lalu ambil value nya
      const phoneNumber = res.data.data.find((item: any) => item.key === "store_phone")?.value;

      if (phoneNumber) {
        const cleanNumber = phoneNumber.replace(/\D/g, "");
        const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      } else {
        // Jika data kosong di database
        setShowModal(true);
      }
    } catch (error) {
      // Jika server error atau koneksi gagal
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleSupportClick}
        disabled={loading}
        className="fixed right-6 md:bottom-10 bottom-6 md:right-10 z-50 group flex items-center flex-row-reverse outline-none"
      >
        {/* Tombol WhatsApp */}
        <div className="relative flex items-center justify-center">
          {!loading && (
            <span className="absolute h-full w-full animate-ping rounded-full bg-green-500 opacity-20"></span>
          )}
          <div className="relative bg-[#25D366]/10 hover:bg-[#20ba56] text-white p-4 rounded-full shadow-lg transition-transform duration-200 hover:scale-110 active:scale-95 flex items-center justify-center">
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin text-[#25D366]" />
            ) : (
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-[#25D366] group-hover:fill-white transition-colors" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
            )}
          </div>
        </div>
        <span className="hidden md:block overflow-hidden max-w-0 group-hover:max-w-xs transition-all duration-300 bg-neutral-800 text-white text-[10px] font-bold uppercase tracking-[0.2em] px-0 group-hover:px-4 py-2 rounded-full mr-2 opacity-0 group-hover:opacity-100 shadow-xl">
          Customer Service
        </span>
      </button>

      {/* --- MODAL NOTIFIKASI --- */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div 
            className="bg-white dark:bg-neutral-900 w-full max-w-sm rounded-3xl p-8 shadow-2xl border dark:border-neutral-800 text-center relative animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex justify-center mb-6">
              <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-full">
                <AlertCircle className="w-8 h-8 text-amber-500" />
              </div>
            </div>

            <h3 className="text-xl font-bold mb-2 dark:text-white uppercase tracking-tight">Layanan Offline</h3>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed mb-8">
              Mohon maaf, saat ini layanan Customer Service kami sedang tidak tersedia atau dalam pemeliharaan. Silakan coba kembali nanti.
            </p>

            <button 
              onClick={() => setShowModal(false)}
              className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-2xl font-bold text-sm uppercase tracking-widest active:scale-95 transition-transform"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SupportButton;