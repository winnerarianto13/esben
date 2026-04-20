"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { useGlobal } from "@/context/GlobalContext";
import axiosInstance from "@/lib/axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCartStore } from "@/store/useCartStore";


// Sesuaikan Interface dengan struktur JSON Server
interface Variant {
  variant_id: number;
  color: string;
  size: string;
  price: string;
  stock: number;
  images: { image_url: string }[];
}

interface Product {
  product_id: number;
  name: string;
  price: string;
  images: { image_url: string }[];
  variants: Variant[];
}

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CartModal({ product, isOpen, onClose }: ProductModalProps) {
  const { formatCurrency, confirm } = useGlobal();
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const router = useRouter();
  const { refreshCart } = useCartStore();
  const baseUrl = process.env.NEXT_PUBLIC_STORAGE_URL || "";


  // 1. Reset state saat modal ditutup atau ganti produk
  useEffect(() => {
    if (!isOpen) {
      setQuantity(1);
      setSelectedSize("");
      setSelectedVariant("");
    }
  }, [isOpen]);

  // 2. Ambil Pilihan Unik untuk UI
  const availableVariants = useMemo(() => {
    if (!product?.variants) return [];

    // Menggunakan Map untuk memastikan warna unik sambil menyimpan objek datanya
    const uniqueVariantsMap = new Map();

    product.variants.forEach((v) => {
        if (!uniqueVariantsMap.has(v.color)) {
            uniqueVariantsMap.set(v.color, {
                color: v.color,
                // Mengambil image_url dari varian ini
                // Pastikan struktur data sesuai dengan API kamu (misal: v.images[0].image_url)
                image: v.images?.[0]?.image_url
            });
        }
    });

    return Array.from(uniqueVariantsMap.values());
}, [product]);

  const availableSizes = useMemo(() => 
    Array.from(new Set(product?.variants.map(v => v.size))), 
  [product]);

  // 3. Cari data varian yang sedang aktif secara lengkap
  const activeVariant = useMemo(() => {
    return product?.variants.find(v => v.color === selectedVariant && v.size === selectedSize);
  }, [product, selectedVariant, selectedSize]);

  const currentStock = activeVariant?.stock || 0;

  // 4. Hitung Total Harga (Gunakan parseFloat agar tidak jadi jutaan)
  const calculateTotal = useMemo(() => {
    if (!product) return "Rp 0";
    const basePrice = activeVariant ? parseFloat(activeVariant.price) : parseFloat(product.price);
    return formatCurrency(basePrice * quantity);
  }, [product, activeVariant, quantity, formatCurrency]);

  const handleAddToCart = async () => {
    if (!product) return;
    const variantId = activeVariant?.variant_id || product.variants[0].variant_id;
    const data = {
      product_id: product.product_id,
      variant_id: variantId,
      qty: quantity,
    };
    try {
      confirm({
        title: `Konfirmasi Tambah`,
        description: `Apakah anda yakin ingin menambahkan item ini ke keranjang?`,
        onConfirm: async () => {
          // Panggil API di sini
          const res = await axiosInstance.post("/cart/items", data);
          // tutup modal
          refreshCart([product.product_id], true);
          onClose();
          toast.success("Berhasil Masuk Keranjang", { position: "top-center",className: "mt-15" });
        }
      });

    } catch (err: any) {
        console.error("Error adding to cart:", err.response);
        // jika status error = 401, kembalikan ke halaman login
        if ((err as { response: { status: number } }).response?.status === 401) {
            router.push("/login");
        }
    }
};

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-105 rounded-3xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{product.name}</DialogTitle>
          <DialogDescription>
            Tentukan pilihan untuk langsung masuk ke keranjang.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Pilihan Varian/Warna */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Varian</span>
            <div className="flex flex-wrap gap-2">
            {availableVariants.map((variant) => (
                            <button
                                key={variant.color}
                                onClick={() => {
                                    setSelectedVariant(variant.color);
                                    setSelectedSize("");
                                }}
                                className={`flex items-center gap-3 px-3 py-2 rounded-xl border transition-all ${
                                    selectedVariant === variant.color
                                        ? "bg-black border-black text-white dark:bg-white dark:text-black"
                                        : "border-neutral-200 dark:border-neutral-800"
                                }`}
                            >
                                {/* TAMPILKAN GAMBAR DISINI */}
                                <div className="w-10 h-10 overflow-hidden bg-neutral-100">
                                    <img 
                                        className="w-full h-full object-cover" 
                                        src={variant.image ? `${baseUrl}/storage/${variant.image}` : "/placeholder.jpg"} 
                                        alt={variant.color} 
                                    />
                                </div>

                                <span className="text-xs font-bold pr-2">
                                    {variant.color}
                                </span>
                            </button>
                        ))}
            </div>
          </div>

          {/* Pilihan Ukuran (Dengan validasi ketersediaan) */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Ukuran</span>
            <div className="flex flex-wrap gap-2">
              {availableSizes.map((size) => {
                const isAvailable = product.variants.some(
                  (v) => v.color === selectedVariant && v.size === size && v.stock > 0
                );
                return (
                  <button
                    key={size}
                    disabled={!selectedVariant || !isAvailable}
                    onClick={() => { setSelectedSize(size); setQuantity(1); }}
                    className={`h-11 w-14 rounded-xl border text-sm font-bold transition-all ${
                      selectedSize === size
                        ? "bg-black text-white border-black dark:bg-white dark:text-black"
                        : isAvailable 
                          ? "hover:border-black cursor-pointer" 
                          : "opacity-20 cursor-not-allowed bg-neutral-100 dark:bg-neutral-700"
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Input Jumlah & Stok */}
          <div className="flex items-center justify-between pt-2">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground block">Jumlah</span>
              <div className="flex items-center w-fit border rounded-full p-1 bg-muted/30">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full" 
                    disabled={quantity <= 1}
                    onClick={() => setQuantity(prev => prev - 1)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-10 text-center font-bold text-sm">{quantity}</span>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full"
                    disabled={!activeVariant || quantity >= currentStock}
                    onClick={() => setQuantity(prev => prev + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="text-right">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Stok Tersedia</span>
                <p className={`text-sm font-bold ${currentStock < 5 ? 'text-orange-500' : ''}`}>
                    {selectedVariant && selectedSize ? `${currentStock} pcs` : '--'}
                </p>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button
            disabled={!selectedSize || !selectedVariant || currentStock === 0}
            className="w-full h-14 rounded-2xl font-bold text-md shadow-lg transition-all active:scale-95"
            onClick={handleAddToCart}
          >
            {!selectedVariant
              ? "Pilih Warna"
              : !selectedSize
              ? "Pilih Ukuran"
              : currentStock === 0
              ? "Stok Habis"
              : `Tambah • ${calculateTotal}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}