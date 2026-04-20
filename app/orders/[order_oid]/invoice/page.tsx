  "use client";

  import { useEffect, useState } from "react";
  import { useParams, useRouter } from "next/navigation";
  import { ChevronLeft, Receipt, CreditCard, Loader2, PackageCheck, AlertCircle, XCircle } from "lucide-react";
  import { Button } from "@/components/ui/button";
  import { Skeleton } from "@/components/ui/skeleton"; // Pastikan sudah install shadcn skeleton
  import axiosInstance from "@/lib/axios";
  import { useGlobal } from "@/context/GlobalContext";
  import Link from "next/link";
  import { toast } from "sonner";
  import { useCartStore } from "@/store/useCartStore";

  // Interface ditingkatkan untuk keamanan tipe data
  interface OrderDetail {
    order_id: number;
    order_number: string;
    items: OrderItem[];
    subtotal: number;
    voucher_discount: number;
    grand_total: number;
    created_at?: string;
    status: string;
    address: {
      address_line: string;
      city: string;
      district: string;
      subdistrict: string;
      postal_code: string;
      province: string;
      receiver_name: string;
      phone: string;
    };
  }

  type OrderItem = {
    qty: number;
    variant: {
      product: {
        name: string;
        slug : string;
      }
      color: string;
      size: string;
      price: number;
    }
  };

  export default function InvoicePage() {
    const params = useParams();
    const router = useRouter();
    const { formatCurrency, confirm } = useGlobal();
    
    const orderOid = params.order_oid;

    const [isLoadingOrder, setIsLoadingOrder] = useState(true);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { refreshCart } = useCartStore();

    const fetchOrderData = async (isMounted: boolean) => {
      try {
        setIsLoadingOrder(true);
        setError(null);
        const response = await axiosInstance.get(`/orders/${orderOid}`);
        console.log('response',response);
        
        
        if (isMounted) {
          setOrderDetail(response.data.data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.response?.data?.message || "Gagal memuat detail pesanan.");
          console.error("Fetch error:", err);
        }
      } finally {
        if (isMounted) setIsLoadingOrder(false);
      }
    };

    useEffect(() => {
      let isMounted = true; // Anti-pattern/race condition protection

      if (orderOid) fetchOrderData(isMounted);

      return () => { isMounted = false; };
    }, [orderOid]);

    const handlePayment = async () => {
      if (!orderDetail) return;
      
      try {
        setIsProcessingPayment(true);
        const response = await axiosInstance.post(`/orders/${orderOid}/invoice`);
        const invoiceUrl = response.data.data.invoice_url;
        
        if (invoiceUrl) {
          window.location.href = invoiceUrl; // Lebih aman daripada _blank untuk flow pembayaran
        }
      } catch (error: any) {
        alert("Gagal mengalihkan ke pembayaran. Silakan coba lagi.");
        console.error("Payment error:", error.response);
      } finally {
        setIsProcessingPayment(false);
      }
    };

    const handleCancelOrders = async () => {
      if (!orderDetail) return;
      
      try {

        confirm({
          title: `Konfirmasi Batal`,
          description: `Apakah Anda yakin ingin membatalkan pesanan ini?`,
          onConfirm: async () => {
            // Panggil API di sini
            const response = await axiosInstance.put(`/orders/${orderOid}/cancel`);
            fetchOrderData(true);
          }
        });

      } catch (error: any) {
        alert("Gagal mengalihkan ke pembayaran. Silakan coba lagi.");
        console.error("Payment error:", error.response);
      } 
    };

    const handleRepeatOrder = async (items: any[]) => {
      try {
        const promises = items.map((item) =>
          axiosInstance.post('/cart/items', {
            product_id : item.variant.product_id,
            variant_id: item.variant_id,
            qty: item.qty || 1
          })
        );
    
        const responses = await Promise.all(promises);
        
        
        // Sesuaikan res.data.cart_item_id dengan struktur JSON dari API Anda
        const newItemIds = responses.map(res => res.data.item.cart_item_id);
        
        // Kirim ID ke store agar nanti di halaman Cart otomatis terceklis
        await refreshCart(newItemIds);

        toast.success("Berhasil dimasukan ke Keranjang", { position: "top-center", className: "mt-15" });
        
        router.push('/cart');
      } catch (err) {
        toast.error("Gagal dimasukan ke Keranjang", { position: "top-center", className: "mt-15" });
      }
    };

    if (error) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <AlertCircle className="text-red-500 w-12 h-12" />
          <p className="text-neutral-600 dark:text-neutral-400 font-medium">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">Coba Lagi</Button>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-[#0a0a0a] flex items-center justify-center p-4 md:p-10">
        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
          
        {/* KOLOM KIRI: STATUS & AKSI */}
        <div className="lg:col-span-1 bg-white dark:bg-[#141414] border border-neutral-200 dark:border-neutral-800 rounded-[2.5rem] p-8 md:p-12 shadow-sm flex flex-col justify-between min-h-125">
      
        {/* Bagian Atas: Informasi Status */}
          <div className="flex flex-col items-center text-center space-y-6">
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-colors duration-500 ${
                  orderDetail?.status === 'paid' 
                      ? "bg-green-100 dark:bg-green-900/20" 
                      : orderDetail?.status === 'canceled'
                      ? "bg-red-100 dark:bg-red-900/20" // Warna merah untuk batal
                      : "bg-blue-100 dark:bg-blue-900/20"
              }`}>
                  {orderDetail?.status === 'paid' ? (
                      <PackageCheck className="text-green-600 dark:text-green-400 w-10 h-10" />
                  ) : orderDetail?.status === 'canceled' ? (
                      <XCircle className="text-red-600 dark:text-red-400 w-10 h-10" /> // Ikon X untuk batal
                  ) : (
                      <CreditCard className="text-blue-600 dark:text-blue-400 w-10 h-10" />
                  )}
              </div>

              <div className="space-y-3 mb-10">
                  {isLoadingOrder ? (
                      <div className="flex flex-col items-center gap-2">
                          <Skeleton className="h-8 w-48" />
                          <Skeleton className="h-4 w-64" />
                      </div>
                  ) : (
                      <>
                          <h1 className="text-3xl font-black dark:text-white tracking-tight leading-tight">
                              {orderDetail?.status === 'paid' 
                                  ? "Pembayaran Berhasil!" 
                                  : orderDetail?.status === 'canceled'
                                  ? "Pesanan Dibatalkan" 
                                  : "Pesanan Berhasil Dibuat!"}
                          </h1>
                          <p className="text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto text-sm leading-relaxed">
                              {orderDetail?.status === 'paid' 
                                  ? "Terima kasih! Pesanan Anda sedang kami verifikasi dan akan segera masuk tahap pengiriman." 
                                  : orderDetail?.status === 'canceled'
                                  ? "Sayang sekali, pesanan ini telah dibatalkan. Silakan hubungi bantuan jika ini adalah kesalahan."
                                  : "Selesaikan pembayaran Anda segera agar kami dapat langsung memproses pesanan Anda."}
                          </p>
                      </>
                  )}
              </div>
          </div>

            {/* Bagian Bawah: Tombol Aksi */}
              <div className="space-y-4 w-full">
                  {!isLoadingOrder && (
                      <>
                          {/* 1. Kondisi: Belum Bayar (Pending/Unpaid) */}
                          {orderDetail?.status !== 'paid' && orderDetail?.status !== 'canceled' && (
                              <Button 
                                  onClick={handlePayment}
                                  disabled={isProcessingPayment}
                                  className="w-full h-14 rounded-full bg-black hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 font-bold text-lg transition-all shadow-lg active:scale-[0.98]"
                              >
                                  {isProcessingPayment ? (
                                      <Loader2 className="animate-spin mr-2" />
                                  ) : (
                                      <CreditCard className="mr-2" size={20} />
                                  )}
                                  {isProcessingPayment ? "Memproses..." : "Bayar Sekarang"}
                              </Button>
                          )}

                          {/* 2. Kondisi: Sudah Bayar (Paid) */}
                          {orderDetail?.status === 'paid' && (
                              <Button 
                                  onClick={() => router.push('/orders')}
                                  variant="outline"
                                  className="w-full h-14 rounded-full border-2 font-bold text-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                              >
                                  Pantau Status Pengiriman
                              </Button>
                          )}

                          {/* 3. Kondisi: Dibatalkan (canceled) */}
                          {orderDetail?.status === 'canceled' && (
                              <Button 
                                  onClick={() => router.push('/catalog')} // Arahkan kembali belanja
                                  className="w-full h-14 rounded-full bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 hover:text-white font-bold text-lg"
                              >
                                  Belanja Lagi
                              </Button>
                          )}
                      </>
                  )}

                  {isLoadingOrder && <Skeleton className="h-14 w-full rounded-full" />}
                  
                  <button 
                      onClick={() => router.push('/orders')}
                      className="w-full py-2 text-xs font-medium text-neutral-400 hover:text-black dark:hover:text-white flex items-center justify-center gap-2 transition-all group"
                  >
                      <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> 
                      Kembali ke Daftar Pesanan
                  </button>

                  {orderDetail?.status === 'paid' && (
                      <Button 
                          onClick={() => handleRepeatOrder(orderDetail.items)}
                          className="w-full h-14 rounded-full font-bold text-lg transition-all shadow-lg active:scale-[0.98]"
                      >
                          Beli lagi ({orderDetail.items.length})
                      </Button>
                  )}

                  {!isLoadingOrder && orderDetail?.status !== 'paid' && orderDetail?.status !== 'canceled' && (
                      <Button 
                          onClick={handleCancelOrders} // Arahkan kembali belanja
                          variant={'outline'}
                          className="w-full h-14 rounded-full border-2 border-red-400 text-red-400 hover:bg-red-400 hover:text-white dark:hover:bg-red-900 dark:border-red-400 font-bold text-lg"
                      >
                          Batalkan Pesanan
                      </Button>
                  )}
              </div>
          </div>

          {/* Bagian Bawah: Ringkasan Invoice */}
          {/* KOLOM KANAN: RINGKASAN INVOICE */}
          <div className="lg:col-span-2 bg-white dark:bg-[#141414] border border-neutral-200 dark:border-neutral-800 rounded-[2.5rem] p-8 md:p-12 shadow-sm relative overflow-hidden">
              
              {/* --- EFEK STEMPEL LUNAS (Hanya muncul jika status paid) --- */}
              {!isLoadingOrder && orderDetail?.status === 'paid' && (
                  /* Posisi diatur ke kanan bawah, di atas area Total Tagihan */
                  <div className="absolute bottom-32 right-12 z-20 pointer-events-none opacity-80">
                  <div className="relative flex items-center justify-center">
                      {/* Border Stempel Diperkecil (padding & font-size diturunkan) */}
                      <div className="border-4 border-green-500/40 dark:border-green-400/30 px-4 py-1 rounded-xl transform -rotate-12 flex flex-col items-center">
                      <span className="text-2xl font-black text-green-600/50 dark:text-green-400/40 tracking-widest uppercase">
                          LUNAS
                      </span>
                      <div className="h-0.5 w-full bg-green-600/40 dark:bg-green-400/30 mt-0.5"></div>
                      <span className="text-[7px] font-bold text-green-600/40 dark:text-green-400/30 mt-0.5 tracking-tight uppercase">
                          Verified
                      </span>
                      </div>
                  </div>
                  </div>
              )}

              {/* Efek Garis Dekoratif (Gaya Tiket) */}
              <div className="absolute top-0 left-0 w-full h-2 bg-black dark:bg-white opacity-10"></div>
              
              <div className="flex justify-between items-start mb-10 relative z-10">
                <div className="space-y-4 w-full">
                  {/* Judul & Badge Status */}
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-black dark:text-white uppercase tracking-tighter italic">
                      Invoice
                    </h3>
                    {!isLoadingOrder && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ${
                        orderDetail?.status === 'paid' 
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                          : orderDetail?.status === 'cancelled'
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      }`}>
                        {orderDetail?.status}
                      </span>
                    )}
                  </div>

                  {isLoadingOrder ? (
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-48" />
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-20 w-full rounded-xl" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Info Order */}
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Detail Pesanan</p>
                        <p className="text-sm font-medium dark:text-neutral-200">
                          No. Order: <span className="font-mono text-primary">{orderDetail?.order_number}</span>
                        </p>
                        <p className="text-xs text-neutral-500">
                          Dibuat pada {new Date(orderDetail?.created_at || new Date()).toLocaleDateString('id-ID', { 
                            dateStyle: 'long' 
                          })}
                        </p>
                      </div>

                      {/* Info Penerima */}
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Penerima</p>
                        <p className="text-sm font-bold dark:text-neutral-200">
                          {orderDetail?.address.receiver_name}
                        </p>
                        <p className="text-xs text-neutral-500">{orderDetail?.address.phone}</p>
                      </div>

                      {/* Alamat Pengiriman - Full Width */}
                      <div className="md:col-span-2 space-y-2">
                        <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Alamat Pengiriman</p>
                        <div className="p-4 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-800 rounded-2xl">
                          <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                            <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                              {orderDetail?.address.address_line}
                            </span>
                            <br />
                            {orderDetail?.address.subdistrict}, {orderDetail?.address.district}
                            <br />
                            {orderDetail?.address.city}, {orderDetail?.address.province}, {orderDetail?.address.postal_code}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Icon yang sedikit lebih subtle */}
                <div className="hidden sm:block opacity-20 dark:opacity-10">
                  <Receipt className="text-neutral-900 dark:text-white w-12 h-12" />
                </div>
              </div>

              {/* List Item dengan Skeleton */}
              <div className="space-y-4 max-h-75 overflow-y-auto pr-2 custom-scrollbar min-h-25 **:relative z-10">
                  {isLoadingOrder ? (
                  Array(3).fill(0).map((_, i) => (
                      <div key={i} className="flex justify-between">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-4 w-1/4" />
                      </div>
                  ))
                  ) : (
                  orderDetail?.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm animate-in fade-in duration-500">
                      <span className="text-neutral-500 dark:text-neutral-400">
                          <Link href={`/product/${item?.variant?.product?.slug}`}>
                                  {item.qty}x {item?.variant?.product?.name}
                          </Link>
                          <span className="text-[10px] ml-2 opacity-70 uppercase">({item?.variant?.color} / {item?.variant?.size})</span>
                      </span>
                      <span className="font-medium dark:text-white">{formatCurrency(item?.variant?.price * item?.qty)}</span>
                      </div>
                  ))
                  )}
              </div>

              <div className="mt-8 pt-8 border-t border-dashed border-neutral-200 dark:border-neutral-800 space-y-3 relative z-10">
                  <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Subtotal</span>
                  {isLoadingOrder ? <Skeleton className="h-4 w-20" /> : <span className="dark:text-white font-medium">{formatCurrency(orderDetail?.subtotal || 0)}</span>}
                  </div>
                  
                  {!isLoadingOrder && orderDetail?.voucher_discount && orderDetail.voucher_discount > 0 ? (
                  <div className="flex justify-between text-sm">
                      <span className="text-red-500">Diskon Voucher</span>
                      <span className="text-red-500 font-medium">-{formatCurrency(orderDetail.voucher_discount)}</span>
                  </div>
                  ) : null}

                  <div className="flex justify-between items-center pt-4">
                  <span className="text-lg font-bold dark:text-white">Total Tagihan</span>
                  {isLoadingOrder ? (
                      <Skeleton className="h-8 w-32" />
                  ) : (
                      <span className="text-2xl font-black text-black dark:text-white tracking-tighter">
                      {formatCurrency(orderDetail?.grand_total || 0)}
                      </span>
                  )}
                  </div>
              </div>

              {/* Footer Card */}
              <div className="mt-10 p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-2xl relative z-10">
                  <p className="text-[10px] text-yellow-700 dark:text-yellow-500 leading-tight italic">
                  {orderDetail?.status === 'paid' 
                      ? "*Terima kasih atas pembayaran Anda. Pesanan Anda sedang kami siapkan untuk pengiriman."
                      : "*Pesanan akan otomatis dibatalkan jika pembayaran tidak diterima dalam waktu 24 jam."
                  }
                  </p>
              </div>
          </div>
        </div>
      </div>
    );
  }