"use client";

import { useState } from "react";
import { Truck, CheckCircle2, Circle, Clock, Info } from "lucide-react";
import { useGlobal } from "@/context/GlobalContext";

export interface ShippingService {
  courier_service_code: string; // Ambil dari API
  courier_service_name: string; // Ambil dari API
  courier_name: string;         // Ambil dari API
  price: number;                // Ambil dari API
  duration: string;             // Ambil dari API (e.g., "1 - 2 days")
  description: string;
  company: string;
}

interface ShippingSectionProps {
  data: ShippingService[];
  onSelect: (service: ShippingService | null) => void;
  isLoading?: boolean;
}

export default function ShippingSection({ data, onSelect, isLoading }: ShippingSectionProps) {
  // Gunakan kombinasi nama kurir dan kode servis agar ID unik
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const { formatCurrency } = useGlobal();

  const handleSelect = (service: ShippingService) => {
    const key = `${service.courier_name}-${service.courier_service_code}`;
    const isSelected = selectedKey === key;
    
    setSelectedKey(isSelected ? null : key);
    onSelect(isSelected ? null : service);
  };

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Truck className="w-5 h-5 text-neutral-500" />
        <h2 className="text-lg font-bold dark:text-white">Metode Pengiriman</h2>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-8 space-y-2">
          <div className="w-6 h-6 border-2 border-neutral-300 border-t-black dark:border-neutral-700 dark:border-t-white rounded-full animate-spin" />
          <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold text-center">Menghitung Ongkir...</p>
        </div>
      ) : data && data.length > 0 ? (
        <div className="space-y-3">
          {data.map((service) => {
            const key = `${service.courier_name}-${service.courier_service_code}`;
            const isSelected = selectedKey === key;

            return (
              <div
                key={key}
                onClick={() => handleSelect(service)}
                className={`
                  relative cursor-pointer flex items-center gap-4 p-4 rounded-2xl border-2 transition-all
                  ${isSelected 
                    ? "border-black dark:border-white bg-white dark:bg-neutral-800 shadow-md" 
                    : "border-transparent bg-white/50 dark:bg-neutral-800/40 hover:border-neutral-300 dark:hover:border-neutral-700"}
                `}
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-sm dark:text-white uppercase italic tracking-tighter">
                      {service.courier_name} <span className="text-neutral-500 dark:text-neutral-400 font-medium">({service.courier_service_name})</span>
                    </h3>
                    <span className="font-black text-sm dark:text-white">
                      {formatCurrency(service.price)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-[10px] md:text-xs text-neutral-500 dark:text-neutral-400">
                    <Clock size={12} />
                    <span className="font-medium">Estimasi: {service.duration}</span>
                  </div>
                </div>

                {isSelected ? (
                  <CheckCircle2 className="w-5 h-5 text-black dark:text-white" />
                ) : (
                  <Circle className="w-5 h-5 text-neutral-300 dark:text-neutral-700" />
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-6 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl text-center">
          <Info className="w-5 h-5 text-neutral-400 mx-auto mb-2" />
          <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-tight">
            Pilih alamat terlebih dahulu untuk melihat ongkir
          </p>
        </div>
      )}
    </div>
  );
}