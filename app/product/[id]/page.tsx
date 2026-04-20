"use client";

import { useParams } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Minus, Plus, Loader2, PackageSearch, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import axiosInstance from "@/lib/axios";
import { useGlobal } from "@/context/GlobalContext";
import { useRouter } from 'next/navigation';
import { toast } from "sonner";
import { useCartStore } from "@/store/useCartStore";
import Loading from "@/components/Loading";
import  ZoomImage  from "@/components/ZoomImage";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

// --- INTERFACE BERDASARKAN JSON SERVER ---
interface Variant {
  variant_id: number;
  color: string;
  size: string;
  price: string;
  stock: number;
  images: [
    {
      image_id: number;
      image_url: string;
      is_primary: boolean;
    }
  ]
  stock_status: string;
}

interface ProductImage {
  image_id: number;
  image_url: string;
  is_primary: boolean;
}

interface Product {
  product_id: number;
  name: string;
  description: string;
  price: number;
  images: ProductImage[];
  variants: Variant[];
  compare_at_price: number;
}

export default function ProductDetailPage() {
    const params = useParams();
    const { formatCurrency } = useGlobal(); // Mengambil fungsi global dari Context
    const router = useRouter();
    
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [selectedSize, setSelectedSize] = useState<string>("");
    const [selectedVariant, setSelecedVariant] = useState<string>("");
    const [isExpanded, setIsExpanded] = useState(false);
    const { fetchCartLength, refreshCart } = useCartStore();

    const [api, setApi] = useState<CarouselApi>();
    const [current, setCurrent] = useState(0);
    const [count, setCount] = useState(0);
    const [isSendToCart, setIsSendToCart] = useState(false);
    const [isNameExpanded, setIsNameExpanded] = useState(false);
    const baseUrl = process.env.NEXT_PUBLIC_STORAGE_URL || "";

    // --- FETCH DATA MENGGUNAKAN PARAMS.ID ---
    useEffect(() => {
        if (!params.id) return;
        setLoading(true);
        axiosInstance.get(`/product/${params.id}`)
        .then(res => {
            // Sesuaikan jika response API Anda membungkus data di dalam .data
            setProduct(res.data.data || res.data);
        })
        .catch(err => console.error("Error fetching product:", err))
        .finally(() => setLoading(false));
    }, [params.id]);

    // --- CAROUSEL LOGIC ---
    useEffect(() => {
        if (!api) return;
        setCount(api.scrollSnapList().length);
        setCurrent(api.selectedScrollSnap() + 1);
        api.on("select", () => setCurrent(api.selectedScrollSnap() + 1));
    }, [api]);

    // --- LOGIKA GAMBAR (ARRAY TO URL) ---
    const displayImages = useMemo(() => {
        if (!product?.images || product.images.length === 0) return ["/placeholder.jpg"];
        
        return product.images.map(img => 
        img.image_url.startsWith('http') ? img.image_url : `${baseUrl}${img.image_url}`
        );
    }, [product]);

    // --- AMBIL PILIHAN UNIK UNTUK UI ---
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

    // 1. Cari data varian yang aktif terlebih dahulu (Letakkan di atas, sebelum 'if (!product) return')
    const selectedVariantData = useMemo(() => {
        if (!product) return null;
        return product.variants.find(
        (v) => v.color === selectedVariant && v.size === selectedSize
        );
    }, [product, selectedVariant, selectedSize]);
    
    // 2. Fungsi hitung total menggunakan useMemo agar efisien
    const calculateTotal = useMemo(() => {
        if (!product) return "Rp 0";
    
        // Ambil harga dari varian jika sudah dipilih, jika belum gunakan harga produk utama
        // Gunakan parseFloat untuk menangani string "85000.00" dari database
        const basePrice = selectedVariantData 
        ? parseFloat(selectedVariantData.price) 
        : product.price;
    
        const total = basePrice * quantity;
    
        // Gunakan formatCurrency dari context agar seragam
        return formatCurrency(total);
    }, [product, selectedVariantData, quantity, formatCurrency]);

    // Add To Cart Fungsi
    const handleAddToCart = async () => {
        if (!product) return;
        const variantId = selectedVariantData?.variant_id || product.variants[0].variant_id;
        const qty = quantity;
        const data = {
            product_id: product.product_id,
            variant_id: variantId,
            qty: qty,
        };
        try {
            setIsSendToCart(true);
            const res = await axiosInstance.post("/cart/items", data);
            if (res.status === 200) {
                refreshCart();
                toast.success("Berhasil Masuk Keranjang", { position: "top-center", className: "mt-15" });
            }
        } catch (err: any) {
            console.error("Error adding to cart:", err);
            toast.error("Gagal Masuk Keranjang", { position: "top-center", className: "mt-15" });
            // jika status error = 401, kembalikan ke halaman login
            if ((err as { response: { status: number } }).response?.status === 401) {
                router.push("/login");
            }
        } finally {
            setIsSendToCart(false);
        }
    };
    

    if (loading) return <Loading />;
    if (!product) {
        return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] w-full p-20 text-center animate-in fade-in duration-500">
            <div className="bg-red-500/20 p-4 rounded-full mb-4">
                <PackageSearch size={48} className="text-red-500" />
            </div>
            
            <h2 className="text-2xl font-semibold text-slate-800">
                Produk Tidak Ditemukan
            </h2>
             
            <p className="text-slate-500 mt-2 max-w-xs">
                Maaf, kami tidak dapat menemukan detail produk yang Anda cari.
            </p>

            <Link href="/product    ">
                <Button className="mt-4 gap-2" variant="default">
                <ArrowLeft size={18} />
                    Kembali ke Katalog
                </Button>
            </Link>
        </div>
        );
      }

  return (
    <div className="min-h-screen pb-20 bg-background">
        <nav className="container mx-auto px-6 py-10">
            <Button onClick={() => router.back()} variant={'ghost'} className="flex items-center text-sm text-muted-foreground">
            <ChevronLeft className="w-4 h-4 mr-1" /> Kembali
            </Button>
        </nav>

        <main className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* KIRI: CAROUSEL GAMBAR */}
            <div className="relative group">
                <Carousel setApi={setApi} className="w-full">
                    <CarouselContent>
                        {displayImages.map((src, index) => (
                            <CarouselItem key={index}>
                                <div className="aspect-3/4 rounded-3xl overflow-hidden bg-muted">
                                    <ZoomImage src={src} alt={product.name} />
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>

                    {/* Indikator Angka */}
                    <div className="absolute top-4 right-4 z-20 bg-black/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white pointer-events-none">
                        {current} / {count}
                    </div>

                    {/* Thumbnail Navigasi */}
                    <div className="absolute bottom-6 left-6 z-20 flex gap-2">
                        {displayImages.map((src, index) => (
                            <button
                                key={index}
                                onClick={() => api?.scrollTo(index)}
                                className={`relative w-12 h-16 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                                    current === index + 1 
                                    ? "border-white scale-110 shadow-lg" 
                                    : "border-transparent opacity-60 hover:opacity-100"
                                }`}
                            >
                                <img src={src} className="w-full h-full object-cover" alt={`Go to slide ${index + 1}`} />
                            </button>
                        ))}
                    </div>

                    {/* Navigasi Button (z-30 agar di atas area zoom) */}
                    <div className="hidden md:block opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-30 h-10 w-10 rounded-full bg-white/80 backdrop-blur-sm border-none shadow-sm hover:bg-white" />
                        <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-30 h-10 w-10 rounded-full bg-white/80 backdrop-blur-sm border-none shadow-sm hover:bg-white" />
                    </div>
                </Carousel>
            </div>

            {/* KANAN: INFO PRODUK */}
            <div className="flex flex-col space-y-8">
                <div className="space-y-2">
                    <motion.h1
                        layout // Menghilangkan kaku saat teks bertambah panjang
                        onClick={() => setIsNameExpanded(!isNameExpanded)}
                        className={`
                            text-4xl font-bold tracking-tighter cursor-pointer transition-all duration-300
                            ${isNameExpanded ? "line-clamp-none" : "line-clamp-1"}
                            md:line-clamp-none /* Di desktop biasanya aman untuk ditampilkan semua */
                        `}
                        >
                        {product.name}
                    </motion.h1>
                    {/* Jika varian terpilih ada harganya, tampilkan harga varian. Jika tidak, tampilkan harga utama. */}
                    {selectedVariantData ? (
                        <p className="text-2xl font-bold text-neutral-500">{formatCurrency(selectedVariantData.price)}</p>
                    ):(
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                            {product.compare_at_price && product.price < product.compare_at_price && (
                                <>
                                {/* Harga Coret */}
                                <p className="text-2xl font-medium text-gray-300 dark:text-neutral-600 line-through">
                                    {formatCurrency(product.compare_at_price)}
                                </p>

                                {/* Badge Persentase Otomatis */}
                                <div className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-black rounded-sm">
                                    -{Math.round(
                                    ((product.compare_at_price - product.price) / product.compare_at_price) * 100
                                    )}%
                                </div>
                                </>
                            )}
                            
                            {/* Harga Utama */}
                            <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
                                {formatCurrency(product.price)}
                            </p>
                        </div>
                    )}
                </div>

                {/* DESKRIPSI */}
                <div className="space-y-2">
                    {/* 1. Tentukan threshold (misal 150 karakter) */}
                    {/* Atau cek apakah product.description ada nilainya */}
                    {product.description && (
                        <>
                            <motion.div 
                                animate={{ height: isExpanded ? "auto" : "60px" }} 
                                className="relative overflow-hidden"
                            >
                                <p className="text-sm text-neutral-500 leading-relaxed whitespace-pre-line">
                                    {product.description}
                                </p>
                                
                                {/* 2. Overlay gradient hanya muncul jika teks panjang DAN sedang tidak expand */}
                                {!isExpanded && product.description.length > 150 && (
                                    <div className="absolute bottom-0 w-full h-8 bg-linear-to-t from-background to-transparent" />
                                )}
                            </motion.div>

                            {/* 3. Tombol hanya muncul jika karakter melebihi batas */}
                            {product.description.length > 150 && (
                                <button 
                                    onClick={() => setIsExpanded(!isExpanded)} 
                                    className="text-[10px] font-bold uppercase tracking-widest underline"
                                >
                                    {isExpanded ? "Sembunyikan" : "Lihat Selengkapnya"}
                                </button>
                            )}
                        </>
                    )}
                    
                    {/* Fallback jika deskripsi kosong */}
                    {!product.description && <p className="text-sm text-neutral-500 italic">Tidak ada deskripsi.</p>}
                </div>

                {/* PILIHAN WARNA */}
                <div className="space-y-3">
                    <span className="text-xs font-bold text-muted-foreground uppercase">VARIAN</span>

                    <div className="flex flex-wrap gap-3">
                        {availableVariants.map((variant) => (
                            <button
                                key={variant.color}
                                onClick={() => {
                                    setSelecedVariant(variant.color);
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
                {/* PILIHAN UKURAN */}
                <div className="space-y-3">
                    <span className="text-xs font-bold text-muted-foreground uppercase">Ukuran</span>
                    <div className="flex gap-2">
                        {availableSizes.map((size) => {
                        // 1. Cek apakah ukuran ini tersedia untuk warna yang sedang dipilih
                        const isAvailable = product.variants.some(
                            (v) => v.color === selectedVariant && v.size === size && v.stock > 0
                        );

                        return (
                            <button
                            key={size}
                            // 2. Jangan izinkan klik jika ukuran tidak tersedia
                            onClick={() => isAvailable && setSelectedSize(size)}
                            disabled={!selectedVariant || !isAvailable}
                            className={`w-12 h-12 rounded-xl border flex items-center justify-center text-sm transition-all ${
                                selectedSize === size 
                                ? "bg-black text-white dark:bg-white dark:text-black border-black" 
                                : isAvailable
                                    ? "hover:border-black dark:hover:border-white cursor-pointer"
                                    : "opacity-20 cursor-not-allowed bg-neutral-100 dark:bg-neutral-700"
                            }`}
                            >
                            {size}
                            </button>
                        );
                        })}
                    </div>
                </div>

                {/* JUMLAH & TOMBOL */}
                <div className="space-y-6 pt-4">
                    <div className="flex items-center w-fit bg-muted rounded-full p-1">
                        <Button variant="ghost" size="icon" disabled={!product.variants.some(v => v.color === selectedVariant && v.size === selectedSize && v.stock > 0)} onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                            <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center font-bold">{quantity}</span>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            // Tombol mati jika:
                            // 1. Varian/ukuran belum dipilih (stok tidak ditemukan)
                            // 2. ATAU jumlah saat ini sudah mencapai/melebihi stok yang ada
                            disabled={
                                !product.variants.find(v => v.color === selectedVariant && v.size === selectedSize) || 
                                quantity >= (product.variants.find(v => v.color === selectedVariant && v.size === selectedSize)?.stock || 0)
                            } 
                            onClick={() => setQuantity(quantity + 1)}
                            >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                    <p className="text-sm  font-bold uppercase">Stok tersedia: {product.variants.find((v) => v.color === selectedVariant && v.size === selectedSize)?.stock || '-'}</p>

                    <Button 
                        disabled={!selectedVariant || !selectedSize || isSendToCart}
                        className="w-full h-16 rounded-2xl font-bold text-lg shadow-xl disabled:opacity-50 transition-all active:scale-[0.98]"
                        onClick={() => handleAddToCart()}
                        >
                        {isSendToCart ? (
                            <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Menambahkan...</span>
                            </div>
                        ) : (
                            <>
                            {!selectedVariant 
                                ? "Pilih Varian" 
                                : !selectedSize 
                                ? "Pilih Ukuran" 
                                : `Tambah ke Keranjang • ${calculateTotal}`
                            }
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </main>
    </div>
  );
}