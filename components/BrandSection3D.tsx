"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, useMotionValue, useSpring, animate } from "framer-motion";
import { Loader2 } from "lucide-react";

export function BrandSection3D({ brands, isLoading }: any) {
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  const sortedBrands = useMemo(() => {
    if (!brands || brands.length === 0) return [];
    const otherBrands = brands.filter((b: any) => b.name.toLowerCase() !== 'esbeg');
    const esbegBrand = brands.find((b: any) => b.name.toLowerCase() === 'esbeg');
    if (esbegBrand) {
      const middleIndex = Math.floor(otherBrands.length / 2);
      return [...otherBrands.slice(0, middleIndex), esbegBrand, ...otherBrands.slice(middleIndex)];
    }
    return brands;
  }, [brands]);

  const itemCount = sortedBrands.length;
  const anglePerItem = 360 / itemCount;
  const radius = isMobile ? Math.max(160, itemCount * 30) : Math.max(350, itemCount * 55);
  
  const rotationX = useMotionValue(0);
  const smoothRotation = useSpring(rotationX, {
    damping: 35,
    stiffness: 90,
    mass: 1.2,
  });

  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (isDragging || isLoading || itemCount === 0) return;
    const controls = animate(rotationX, rotationX.get() + 360, {
      duration: 40, 
      ease: "linear",
      repeat: Infinity,
    });
    return () => controls.stop();
  }, [isDragging, isLoading, itemCount, rotationX]);

  if (isLoading) return <div className="h-screen bg-black flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>;

  return (
    // PENTING: Hapus 'touch-none' di sini agar scroll halaman tetap jalan
    <section className="w-full bg-black h-[100dvh] overflow-hidden flex flex-col justify-center items-center select-none relative">
      <div className="mb-10 md:mb-16 space-y-2 text-center">
        <h2 className="text-3xl md:text-4xl text-white tracking-tight">
          Explore <span className="font-bold">Brand Kami</span>
        </h2>
        <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto">
          Temukan produk terbaik dari brand partners kami.
        </p>
      </div>

      <div 
        className="relative w-full flex items-center justify-center h-[50vh] md:h-[60vh]" 
        style={{ perspective: isMobile ? "1000px" : "2000px" }}
      >
        <motion.div
          className="relative w-[230px] h-[240px] md:w-[320px] md:h-[460px] cursor-grab active:cursor-grabbing"
          style={{
            transformStyle: "preserve-3d",
            rotateY: smoothRotation,
            // Touch action 'pan-y' memungkinkan user scroll ke bawah/atas 
            // meskipun jarinya menyentuh area kartu.
            touchAction: "pan-y", 
          }}
          onPanStart={() => setIsDragging(true)}
          onPanEnd={(_, info) => {
            setIsDragging(false);
            const velocity = info.velocity.x;
            if (Math.abs(velocity) > 50) {
              animate(rotationX, rotationX.get() + velocity * (isMobile ? 0.05 : 0.12), {
                type: "spring",
                damping: 50,
                stiffness: 100,
              });
            }
          }}
          onPan={(_, info) => {
            // Logika filter: Hanya putar jika user memang menggeser secara horizontal
            // Jika user lebih banyak menggeser vertikal (scroll), jangan update rotationX
            if (Math.abs(info.delta.x) > Math.abs(info.delta.y)) {
               rotationX.set(rotationX.get() + info.delta.x * (isMobile ? 0.1 : 0.18));
            }
          }}
        >
          {sortedBrands.map((brand: any, index: number) => (
            <div
              key={brand.brand_id}
              className="absolute inset-0 bg-neutral-900 overflow-hidden shadow-2xl"
              style={{
                transform: `rotateY(${index * anglePerItem}deg) translateZ(${radius}px)`,
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
              }}
            >
              {brand.image_background && (
                <img 
                  src={`${process.env.NEXT_PUBLIC_STORAGE_URL}/storage/${brand.image_background}`} 
                  className="absolute inset-0 w-full h-full object-cover opacity-20  pointer-events-none" 
                  alt="" 
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 md:p-8 z-20 pointer-events-none">
                <img 
                  src={brand.image_logo ? `${process.env.NEXT_PUBLIC_STORAGE_URL}/storage/${brand.image_logo}` : "/placeholder.jpg"} 
                  className="max-h-[30%] md:max-h-[40%] w-auto object-contain" 
                  alt={brand.name} 
                />
                <p className="mt-4 md:mt-8 text-white text-[8px] md:text-xs font-black uppercase italic tracking-[0.4em] text-center">
                  {brand.name}
                </p>
              </div>
            </div>
          ))}
        </motion.div>
        
        <div className="absolute bottom-[-60px] md:bottom-[-150px] w-[250px] md:w-[800px] h-[100px] md:h-[400px] bg-white/5 blur-[60px] md:blur-[150px] rounded-[100%] pointer-events-none" />
      </div>
    </section>
  );
}

export default BrandSection3D;