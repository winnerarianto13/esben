"use client";

import { useGlobal } from "@/context/GlobalContext";
import { Button } from "@/components/ui/button";
import { ChevronLeft, MapPin, Truck, Loader2, Edit } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import axiosInstance from "@/lib/axios";
import VoucherSection, { Voucher } from "@/components/Voucher";
import { toast } from "sonner";
import ShippingSection from "@/components/ShippingSection";
import axios from "axios";

interface Address {
  address_id: string;
  address_line: string;
  label:string;
  is_default: boolean;
  province: string;
  district: string;
  city: string;
  subdistrict: string;
  receiver_name:string;
  postal_code: string;
  phone: string;
  area_id: string;
}

interface ShippingService {
  courier_service_code: string;
  courier_service_name: string;
  courier_name: string;
  price: number;
  duration: string;
  description: string;
  company : string;
}
export default function CheckoutPage() {
  const { checkoutItems, formatCurrency } = useGlobal();
  const router = useRouter();
  
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [loadingVouchers, setLoadingVouchers] = useState(true);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [isLoadAddress, setIsLoadAddress] = useState(false);
  const [shippingMethods, setShippingMethods] = useState<ShippingService[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingService | null>(null);
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);
  // State untuk hasil perhitungan dari Backend
  const [calculation, setCalculation] = useState({
    discount_amount: 0,
    total_bill: 0
  });
  const [isValidating, setIsValidating] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_STORAGE_URL;

  // 1. Hitung Subtotal Awal (Client Side)
  const subtotal = useMemo(() => {
    return checkoutItems.reduce((acc: number, item: any) => acc + item.variant.price * item.qty, 0);
  }, [checkoutItems]);

  // 2. Fetch Daftar Voucher saat halaman dimuat
  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        setLoadingVouchers(true);
        const response = await axiosInstance.get('/vouchers');
        setVouchers(Array.isArray(response.data) ? response.data : response.data.data || []);
      } catch (error) {
        console.error("Error fetching vouchers:", error);
      } finally {
        setLoadingVouchers(false);
      }
    };

    if (checkoutItems.length > 0) fetchVouchers();
    else router.push("/cart");
  }, [checkoutItems, router]);

  // 3. Validasi Voucher ke Backend saat Voucher dipilih
  useEffect(() => {
    const validateVoucher = async () => {
      // JANGAN memanggil setVoucherError(null) di sini secara membabi buta
      if (!selectedVoucher) {
        setCalculation({ discount_amount: 0, total_bill: subtotal });
        return;
      }

      try {
        setIsValidating(true);
        // Hapus error hanya saat proses validasi BARU dimulai
        setVoucherError(null); 
        
        const response = await axiosInstance.post('/vouchers/validate', {
          subtotal: subtotal,
          code: selectedVoucher.code
        });
        
        setCalculation({
          discount_amount: parseFloat(response.data.data.discount_amount),
          total_bill: parseFloat(response.data.data.grand_total_estimation)
        });
      } catch (error: any) {
        const msg = error.response?.data?.message || "Voucher tidak dapat digunakan.";
        
        // 1. Set pesan error dulu
        setVoucherError(msg);
        // 2. Baru deselect vouchernya
        setSelectedVoucher(null);
        // 3. Reset kalkulasi
        setCalculation({ discount_amount: 0, total_bill: subtotal });
      } finally {
        setIsValidating(false);
      }
    };

    validateVoucher();
  }, [selectedVoucher, subtotal]);

  const getAddreses = async () => {
    try {
      setIsLoadAddress(true);
      const response = await axiosInstance.get('/addresses');
      
      const allAddresses = response.data.data; 
      
      const defaultAddress = allAddresses.find((addr: Address) => addr.is_default);
      
      if (defaultAddress) {
        setSelectedAddress(defaultAddress);
      } else if (allAddresses.length > 0) {
        setSelectedAddress(allAddresses[0]);
      }
    } catch (error) {
      console.error("Gagal mengambil alamat:", error);
    } finally {
      setIsLoadAddress(false);
    }
  };
  

  const handleCheckout = async () => {
    try {
      const checkoutItemsIds = checkoutItems.map((item: any) => item.cart_item_id);

      const response = await axiosInstance.post('/orders', 
        {
          cart_item_ids: checkoutItemsIds,
          address_id: selectedAddress?.address_id,
          voucher_code: selectedVoucher?.code,
          courier_company : selectedShipping?.company,
          courier_service : selectedShipping?.courier_service_code,
          shipping_cost : selectedShipping?.price
        }
      );

      const orderOid = response.data.data.order_oid;
      router.push(`/orders/${orderOid}/invoice`);
      
      
      // router.push(`/orders/${response.data.data.id}`);
    } catch (error: any) {
      console.error("Gagal membuat order:", error.response);
      toast.error(error.response.data.message, { position: "top-center", className: "mt-15" });
    }
  };

  const getShippingCost = async () => {
    if (!selectedAddress?.address_id) return;
  
    try {
      setIsLoadingShipping(true);
      const response = await axiosInstance.post('/shipping/cost', {
        address_id: selectedAddress.address_id,
        area_id: selectedAddress.area_id 
      });
      
      // Akses data sesuai struktur JSON yang kamu berikan
      const pricingData = response.data?.pricing || [];
      
      setShippingMethods(pricingData);
      
      // Reset pilihan jika alamat berubah
      setSelectedShipping(null); 
    } catch (error: any) {
      console.error("Error fetching shipping cost:", error.response);
      setShippingMethods([]);
    } finally {
      setIsLoadingShipping(false);
    }
  };

  // const getShippingCost = async () => {
  //   if (!selectedAddress?.address_id) return;
  
  //   try {
  //     setIsLoadingShipping(true);
  //     const response = await axios.get('/data/shipping.json'); 
      
  //     const pricingData = response.data?.data?.pricing || [];
  //     setShippingMethods(pricingData);
  //   } catch (error) {
  //     console.error(error);
  //   } finally {
  //     setIsLoadingShipping(false);
  //   }
  // };

  useEffect(() => {
    getAddreses();
  }, []);

  useEffect(() => {
    // Hanya panggil jika selectedAddress benar-benar ada isinya
    if (selectedAddress) {
      getShippingCost();
    }
  }, [selectedAddress]);

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="container mx-auto py-12 px-6">
        <Link href="/cart" className="flex items-center gap-2 text-neutral-500 mb-8 w-fit">
          <ChevronLeft className="w-4 h-4" /> Kembali ke Keranjang
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Bagian Kiri */}
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl">
              <div className="flex items-center gap-2 mb-4 justify-between">
                <div className="flex flex-row items-center gap-2">
                  <MapPin className="w-5 h-5 text-neutral-500" />
                  <h2 className="text-xl font-bold dark:text-white">Alamat Pengiriman</h2>
                </div>
                <div>
                  <Link href="/profile" className="flex items-center gap-2 text-neutral-500">
                    <Edit className="w-4 h-4" />
                    Ubah
                  </Link>
                </div>
              </div>
              {isLoadAddress ? (
                <div className="flex items-center gap-2 p-4">
                  <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
                  <p className="text-sm text-neutral-500">Memuat alamat...</p>
                </div>
              ) : selectedAddress ? (
                <div className="p-4 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                  <div className="flex flex-row items-center gap-2 mb-1">
                    <p className="font-bold dark:text-white text-sm">{selectedAddress.label}</p>
                    {selectedAddress.is_default && (
                      <span className="text-[10px] bg-neutral-100 dark:bg-neutral-700 px-2 py-0.5 rounded text-neutral-500">Default</span>
                    )}
                  </div>
                  <div className="flex flex-row items-center gap-2 mb-1">
                    <p className=" dark:text-white text-xs">To : {selectedAddress.receiver_name}</p>
                    <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600" />   
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                      {selectedAddress.phone}
                    </p>
                  </div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {selectedAddress.address_line}
                  </p>
                </div>
              ) : (
                <div className="p-4 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl text-center">
                  <p className="text-sm text-neutral-500 mb-2">Belum ada alamat pengiriman</p>
                  <Link href={'/profile'}>
                    <Button variant="outline" size="sm" className="rounded-full">
                      Tambah Alamat
                    </Button>
                  </Link>

                </div>
              )}
            </section>

            <section className="bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl">
              <div className="flex items-center gap-2 mb-6">
                <Truck className="w-5 h-5 text-neutral-500" />
                <h2 className="text-xl font-bold dark:text-white">Pesanan</h2>
              </div>
              <div className="space-y-4">
                {checkoutItems.map((item: any) => (
                  <div key={item.cart_item_id} className="flex gap-4 py-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                    <img 
                      src={`${baseUrl}${item.variant.product.primary_image.image_url}`} 
                      className="w-20 h-24 object-cover rounded-xl border dark:border-neutral-700" 
                      alt={item.variant.product.name} 
                    />
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-sm dark:text-white">{item.variant.product.name}</h3>
                        <p className="text-xs text-neutral-500">{item.variant.color} • {item.variant.size}</p>
                      </div>
                      <div className="flex justify-between items-end">
                        <p className="text-sm dark:text-neutral-300">{item.qty}x</p>
                        <p className="font-bold dark:text-white">{formatCurrency(item.variant.price * item.qty)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Bagian Kanan */}
          <div className="lg:col-span-1 space-y-6">
            {loadingVouchers ? (
              <div className="flex flex-col items-center justify-center p-12 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-3xl">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-400 mb-2" />
                <p className="text-xs text-neutral-500">Memuat voucher...</p>
              </div>
            ) : (
              // Di dalam return VoucherSection (CheckoutPage.tsx)
              <VoucherSection 
                data={vouchers} 
                onSelect={(v) => {
                  // Hapus error saat user memilih voucher lain atau klik ulang
                  if(v !== selectedVoucher) setVoucherError(null); 
                  setSelectedVoucher(v);
                }} 
                errorMessage={voucherError}
              />
            )}
            <ShippingSection 
              data={shippingMethods}
              isLoading={isLoadingShipping}
              onSelect={(s) => setSelectedShipping(s)}
            />

            <div className="bg-neutral-50 dark:bg-neutral-900 border dark:border-neutral-800 rounded-3xl p-8 sticky top-24">
              <h2 className="text-xl font-bold mb-6 dark:text-white">Ringkasan</h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Subtotal</span>
                  <span className="dark:text-white">{formatCurrency(subtotal)}</span>
                </div>
                
                {/* TAMPILKAN DISKON */}
                {isValidating ? (
                  <div className="flex justify-between text-xs text-neutral-400">
                    <span>Memvalidasi voucher...</span>
                    <Loader2 className="w-3 h-3 animate-spin" />
                  </div>
                ) : calculation.discount_amount > 0 && (
                  <div className="flex justify-between text-sm text-red-500 font-medium">
                    <span>Diskon Voucher</span>
                    <span>-{formatCurrency(calculation.discount_amount)}</span>
                  </div>
                )}
                
                {/* TAMPILKAN ONGKIR */}
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Ongkos Kirim</span>
                  <span className="dark:text-white">
                    {selectedShipping ? formatCurrency(selectedShipping.price) : "-"}
                  </span>
                </div>

                {/* HITUNG TOTAL AKHIR SECARA REALTIME */}
                <div className="border-t dark:border-neutral-800 pt-4 flex justify-between items-end">
                  <span className="font-bold dark:text-white">Total Bayar</span>
                  <span className="text-2xl font-black dark:text-white">
                    {formatCurrency(
                      Math.max(0, (subtotal - calculation.discount_amount)) + (selectedShipping?.price || 0)
                    )}
                  </span>
                </div>
              </div>
              
              <Button 
                disabled={isValidating}
                onClick={handleCheckout}
                className="w-full h-14 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-lg"
              >
                {isValidating ? "Menghitung..." : "Buat Pesanan"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}