"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from 'next/image';
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";

// Components
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { CartModal } from "@/components/CartModal";
import ProductCard from "@/components/ProductCard";
import Loading from "@/components/Loading";
import Autoplay from "embla-carousel-autoplay";
// Libs & Utils
import axiosInstance from '@/lib/axios';

// --- TYPES ---
interface Product {
  product_id: number;
  name: string;
  price: number;
  tag: string | null;
  image: string;
  variants: string[];
  compare_at_price: number;
  is_home: boolean;
  primary_image?: { image_url: string };
  slug: string;
  brand: {
    brand_id: number;
    name: string;
    category: { name: string; category_id: number };
  };
  sold_count: number;
}

interface Brand {
  brand_id: number;
  name: string;
  image_background: string;
  image_logo: string;
}

interface Thumbnail {
  title: string;
  type: string;
  file_url: string;
  button: string;
  subtitle: string;
  description: string;
  is_banner: boolean;
}

interface EventBanner extends Thumbnail {
  no_urut: number;
}

export default function HomePage() {
  // --- STATES ---
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [thumbnails, setThumbnails] = useState<Thumbnail[]>([]);
  const [eventBanners, setEventBanners] = useState<EventBanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [api, setApi] = useState<CarouselApi>();

  const esbegRef = useRef<HTMLDivElement | null>(null);

  // --- API CALLS ---
  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const [productRes, brandRes, thumbnailRes] = await Promise.all([
        axiosInstance.get('/product'),
        axiosInstance.get('/brand'),
        axiosInstance.get('/thumbnail')
      ]);

      const allThumbnails = thumbnailRes.data.data;
      
      setEventBanners(allThumbnails.filter((t: Thumbnail) => t.is_banner === true));
      setThumbnails(allThumbnails.filter((t: Thumbnail) => t.is_banner === false));
      setProducts(productRes.data.filter((p: Product) => p.is_home === true));
      setBrands(brandRes.data.data);
    } catch (error) {
      console.error("Gagal mengambil data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // --- HELPERS ---
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  const getSortedBrands = () => {
    if (!brands.length) return [];
    const otherBrands = brands.filter(b => b.name.toLowerCase() !== 'esbeg');
    const esbegBrand = brands.find(b => b.name.toLowerCase() === 'esbeg');
    if (!esbegBrand) return brands;
    
    const middleIndex = Math.floor(otherBrands.length / 2);
    return [
      ...otherBrands.slice(0, middleIndex),
      esbegBrand,
      ...otherBrands.slice(middleIndex)
    ];
  };

  // if (isLoading) return <Loading />;

  const sortedBrands = getSortedBrands();
  const centerIndex = Math.floor(sortedBrands.length / 2);

  return (
    <div className="flex flex-col w-full overflow-x-hidden">
      
      {/* --- HERO CAROUSEL --- */}
      <section className="relative w-full overflow-hidden">
          <Carousel 
            setApi={setApi} 
            opts={{ loop: true }}
            plugins={[
              Autoplay({
                delay: 4000,
                stopOnInteraction: false,
                stopOnFocusIn: true
              })
            ]} 
            className="w-full"
          >
            <CarouselContent className="ml-0">
              {thumbnails.map((banner, index) => (
                <CarouselItem key={index} className="relative w-full pl-0">
                  <div className="relative w-full aspect-[16/9] md:aspect-auto md:h-screen overflow-hidden">
                    {banner.type === "video" ? (
                      <video 
                        src={banner.file_url} 
                        autoPlay loop muted playsInline 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <Image 
                        src={banner.file_url} 
                        alt={banner.title} 
                        fill priority={index === 0} 
                        className="object-cover" 
                      />
                    )}
                    <div className="absolute inset-0 z-20 flex flex-col justify-center text-white px-6 md:px-20 bg-black/20">
                      <div className="container mx-auto">
                        <motion.h1 
                          initial={{ opacity: 0, y: 20 }} 
                          whileInView={{ opacity: 1, y: 0 }} 
                          className="text-2xl sm:text-4xl md:text-7xl font-black mb-2 md:mb-4 leading-none"
                        >
                          {banner.title !== "-" && banner.title}
                        </motion.h1>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="hidden md:block">
              <CarouselPrevious className="absolute left-4 top-1/2 z-30 bg-white/20 hover:bg-white text-black border-none" />
              <CarouselNext className="absolute right-4 top-1/2 z-30 bg-white/20 hover:bg-white text-black border-none" />
            </div>
          </Carousel>
      </section>

      {/* --- EVENT BANNERS GRID --- */}
      <section className="w-full py-12 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 md:grid-rows-2 gap-3 md:gap-4 h-auto md:h-[600px]">
            {eventBanners.filter(e => e.no_urut !== 99).map((event, index) => {
              const gridClasses = [
                "col-span-2 row-span-1 md:row-span-2 h-[250px] md:h-full", 
                "col-span-2 md:col-span-2 md:row-span-1 h-[150px] md:h-full", 
                "col-span-1 md:col-span-1 md:row-span-1 h-[150px] md:h-full", 
                "col-span-1 md:col-span-1 md:row-span-1 h-[150px] md:h-full", 
              ];
              return (
                <div 
                  key={index} 
                  className={`relative overflow-hidden rounded-sm group cursor-pointer transition-all duration-300 ${gridClasses[index % 4]}`}
                >
                  <Image 
                    src={event.file_url} 
                    alt={event.title}
                    fill priority={index < 2}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
              );
            })}
          </div>
          <div className="my-4 overflow-hidden border-y border-neutral-300 dark:border-neutral-800 flex">
            <motion.div
              className="flex whitespace-nowrap"
              animate={{ x: ["0%", "-50%"] }} // Bergerak dari awal ke tengah
              transition={{ 
                duration: 10, // Sesuaikan kecepatan (makin kecil makin cepat)
                repeat: Infinity, 
                ease: "linear" 
              }}
            >
              {/* Kelompok 1 */}
              <div className="flex items-center">
                <span className="font-bold text-4xl md:text-6xl py-4 px-8">ESBEG</span>
                <span className="font-bold text-4xl md:text-6xl py-4 px-8">ESBEG</span>
                <span className="font-bold text-4xl md:text-6xl py-4 px-8">ESBEG</span>
                <span className="font-bold text-4xl md:text-6xl py-4 px-8">ESBEG</span>
              </div>
              
              {/* Kelompok 2 (Duplikat persis agar menyambung) */}
              <div className="flex items-center">
                <span className="font-bold text-4xl md:text-6xl py-4 px-8">ESBEG</span>
                <span className="font-bold text-4xl md:text-6xl py-4 px-8">ESBEG</span>
                <span className="font-bold text-4xl md:text-6xl py-4 px-8">ESBEG</span>
                <span className="font-bold text-4xl md:text-6xl py-4 px-8">ESBEG</span>
              </div>
            </motion.div>
          </div>

          {/* Bagian Deskripsi */}
          <div className="border-b border-t py-2 border-neutral-300 dark:border-neutral-800">
            <p className="text-sm md:text-base bg-neutral-100 dark:bg-neutral-800 p-5 text-center hover:scale-105 duration-300">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
          </div>
        </div>
      </section>

      {/* --- BRAND EXPLORATION --- */}
      <section className="w-full py-12 md:py-24 px-4 md:px-6 bg-black flex flex-col items-center">
        <div className="container">
          <div className="mb-10 md:mb-16 text-center space-y-2">
            <h2 className="text-3xl md:text-4xl text-white tracking-tight">
              Explore <span className="font-bold">Brand Kami</span>
            </h2>
            <p className="text-neutral-400 text-sm md:text-base max-w-md mx-auto">
              Temukan produk terbaik dari brand partners kami.
            </p>
          </div>

          <div className="flex items-center gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-10 md:overflow-visible md:justify-center md:h-[500px] pt-4">
            {sortedBrands.map((brand, index) => {
              const isCenter = index === centerIndex;
              const isNearCenter = Math.abs(index - centerIndex) === 1;

              return (
                <div
                  key={brand.brand_id}
                  ref={isCenter ? esbegRef : null}
                  className={`
                    min-w-[70%] sm:min-w-[65%] md:min-w-0 snap-center h-105 scroll-mx-10
                    relative transition-all duration-700 ease-in-out overflow-hidden bg-neutral-900 shadow-xl group rounded-3xl
                    ${isCenter ? 'scale-105 z-30 shadow-2xl md:flex-[1.5] md:h-full' : 'scale-95 md:flex-1 md:h-[70%] z-10'}
                    ${isNearCenter ? 'md:flex-[1.2] md:h-[85%] md:z-20' : ''}
                    md:hover:h-full! md:hover:scale-100! md:hover:z-40 md:hover:flex-[1.8]
                  `}
                >
                  <div className="absolute inset-0 z-0">
                    <Image
                      src={`${process.env.NEXT_PUBLIC_STORAGE_URL}/storage/${brand.image_background}`}
                      alt={brand.name}
                      fill className="object-cover opacity-70 transition-transform duration-700 group-hover:scale-110"
                      sizes="(max-width: 768px) 70vw, 25vw"
                    />
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20">
                    <div className={`relative w-full h-[35%] transition-all duration-700 ${isCenter ? 'scale-125' : 'scale-100'} group-hover:scale-110`}>
                      <Image
                        src={brand.image_logo ? `${process.env.NEXT_PUBLIC_STORAGE_URL}/storage/${brand.image_logo}` : "/placeholder.jpg"}
                        alt={brand.name} fill className="object-contain drop-shadow-2xl"
                      />
                    </div>
                    <p className="mt-8 text-white text-[10px] md:text-[11px] font-bold uppercase tracking-[0.4em]">
                      {brand.name}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* --- PRODUCT CATALOG --- */}
      <section className="container mx-auto py-24 px-6">
        <div className="flex flex-col md:flex-row justify-between items-start mb-16">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-primary" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">
              <span className="font-light">Top</span> Products
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-12">
          <AnimatePresence mode="popLayout">
            {products.map((product) => (
              <ProductCard
                key={product.product_id}
                product={product}
                formatCurrency={formatCurrency}
                onQuickAdd={setSelectedProduct}
              />
            ))}
          </AnimatePresence>
        </div>

        <div className="mt-20 flex justify-center">
          <Link href="/product">
            <Button variant="outline" className="h-12 px-8 rounded-lg group transition-all duration-500 hover:bg-black hover:text-white">
              <span className="text-[10px] font-bold uppercase tracking-wide">Lihat Lebih Banyak</span>
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </section>

      <section className="relative bg-neutral-950 py-24 md:py-32 overflow-hidden">
        {/* Ornamen latar belakang (Subtle Glow) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="container relative z-10 mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Badge Kecil di Atas */}
            <motion.span 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="inline-block px-4 py-1.5 rounded-full border border-neutral-800 bg-neutral-900/50 text-neutral-400 text-[10px] font-bold uppercase tracking-[0.3em]"
            >
              Exclusive Benefits
            </motion.span>

            {/* Judul Utama */}
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight"
            >
              Dapatkan pengalaman belanja <br className="hidden md:block" />
              <span className="text-neutral-500">lebih baik dengan akun</span>{" "}
              <span className="relative inline-block">
                ESBEG
                <span className="absolute -bottom-2 left-0 w-full h-1 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
              </span>
            </motion.h2>

            {/* Deskripsi Tambahan (Opsional namun mempercantik komposisi) */}
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-neutral-400 text-sm md:text-lg max-w-2xl mx-auto leading-relaxed"
            >
              Nikmati akses lebih lengkap , <b>Diskon</b> & <b>voucher</b> eksklusif sekarang juga.
            </motion.p>

            {/* Tombol Call to Action */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="pt-6"
            >
              <Link href="/register">
                <Button className="h-14 px-10 rounded-full text-sm font-bold uppercase tracking-widest bg-white text-black hover:bg-primary hover:text-white transition-all duration-300">
                  Daftar Sekarang
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      <CartModal 
        product={selectedProduct as any} 
        isOpen={!!selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
      />
    </div>
  );
}