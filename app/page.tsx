"use client";

import { Button } from "@/components/ui/button";
import React, { useState, useEffect,useRef  } from "react";
import axiosInstance from '@/lib/axios';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CartModal } from "@/components/CartModal"; 
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton"
import Loading from "@/components/Loading";
import BrandSection3D from "@/components/BrandSection3D";
import  ProductCard from "@/components/ProductCard";

import Image from 'next/image';
// --- INTERFACE ---
interface Product {
  product_id: number;
  name: string;
  price: number;
  tag: string | null;
  image: string;
  variants: string[];
  compare_at_price: number;
  is_home: boolean;
  primary_image?: {
    image_url: string;
  };
  slug: string;
  brand: {
    name: string;
    category: {
      name: string;
      category_id: number;
    };
  }
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

interface EventBanner {
  title: string;
  type: string;
  file_url: string;
  button: string;
  subtitle: string;
  description: string;
  isBanner: true;
  no_urut: number;
}

export default function HomePage() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [data,setData] = useState<Product[]>([]);
  const [brands,setBrands] = useState<Brand[]>([]);
  const [thumbnails, setThumbnails] = useState<Thumbnail[]>([]);
  const [eventBanners, setEventBanners] = useState<EventBanner[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Default true
  const esbegRef = useRef<HTMLDivElement | null>(null);


  
  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
  
      // Memanggil semua API secara paralel agar lebih cepat
      const [productRes, brandRes, thumbnailRes] = await Promise.all([
        axiosInstance.get('/product'),
        axiosInstance.get('/brand'),
        axiosInstance.get('/thumbnail') 
      ]);

      setEventBanners(thumbnailRes.data.data.filter((thumbnail: Thumbnail) => thumbnail.is_banner === true));
  
      //filter data product hanya yang is_homenya true
      const filteredData = productRes.data.filter((product: Product) => product.is_home === true);

      setData(filteredData);
      setBrands(brandRes.data.data);
      setThumbnails(thumbnailRes.data.data.filter((thumbnail: Thumbnail) => thumbnail.is_banner === false));
    } catch (error) {
      console.error("Gagal mengambil data:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Jalankan HANYA sekali saat komponen mount
  useEffect(() => {
    fetchInitialData();
  }, []);

    const formatCurrency = (number:number) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(number);
    };

    const [api, setApi] = React.useState<CarouselApi>()

    // Logika Autoplay Manual
    React.useEffect(() => {
      if (!api) return

      const intervalId = setInterval(() => {
        if (api.canScrollNext()) {
          api.scrollNext()
        } else {
          api.scrollTo(0) // Kembali ke awal jika sudah di akhir
        }
      }, 4000) // Geser setiap 4 detik

      return () => clearInterval(intervalId)
    }, [api])

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="flex flex-col w-full overflow-x-hidden">
      {/* --- HERO CAROUSEL --- */}
      <section className="relative w-full overflow-hidden">
      <Carousel opts={{ loop: true }} className="w-full">
        {/* Tambahkan ml-0 atau pl-0 di sini untuk menghilangkan offset default */}
        <CarouselContent className="ml-0"> 
          {thumbnails.map((banner, index) => (
            <CarouselItem 
              key={index} 
              // Tambahkan pl-0 untuk menghilangkan jarak antar slide
              className="relative w-full pl-0" 
            >
              <div className="relative w-full aspect-[16/9] md:aspect-auto md:h-screen overflow-hidden">
                {/* ... sisa kode media (video/img) sama ... */}
                {banner.type === "video" ? (
                  <video 
                    src={banner.file_url} 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <Image 
                    src={banner.file_url} 
                    alt={banner.title} 
                    fill
                    priority={index === 0}
                    className="object-cover" 
                  />
                )}

                {/* ... sisa kode konten teks sama ... */}
                <div className="absolute inset-0 z-20 flex flex-col items-left justify-center text-left text-white px-6 md:px-20">
                  <div className="container mx-auto">
                    <motion.h1 
                      initial={{ opacity: 0, y: 20 }} 
                      whileInView={{ opacity: 1, y: 0 }} 
                      className="text-2xl sm:text-4xl md:text-7xl font-black mb-2 md:mb-4 leading-none"
                    >
                      {banner.title === "-" ? '' : banner.title}
                    </motion.h1>
                    {/* ... dst ... */}
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Navigasi */}
        <div className="hidden md:block">
          <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-white/20 hover:bg-white text-black border-none" />
          <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-white/20 hover:bg-white text-black border-none" />
        </div>
      </Carousel>
    </section>

      <section className="w-full py-12 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          
          {/* GRID LOGIC:
              - Mobile: 2 Kolom (tetap abstract)
              - Desktop: 4 Kolom
          */}
          <div className="grid grid-cols-2 md:grid-cols-4 md:grid-rows-2 gap-3 md:gap-4 h-auto md:h-[600px]">
            
            {eventBanners.map((event, index) => {
              const gridClasses = [
                // Item 1: Besar, makan 2 kolom di mobile & desktop
                "col-span-2 row-span-1 md:row-span-2 h-[250px] md:h-full", 
                
                // Item 2: Lebar di desktop, tapi 1 kolom saja di mobile agar muat
                "col-span-2 md:col-span-2 md:row-span-1 h-[150px] md:h-full", 
                
                // Item 3: Kecil (setengah lebar mobile)
                "col-span-1 md:col-span-1 md:row-span-1 h-[150px] md:h-full", 
                
                // Item 4: Kecil (setengah lebar mobile)
                "col-span-1 md:col-span-1 md:row-span-1 h-[150px] md:h-full", 
              ];
              if (event.no_urut === 99) {
                return;
              }
              return (
                <div 
                  key={index} 
                  className={`relative overflow-hidden rounded-sm group cursor-pointer transition-all duration-300 ${gridClasses[index % 4] || ""}`}
                >
                  <Image 
                    src={event.file_url} 
                    alt={event.title}
                    fill
                    priority={index < 2}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="container-fluid mx-auto py-12 md:py-24 px-4 md:px-6 overflow-hidden w-full bg-black flex justify-center min-h-screen">
        <div className="container">
          {/* Header Section */}
          <div className="mb-10 md:mb-16 space-y-2 text-center">
            <h2 className="text-3xl md:text-4xl text-white tracking-tight">
              Explore <span className="font-bold">Brand Kami</span>
            </h2>
            <p className="text-neutral-400 text-sm md:text-base max-w-md mx-auto">
              Temukan produk terbaik dari brand partners kami.
            </p>
          </div>

          {/* Container: Carousel Mobile & Focus Grid Desktop */}
          <div 
            className="flex items-center gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-10 md:overflow-visible md:justify-center md:gap-4 md:h-[500px] md:pb-0 pt-4"
          >
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="min-w-[80%] md:min-w-0 md:flex-1 h-100 md:h-full overflow-hidden">
                  <Skeleton className="h-full w-full bg-neutral-800" />
                </div>
              ))
            ) : (() => {
              if (!brands || brands.length === 0) return null;

              const otherBrands = brands.filter(b => b.name.toLowerCase() !== 'esbeg');
              const esbegBrand = brands.find(b => b.name.toLowerCase() === 'esbeg');
              
              let sortedBrands = [...brands];
              if (esbegBrand) {
                const middleIndex = Math.floor(otherBrands.length / 2);
                sortedBrands = [
                  ...otherBrands.slice(0, middleIndex),
                  esbegBrand,
                  ...otherBrands.slice(middleIndex)
                ];
              }

              const centerIndex = Math.floor(sortedBrands.length / 2);

              return sortedBrands.map((brand, index) => {
                const isCenter = index === centerIndex;
                const isNearCenter = index === centerIndex - 1 || index === centerIndex + 1;

                return (
                  <div
                    key={brand.brand_id}
                    ref={isCenter ? esbegRef : null}
                    className={`
                      /* Mobile: Card Size */
                      min-w-[70%] sm:min-w-[65%] snap-center h-105 scroll-mx-10
                      
                      /* Desktop: Ukuran Proporsional */
                      md:min-w-0 relative transition-all duration-700 ease-in-out overflow-hidden bg-neutral-900 shadow-xl group
                      
                      /* Spotlight Style (Mobile & Desktop) */
                      ${isCenter 
                        ? 'scale-105 z-30 shadow-2xl md:flex-[1.5] md:h-full' 
                        : 'scale-95 md:flex-1 md:h-[70%] z-10'
                      }
                      
                      /* Near Center (Desktop Only) */
                      ${isNearCenter ? 'md:flex-[1.2] md:h-[85%] md:z-20 ' : ''}
                      
                      /* Hover Effect (Desktop Only) */
                      md:hover:h-full! md:hover:scale-100! md:hover:z-40 md:hover:flex-[1.8]
                      rounded-3xl
                    `}
                  >
                    {/* 1. Background Image Optimized */}
                    <div className="absolute inset-0 z-0">
                      {brand.image_background ? (
                        <Image
                          src={`${process.env.NEXT_PUBLIC_STORAGE_URL}/storage/${brand.image_background}`}
                          alt={`Background ${brand.name}`}
                          fill
                          sizes="(max-width: 768px) 70vw, 25vw"
                          className="object-cover opacity-70 transition-transform duration-700 group-hover:scale-110"
                          priority={isCenter}
                        />
                      ) : (
                        <div className="absolute inset-0 " />
                      )}
                    </div>

                    {/* 2. Gradient Overlay */}
                    <div className="absolute inset-0 opacity-80 z-10" />

                    {/* 3. Content: Logo & Name */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20">
                      <div className={`relative w-full h-[35%] transition-all duration-700 ${isCenter ? 'scale-125' : 'scale-100'}group-hover:scale-110`}>
                        <Image
                          src={brand.image_logo ? `${process.env.NEXT_PUBLIC_STORAGE_URL}/storage/${brand.image_logo}` : "/placeholder.jpg"}
                          alt={`${brand.name} logo`}
                          fill
                          sizes="(max-width: 768px) 40vw, 15vw"
                          className="object-contain drop-shadow-2xl"
                        />
                      </div>
                      
                      <div className={`
                        mt-8 transition-all duration-500
                        ${isCenter ? 'opacity-100' : 'opacity-100 translate-y-4 group-hover:translate-y-0'}
                      `}>
                        <p className="text-white text-[10px] md:text-[11px] font-bold uppercase tracking-[0.4em] whitespace-nowrap">
                          {brand.name}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </section>

      {/* --- SECTION KATALOG --- */}
      <section className="container mx-auto py-24 px-6">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-primary" />
              {/* <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-primary">
                Paling Banyak Di Cari
              </span> */}
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter  leading-none">
               <span className="font-light">Top</span> Products
            </h2>
            <p className="text-muted-foreground text-sm max-w-xs">
              
            </p>
          </div>
        </div>

        {/* PRODUCT GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-12">
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              // Skeleton tetap sama...
              Array.from({ length: 5 }).map((_, i) => (
                <div key={`skeleton-${i}`} className="space-y-4">
                  <div className="relative aspect-3/4 overflow-hidden rounded-sm">
                    <Skeleton className="h-full w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-2/3" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                </div>
              ))
            ) : (
              data && data.map((product) => (
                <ProductCard
                  key={product.product_id}
                  product={product}
                  formatCurrency={formatCurrency}
                  onQuickAdd={setSelectedProduct} // Kirim fungsi setter ke props
                />
              ))
            )}
          </AnimatePresence>
        </div>

        {/* VIEW ALL BUTTON */}
        <div className="mt-20 flex justify-center">
          <Link href="/product">
            <Button 
              variant="outline" 
              className="h-12 px-8 rounded-lg border-neutral-200 dark:border-neutral-800 bg-transparent hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-500 group"
            >
              <span className="text-[10px] font-bold uppercase tracking-wide ml-1">
                Lihat Lebih Banyak
              </span>
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
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