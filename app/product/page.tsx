'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { SearchIcon, Check, ChevronsUpDown, X } from "lucide-react";
import axiosInstance from '@/lib/axios';
import { useGlobal } from '@/context/GlobalContext';
import { cn } from "@/lib/utils";
import ProductCard from '@/components/ProductCard';
import { CartModal } from '@/components/CartModal';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import Loading from '@/components/Loading';
import Image from 'next/image';

// --- Interfaces ---
interface Category {
  category_id: number;
  name: string;
}

interface Brand {
  brand_id: number;
  name: string;
}

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
    brand_id: number;
    name: string;
    category: {
      name: string;
      category_id: number;
    };
  }
  sold_count: number;
}

const ProductPage = () => {
  // --- States ---
  const { formatCurrency, globalSearch, setGlobalSearch } = useGlobal();
  const [searchTerm, setSearchTerm] = useState(globalSearch || "");
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Filter States menggunakan ID (null atau 'all' untuk reset)
  const [selectedBrand, setSelectedBrand] = useState<number | "all">("all");
  const [selectedCategory, setSelectedCategory] = useState<number | "all">("all");
  const [sortOrder, setSortOrder] = useState("default");

  // Popover States
  const [openBrand, setOpenBrand] = useState(false);
  const [openCategory, setOpenCategory] = useState(false);
  const [openSort, setOpenSort] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [thumbnail, setThumbnail] = useState(null);

  // --- Fetch Data ---
  const fetchData = async (query = "") => {
    try {
      setIsLoading(true);
      const productEndpoint = query.trim()
        ? `/product/search?q=${encodeURIComponent(query)}`
        : `/product`;

      const [productsRes, brandsRes, categoriesRes] = await Promise.all([
        axiosInstance.get(productEndpoint),
        axiosInstance.get(`/brand`),
        axiosInstance.get(`/category`)
      ]);

      setProducts(productsRes.data.data || productsRes.data || []);
      setBrands(brandsRes.data.data || []);
      setCategories(categoriesRes.data.data || []);
    } catch (error) {
      console.error("Gagal memuat data katalog:", error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setSearchTerm(globalSearch);
    fetchData(globalSearch);
  }, [globalSearch]);

  useEffect(() => {
    const getThumbnail = async () => {
      try {
        const response = await axiosInstance.get('/thumbnail');
        setThumbnail(response.data.data.find((t: any) => t.no_urut === 99));
      } catch (error) {
        console.error('Error fetching thumbnail:', error);
      }
    };
    getThumbnail();
  }, []);

  // --- Logic Filtering & Sorting (Client Side) ---
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products
      .filter((p) => {
        const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        // Murni menggunakan ID
        const matchBrand = selectedBrand === "all" || p.brand.brand_id === selectedBrand;
        const matchCat = selectedCategory === "all" || p.brand.category.category_id === selectedCategory;
        
        return matchSearch && matchBrand && matchCat;
      })
      .sort((a, b) => {
        if (sortOrder === "low") return a.price - b.price;
        if (sortOrder === "high") return b.price - a.price;
        return 0;
      });
  }, [searchTerm, selectedBrand, selectedCategory, sortOrder, products]);

  // --- Reusable Filter Select Component ---
  const FilterSelect = ({ label, value, onSelect, items, openState, setOpenState, selectedId }: any) => (
    <div className="flex flex-col">
      <label className="text-[10px] uppercase font-bold text-neutral-400 mb-1 tracking-wider ml-1">{label}</label>
      <Popover open={openState} onOpenChange={setOpenState}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            role="combobox"
            className="justify-between bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-900 font-semibold text-sm h-auto p-1 px-2 min-w-35 border-none focus:ring-0"
          >
            <span className="truncate">{value}</span>
            <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0 shadow-2xl z-50" align="start">
          <Command>
            <CommandInput placeholder={`Cari ${label}...`} className="h-9" />
            <CommandList>
              <CommandEmpty>Tidak ditemukan.</CommandEmpty>
              <CommandGroup>
                {items.map((item: any) => (
                  <CommandItem
                  key={String(item.id)}
                  value={`${item.id}-${item.name}`}
                  onSelect={() => {
                    onSelect(item.id); 
                    setOpenState(false);
                  }}
                  className="cursor-pointer text-xs"
                >
                  <Check className={cn("mr-2 h-4 w-4", selectedId === item.id ? "opacity-100" : "opacity-0")} />
                  {item.name}
                </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );

  const handleClearSearch = () => {
    setGlobalSearch("");
    setSearchTerm("");
  };

  if (isLoading) return <Loading />;

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 transition-colors">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {thumbnail && (
          <div className="relative w-full h-20 md:h-50 mb-8 overflow-hidden rounded-2xl">
            <Image
              src={`${(thumbnail as any).file_url}`}
              alt="Promotion Banner"
              fill
              priority
              className="object-cover"
            />
          </div>
        )}

        {globalSearch && (
          <div className="flex items-center gap-2 py-4">
            <p className="text-sm text-neutral-500">
              Menampilkan hasil untuk: <span className="font-bold italic text-black dark:text-white">"{globalSearch}"</span>
            </p>
            <button onClick={handleClearSearch} className="text-neutral-400 hover:text-red-500 transition-colors">
              <X size={14} />
            </button>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6 justify-between items-center mb-12 p-4 my-4 shadow-sm rounded-2xl bg-neutral-50 dark:bg-neutral-800 border">
          <div className="relative w-full md:w-1/3">
            {!globalSearch &&
              <InputGroup className='bg-neutral-100'>
                <InputGroupInput
                  placeholder="Cari kata kunci.."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <InputGroupAddon><SearchIcon size={18} /></InputGroupAddon>
              </InputGroup>
            }
          </div>

          <div className="flex flex-nowrap gap-6 w-full md:w-auto items-end overflow-x-auto pb-2">
            {/* FILTER BRAND */}
            <FilterSelect
              label="Brand"
              value={
                selectedBrand === "all"
                  ? "Semua Brand"
                  : brands.find(b => b.brand_id === selectedBrand)?.name || "Semua Brand"
              }
              selectedId={selectedBrand}
              openState={openBrand}
              setOpenState={setOpenBrand}
              items={[{ id: 'all', name: 'Semua Brand' }, ...brands.map(b => ({ id: b.brand_id, name: b.name }))]}
              onSelect={(id: any) => setSelectedBrand(id)}
            />

            {/* FILTER KATEGORI */}
            <FilterSelect
              label="Kategori"
              value={
                selectedCategory === "all"
                  ? "Semua Kategori"
                  : categories.find(c => c.category_id === selectedCategory)?.name || "Semua Kategori"
              }
              selectedId={selectedCategory}
              openState={openCategory}
              setOpenState={setOpenCategory}
              items={[{ id: 'all', name: 'Semua Kategori' }, ...categories.map(c => ({ id: c.category_id, name: c.name }))]}
              onSelect={(id: any) => setSelectedCategory(id)}
            />

            {/* SORTING */}
            <FilterSelect
              label="Urutan"
              value={
                sortOrder === "default" ? "Terbaru" :
                  sortOrder === "low" ? "Harga Terendah" : "Harga Tertinggi"
              }
              selectedId={sortOrder}
              openState={openSort}
              setOpenState={setOpenSort}
              items={[
                { id: 'default', name: 'Terbaru' },
                { id: 'low', name: 'Harga Terendah' },
                { id: 'high', name: 'Harga Tertinggi' }
              ]}
              onSelect={(id: string) => setSortOrder(id)}
            />
          </div>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
            {filteredProducts.map((p) => (
              <ProductCard
                key={p.product_id}
                product={p}
                formatCurrency={formatCurrency}
                onQuickAdd={setSelectedProduct}
              />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center">
            <p className="text-neutral-400 text-lg">Produk tidak ditemukan.</p>
            <button
              onClick={() => {
                handleClearSearch();
                setSelectedBrand("all");
                setSelectedCategory("all");
                setSortOrder("default");
                fetchData();
              }}
              className="mt-4 text-sm font-bold underline uppercase tracking-widest hover:text-red-600 transition-colors"
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>
      <CartModal
        product={selectedProduct as any}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
};

export default ProductPage;