"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ChevronLeft, ShoppingCart, ChevronUp, ChevronDown, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";
import { useGlobal } from "@/context/GlobalContext";
import { toast } from "sonner";
import { useCartStore } from "@/store/useCartStore";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import Link from 'next/link';

interface CartItem {
    cart_id: number;
    cart_item_id: number;
    qty: number;
    variant: {
        product: {
            name: string;
            primary_image: {
                image_url: string;
            };
            slug: string;
        };
        color: string;
        size: string;
        price: number;
        stock: number;
    };
}

export default function CartPage() {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const { formatCurrency, setCheckoutItems, confirm } = useGlobal();
    const [selectedCartItems, setSelectedCartItems] = useState<CartItem[]>([]);
    const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    
    // Timer refs untuk per-item debounce (opsional, tapi di sini kita pakai global untuk simplisitas)
    const debounceTimer = useRef<{ [key: number]: NodeJS.Timeout }>({});
    
    const baseUrl = process.env.NEXT_PUBLIC_STORAGE_URL;
    const router = useRouter();
    const { refreshCart, justAddedIds, clearJustAdded } = useCartStore();

    const fetchCartItems = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(`/cart`);
            const items = response.data.items || [];
            setCartItems(items);
        } catch (error) {
            console.error("Error fetching cart items:", error);
            toast.error("Gagal mengambil data keranjang");
        } finally {
            setLoading(false);
        }
    };

    // Sinkronisasi Selected Items ketika CartItems berubah (akibat fetch atau update)
    useEffect(() => {
        setSelectedCartItems((prevSelected) =>
            prevSelected.map((selected) => {
                const latestItem = cartItems.find((item) => item.cart_item_id === selected.cart_item_id);
                return latestItem ? { ...selected, qty: latestItem.qty } : selected;
            }).filter(item => cartItems.some(c => c.cart_item_id === item.cart_item_id))
        );
    }, [cartItems]);

    const handleDelete = async (item: CartItem) => {
        confirm({
            title: `Konfirmasi Hapus`,
            description: `Hapus ${item.variant.product.name} dari keranjang?`,
            onConfirm: async () => {
                try {
                    await axiosInstance.delete(`/cart/items/${item.cart_item_id}`);
                    toast.success("Item dihapus");
                    fetchCartItems();
                    refreshCart([], false);
                    // Hapus dari pilihan jika ada
                    setSelectedCartItems(prev => prev.filter(i => i.cart_item_id !== item.cart_item_id));
                } catch (error) {
                    toast.error("Gagal menghapus item");
                }
            }
        });
    };

    const handleCheckboxChange = (item: CartItem) => {
        setSelectedCartItems((prev) =>
            prev.some((p) => p.cart_item_id === item.cart_item_id)
                ? prev.filter((p) => p.cart_item_id !== item.cart_item_id)
                : [...prev, item]
        );
    };

    const totalTerpilih = selectedCartItems.reduce((acc, item) => acc + item.variant.price * item.qty, 0);
    const totalQtyTerpilih = selectedCartItems.reduce((acc, item) => acc + item.qty, 0);

    const handleGoToCheckout = () => {
        if (selectedCartItems.length === 0) {
            toast.error("Pilih minimal satu item");
            return;
        }
        setCheckoutItems(selectedCartItems);
        router.push("/checkout");
    };

    const handleDeleteSelected = async () => {
        confirm({
            title: "Hapus Terpilih",
            description: `Apakah Anda yakin ingin menghapus ${selectedCartItems.length} item?`,
            onConfirm: async () => {
                try {
                    const deletePromises = selectedCartItems.map(item => 
                        axiosInstance.delete(`/cart/items/${item.cart_item_id}`)
                    );
                    await Promise.all(deletePromises);
                    toast.success(`Berhasil menghapus ${selectedCartItems.length} Item`, { position: "top-center" });
                    setSelectedCartItems([]);
                    fetchCartItems();
                    refreshCart([], false);
                } catch (error) {
                    toast.error("Gagal menghapus beberapa item");
                }
            }
        });
    };

    const handleUpdateQty = (item: CartItem, newQty: number) => {
        if (newQty < 1 || newQty > item.variant.stock) {
            if (newQty > item.variant.stock) toast.error("Stok tidak mencukupi");
            return;
        }
        setIsUpdating(true);

        // 1. Optimistic Update UI
        setCartItems(prev => 
            prev.map(i => i.cart_item_id === item.cart_item_id ? { ...i, qty: newQty } : i)
        );

        // 2. Debounce API Call
        if (debounceTimer.current[item.cart_item_id]) {
            clearTimeout(debounceTimer.current[item.cart_item_id]);
        }

        debounceTimer.current[item.cart_item_id] = setTimeout(async () => {
            try {
                setIsUpdating(true);
                await axiosInstance.put(`/cart/items/${item.cart_item_id}`, { qty: newQty });
                refreshCart(); // Update badge navbar
            } catch (error: any) {
                toast.error("Gagal sinkronisasi ke server");
                fetchCartItems(); // Revert ke data server jika gagal
            } finally {
                setIsUpdating(false);
            }
        }, 800); // 800ms lebih snappy daripada 2s
    };

    // Cleanup timers
    useEffect(() => {
        return () => {
            Object.values(debounceTimer.current).forEach(clearTimeout);
        };
    }, []);

    useEffect(() => { fetchCartItems(); }, []);

    // Logic auto-check item baru
    useEffect(() => {
        if (cartItems.length > 0 && justAddedIds.length > 0) {
            const newlyAdded = cartItems.filter(item => justAddedIds.includes(item.cart_item_id));
            if (newlyAdded.length > 0) {
                setSelectedCartItems(prev => {
                    const existingIds = new Set(prev.map(p => p.cart_item_id));
                    const filterUnique = newlyAdded.filter(newItem => !existingIds.has(newItem.cart_item_id));
                    return [...prev, ...filterUnique];
                });
                clearJustAdded();
            }
        }
    }, [cartItems, justAddedIds, clearJustAdded]);

    return (
        <div className="container mx-auto py-6 px-4 md:py-12 md:px-6 mb-32 md:mb-0">
            {/* Header */}
            <div className="flex flex-col gap-2 mb-8 mt-4 md:mt-0">
                <Button variant="ghost" className="w-fit p-0 hover:bg-transparent gap-2 text-neutral-500" onClick={() => router.back()}>
                    <ChevronLeft className="w-4 h-4" /> Kembali
                </Button>
                <h1 className="text-2xl md:text-4xl font-bold tracking-tighter">Keranjang</h1>
                <p className="text-neutral-500 text-sm">Total {cartItems.length} jenis item di keranjang Anda.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LIST ITEM (Kiri) */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between p-2">
                        {!loading && cartItems.length > 0 && (
                            <div className="flex flex-row gap-5">
                                <Button 
                                    variant="link" 
                                    className="p-0 h-auto text-xs font-bold uppercase tracking-widest"
                                    onClick={() => setSelectedCartItems(selectedCartItems.length === cartItems.length ? [] : [...cartItems])}
                                >
                                    {selectedCartItems.length === cartItems.length ? <><X className="w-3 h-3 mr-1"/>Batal</> : "Pilih Semua"}
                                </Button>
                                {selectedCartItems.length > 0 && (
                                    <Button 
                                        variant="link" 
                                        className="p-0 h-auto text-xs font-bold uppercase tracking-widest text-red-500"
                                        onClick={handleDeleteSelected}
                                    >
                                        Hapus ({selectedCartItems.length})
                                    </Button>
                                )}
                            </div>
                        )}
                        <AnimatePresence>
                            {selectedCartItems.length > 0 && (
                                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[10px] font-bold text-primary">
                                    {selectedCartItems.length} TERPILIH
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="space-y-3">
                        {loading ? (
                            [1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)
                        ) : cartItems.length > 0 ? (
                            cartItems.map((item) => (
                                <div 
                                    key={item.cart_item_id} 
                                    className={`relative group flex items-center gap-3 md:gap-6 bg-neutral-50 dark:bg-neutral-900 border p-3 md:p-4 rounded-2xl transition-all ${selectedCartItems.some(s => s.cart_item_id === item.cart_item_id) ? "border-primary ring-1 ring-primary/10" : "border-neutral-100 dark:border-neutral-800"}`}
                                >
                                    {/* Checkbox Custom */}
                                    <div className="relative shrink-0 flex items-center justify-center ml-1">
                                        <input
                                            type="checkbox"
                                            className="peer h-5 w-5 appearance-none rounded-md border border-neutral-300 checked:bg-black dark:checked:bg-white transition-all cursor-pointer"
                                            checked={selectedCartItems.some(s => s.cart_item_id === item.cart_item_id)}
                                            onChange={() => handleCheckboxChange(item)}
                                        />
                                        <svg className="absolute h-3.5 w-3.5 pointer-events-none hidden peer-checked:block text-white dark:text-black" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    </div>

                                    {/* Image */}
                                    <div className="w-20 h-24 md:w-28 md:h-36 shrink-0 overflow-hidden rounded-lg bg-neutral-200">
                                        <Link href={`/product/${item.variant.product.slug}`}>
                                            <img 
                                                className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                                                src={item.variant.product.primary_image?.image_url ? `${baseUrl}${item.variant.product.primary_image.image_url}` : "/placeholder.jpg"} 
                                                alt={item.variant.product.name} 
                                            />
                                        </Link>
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-between h-24 md:h-36">
                                        <div>
                                            <Link href={`/product/${item.variant.product.slug}`}>
                                                <h2 className="text-sm md:text-lg font-bold truncate pr-8 hover:text-primary transition-colors">{item.variant.product.name}</h2>
                                            </Link>
                                            <p className="text-[10px] md:text-sm text-neutral-500 uppercase tracking-tight">{item.variant.color} • SIZE {item.variant.size}</p>
                                        </div>

                                        <div className="flex justify-between items-end">
                                            <div className="flex items-center border rounded-full p-1 bg-white dark:bg-black">
                                                <Button variant="ghost" size="icon" className="h-6 w-6 md:h-8 md:w-8 rounded-full" onClick={() => handleUpdateQty(item, item.qty - 1)} disabled={item.qty <= 1}><Minus className="h-3 w-3" /></Button>
                                                <span className="w-8 md:w-10 text-center text-xs md:text-sm font-bold">{item.qty}</span>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 md:h-8 md:w-8 rounded-full" onClick={() => handleUpdateQty(item, item.qty + 1)} disabled={item.qty >= item.variant.stock}><Plus className="h-3 w-3" /></Button>
                                            </div>
                                            <p className="text-sm md:text-xl font-black">{formatCurrency(item.variant.price)}</p>
                                        </div>
                                    </div>

                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="absolute top-2 right-2 h-8 w-8 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                                        onClick={() => handleDelete(item)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 flex flex-col items-center text-center">
                                <div className="bg-neutral-100 dark:bg-neutral-800 p-8 rounded-full mb-6">
                                    <ShoppingCart className="w-12 h-12 text-neutral-400" />
                                </div>
                                <h2 className="text-2xl font-bold mb-2">Keranjang Kosong</h2>
                                <p className="text-neutral-500 mb-8 max-w-xs">Belum ada barang di sini. Yuk, mulai belanja sekarang!</p>
                                <Button onClick={() => router.push('/product')} className="rounded-full px-8">Mulai Belanja</Button>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* RINGKASAN (Desktop) */}
                <div className="hidden lg:block lg:col-span-1">
                    <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 sticky top-24">
                        <h2 className="text-xl font-bold mb-6">Ringkasan Belanja</h2>
                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-neutral-500">Subtotal ({totalQtyTerpilih} barang)</span>
                                <span className="font-medium">{formatCurrency(totalTerpilih)}</span>
                            </div>
                            <div className="border-t border-dashed pt-4 flex justify-between items-center">
                                <span className="font-bold">Total Bayar</span>
                                <span className="text-2xl font-black text-primary">{formatCurrency(totalTerpilih)}</span>
                            </div>
                        </div>
                        <Button onClick={handleGoToCheckout} disabled={selectedCartItems.length === 0 || isUpdating === true} className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20">
                            {isUpdating && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                            Checkout Sekarang
                        </Button>
                    </div>
                </div>

                {/* Mobile Bottom Sheet */}
                <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
                    <AnimatePresence>
                        {isSummaryExpanded && (
                            <motion.div 
                                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                                className="bg-white dark:bg-neutral-900 border-t rounded-t-[2.5rem] p-6 pb-32 shadow-2xl"
                            >
                                <div className="w-12 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full mx-auto mb-6" onClick={() => setIsSummaryExpanded(false)} />
                                <div className="space-y-4">
                                    <div className="flex justify-between text-sm text-neutral-500">
                                        <span>Total Barang</span>
                                        <span>{totalQtyTerpilih}x</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-neutral-500">
                                        <span>Pengiriman</span>
                                        <span className="text-green-600 font-bold">GRATIS</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="bg-white dark:bg-neutral-950 border-t px-6 py-4 flex items-center justify-between gap-4">
                        <div className="flex flex-col" onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-neutral-500 uppercase">
                                Total {isSummaryExpanded ? <ChevronDown className="w-3 h-3"/> : <ChevronUp className="w-3 h-3"/>}
                            </div>
                            <div className="text-lg font-black">{formatCurrency(totalTerpilih)}</div>
                        </div>
                        <Button 
                            onClick={handleGoToCheckout} 
                            disabled={selectedCartItems.length === 0} 
                            className="flex-1 h-12 rounded-xl font-bold"
                        >
                            Checkout ({selectedCartItems.length})
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}