"use client";
import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ModeToggle } from "./mode-toggle";
import { Button } from "./ui/button";
import { User, ShoppingCart, Search, Package, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCartStore } from "@/store/useCartStore";
import { useGlobal } from "@/context/GlobalContext";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from 'next/navigation';

const Navbar = () => {
  const { user } = useAuth();
  const { cartLength, fetchCartLength, lastAddedTimestamp } = useCartStore();
  const { setGlobalSearch } = useGlobal(); // Ambil fungsi pengubah state global
  const router = useRouter();
  const pathname = usePathname();

  // States Lokal (Agar tidak berat/re-compile terus saat mengetik)
  const [localQuery, setLocalQuery] = useState(""); 
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isSucking, setIsSucking] = useState(false);
  const [cartPos, setCartPos] = useState({ x: 0, y: 0 });
  
  const isInitialMount = useRef(true);
  const cartBtnRef = useRef<HTMLDivElement>(null);

  const NavLinks = [
    { name: "New Arrivals", href: "/" },
    { name: "Product", href: "/product" },
    { name: "About", href: "/about" },
  ];

  // Fungsi Eksekusi Pencarian
  const handleSearch = () => {
    if (localQuery === "") {
        setGlobalSearch("");
      }
    if (localQuery.trim()) {
        
      setGlobalSearch(localQuery); // Kirim ke context
      
      // Jika tidak di halaman produk, arahkan ke sana
      if (pathname !== "/product") {
        router.push("/product");
      }
    }
  };

  // Logika Scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsAtTop(window.scrollY < 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    fetchCartLength();
  }, []);

// Tambahkan fungsi untuk update posisi keranjang secara dinamis
const updateCartPos = () => {
  if (cartBtnRef.current) {
    const rect = cartBtnRef.current.getBoundingClientRect();
    setCartPos({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    });
  }
};

useEffect(() => {
  if (isInitialMount.current) {
    isInitialMount.current = false;
    return;
  }

  if (lastAddedTimestamp) {
    // Gunakan requestAnimationFrame atau setTimeout 0 untuk memastikan DOM siap
    requestAnimationFrame(() => {
      if (cartBtnRef.current) {
        const rect = cartBtnRef.current.getBoundingClientRect();
        
        // Debugging: Cek apakah koordinat tertangkap
        // console.log("Target Pos:", rect.left, rect.top);

        setCartPos({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        });
        
        setIsSucking(true);
        const timer = setTimeout(() => setIsSucking(false), 800);
        return () => clearTimeout(timer);
      }
    });
  }
}, [lastAddedTimestamp]);
  return (
    <nav className="bg-background/80 backdrop-blur-xl sticky top-0 z-50 border-b border-border/40 w-full transition-all duration-500">
      {/* Animasi Sucking Dot */}
      <AnimatePresence>
        {isSucking && (
          <motion.div
            className="fixed w-12 h-12 bg-primary rounded-full z-[100] pointer-events-none shadow-xl shadow-primary/40"
            initial={{ x: "50vw", y: "50vh", scale: 2, opacity: 0 }}
            animate={{ 
              x: cartPos.x - 24, 
              y: cartPos.y - 24, 
              scale: 0.1, 
              opacity: [0, 1, 1, 0] 
            }}
            transition={{ duration: 0.7, ease: [0.6, 0.05, 0.19, 0.91] }}
          />
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 md:px-6">
        {/* BARIS UTAMA */}
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <img src="/assets/logo hitam.png" className="h-5 md:h-6 dark:hidden transition-transform group-hover:scale-105" alt="Logo" />
            <img src="/assets/logo putih.png" className="h-5 md:h-6 hidden dark:block transition-transform group-hover:scale-105" alt="Logo" />
          </Link>

          {/* AREA TENGAH: Desktop */}
          <div className="hidden md:flex flex-1 justify-center max-w-xl px-8">
            <AnimatePresence mode="wait">
              {!isSearchOpen ? (
                <motion.div 
                  key="nav-links"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex gap-8 text-[11px] uppercase tracking-wide font-bold text-foreground/60"
                >
                  {NavLinks.map((link) => (
                    <Link key={link.name} href={link.href} className={cn("hover:text-primary transition-colors", pathname === link.href && "text-primary")}>
                      {link.name}
                    </Link>
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  key="search-desktop"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "100%", opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="flex items-center gap-2 w-full"
                >
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      autoFocus 
                      value={localQuery}
                      onChange={(e) => setLocalQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="Cari produk..." 
                      className="w-full pl-11 pr-10 rounded-full bg-muted/50 border-none h-10 focus-visible:ring-1 focus-visible:ring-primary transition-all" 
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => {
                        setIsSearchOpen(false);
                        setLocalQuery(""); 
                        setGlobalSearch("");
                      }}
                      className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full h-8 w-8 text-muted-foreground"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button onClick={handleSearch} className="rounded-full h-10 px-6 text-[11px] font-black uppercase active:scale-95 transition-all">
                    Cari
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={cn("rounded-full hidden md:flex", isSearchOpen && "bg-muted")}
            >
              <Search className="h-5 w-5" />
            </Button>
            <ModeToggle />
            {user &&
              <Link href="/orders">
                <Button variant="ghost" className="rounded-full px-2 md:px-4 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                </Button>
              </Link>
            }
            <Link href={user ? "/profile" : "/login"}>
              <Button variant="ghost" className="rounded-full px-2 md:px-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                <span className="hidden lg:inline text-sm truncate max-w-25">{user?.username || 'Login'}</span>
              </Button>
            </Link>
            <Link href="/cart">
              <div ref={cartBtnRef} className="relative">
                <motion.div animate={isSucking ? { scale: [1, 1.2, 1] } : {}} transition={{ duration: 0.3, delay: 0.5 }}>
                  <Button variant="default" className="rounded-full h-10 px-4 md:px-5 gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95">
                    <ShoppingCart className="h-4 w-4" />
                    <div className="relative h-4 w-4 flex items-center justify-center">
                      <AnimatePresence mode="popLayout">
                        <motion.span key={cartLength} initial={{ y: -15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 15, opacity: 0 }} className="text-[10px] md:text-xs font-black absolute">
                          {cartLength || 0}
                        </motion.span>
                      </AnimatePresence>
                    </div>
                  </Button>
                </motion.div>
              </div>
            </Link>
          </div>
        </div>

        {/* AREA MOBILE */}
        <AnimatePresence initial={false}>
          {isAtTop && (
            <motion.div 
              key="mobile-nav"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1, marginBottom: 16 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden flex flex-col gap-3 overflow-hidden px-1"
            >
                <div className="relative w-full p-2 flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <Input 
                      value={localQuery}
                      onChange={(e) => setLocalQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="Cari Produk..." 
                      className="w-full pl-10 h-10 rounded-xl bg-muted/60 border-none text-sm focus-visible:ring-1 focus-visible:ring-primary" 
                    />
                  </div>
                  <Button 
                    size="sm"
                    onClick={handleSearch}
                    className="h-10 px-4 rounded-xl text-[10px] font-black uppercase active:scale-95 transition-all"
                  >
                    Cari
                  </Button>
                </div>

              <div className={cn("flex items-center gap-6 overflow-x-auto no-scrollbar py-1 px-2", pathname !== "/" && "pt-2")}>
                {NavLinks.map((link) => (
                  <Link 
                    key={link.name} 
                    href={link.href} 
                    className={cn(
                      "text-[10px] uppercase font-black tracking-wide",
                      pathname === link.href ? "text-primary" : "text-foreground/60"
                    )}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </nav>
  );
};

export default Navbar;