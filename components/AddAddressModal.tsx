"use client"

import React, { useState, useEffect } from "react"
import { ChevronsUpDown, MapPin, Loader2, Navigation } from "lucide-react"
import { cn } from "@/lib/utils"
import axiosInstance from "@/lib/axios"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { s } from "motion/react-client"

// --- INTERFACES ---
interface ShippingArea {
  id: string;
  name: string;
  administrative_division_level_1_name: string;
  administrative_division_level_2_name: string;
  administrative_division_level_3_name: string;
  postal_code: number;
}

interface ShippingStreet {
  display_name: string;
  latitude: number;
  longitude: number;
  label: string;
  subdistrict: string;
  area_info: ShippingArea[];
  province_id: string;
  city_id: string;
  subdistrict_id: string;
  area_id: string;
}

interface AddAddressModalProps {
  onSuccess?: () => void;
}

export function AddAddressModal({ onSuccess }: AddAddressModalProps) {
  const [open, setOpen] = useState(false)
  
  // State Pencarian
  const [searchStreetQuery, setSearchStreetQuery] = useState("");
  const [streetResults, setStreetResults] = useState<ShippingStreet[]>([]);
  const [areaResults, setAreaResults] = useState<ShippingArea[]>([]);
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [openStreetSearch, setOpenStreetSearch] = useState(false);
  const [openAreaSearch, setOpenAreaSearch] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    address: "",
    province: "",
    city: "",
    district: "",
    village: "",
    postalCode: "",
    receiver_name: "",
    phone: "",
    street: "",
    province_id: "",
    city_id: "",
    subdistrict_id: "",
    area_id: "",
    latitude: 0,
    longitude: 0
  })

  // 1. Debounce Effect untuk Cari Jalan
  useEffect(() => {
    if (searchStreetQuery.length < 3) {
      setStreetResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      getShippingStreet(searchStreetQuery);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchStreetQuery]);

  const getShippingStreet = async (input: string) => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get('/shipping/search-street', {
        params: { input }
      });
      const data = res.data.data;
      console.log('street', data);
      
      setStreetResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Street Fetch Error:", error);
      setStreetResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getShippingAreaByCoords = (areaInfo: any) => {
    setIsLoading(true);
    try {
      // Pastikan areaInfo selalu berbentuk array
      const data = Array.isArray(areaInfo) ? areaInfo : [areaInfo];
      console.log('area',data);
      
      setAreaResults(data.filter(Boolean));
      setOpenAreaSearch(true);
    } catch (error) {
      console.error("Area Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectStreet = (street: ShippingStreet) => {
    setFormData(prev => ({ 
      ...prev, 
      street: street.label, 
      address: street.label,
      village: street.subdistrict || "",
      province_id: street.province_id,
      city_id: street.city_id,
      subdistrict_id: street.subdistrict_id,
      area_id: street.area_id,
      latitude: street.latitude,
      longitude: street.longitude
    }));
    setOpenStreetSearch(false);
    getShippingAreaByCoords(street.area_info);
  };

  const handleSelectArea = (area: ShippingArea) => {
    // Fallback ambil nama kelurahan dari string pertama di property name jika village masih kosong
    const fallbackVillage = area.name.split(',')[0].trim();

    setFormData(prev => ({
      ...prev,
      province: area.administrative_division_level_1_name,
      city: area.administrative_division_level_2_name,
      district: area.administrative_division_level_3_name,
      village: prev.village || fallbackVillage, // Prioritaskan data dari street, jika tidak ada pakai fallback
      postalCode: area?.postal_code?.toString() || '0'
    }));
    setOpenAreaSearch(false);
  };

  const handleSubmit = async () => {
   
    try {
      const finalData = {
        address_line: formData.address,
        province: formData.province,
        city: formData.city,
        district: formData.district,
        subdistrict: formData.village,
        postal_code: formData.postalCode,
        phone: formData.phone,
        label: formData.title,
        receiver_name: formData.receiver_name,
        latitude: formData.latitude,
        longitude: formData.longitude,
        province_id: formData.province_id,
        city_id: formData.city_id,
        subdistrict_id: formData.subdistrict_id,
        area_id: formData.area_id
      }  
      

      const res = await axiosInstance.post('/addresses', finalData);
      console.log('res',res);
      
      
      setOpen(false);
      setFormData({
        title: "", address: "", province: "", city: "", 
        district: "", village: "", postalCode: "", 
        receiver_name: "", phone: "", street: "",
        province_id: "", city_id: "", subdistrict_id: "", area_id: "",
        latitude: 0, longitude: 0
      });

      if (onSuccess) {
        onSuccess();
        toast.success("Berhasil Tambah Alamat", { position: "top-center" });
      }
    } catch (error: any) {
      console.error("Submit Error:", error);
      toast.error("Terjadi kesalahan saat menyimpan alamat.");
    }
  }

  useEffect(() => {
    console.log('perubahan formData', formData);
    
  }, [formData]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-xs font-bold hover:underline flex items-center gap-1 transition-all">
          <MapPin size={12} /> Tambah
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-lg md:max-w-xl rounded-2xl p-0 overflow-hidden border-none shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* AREA SCROLLABLE */}
        <div className="p-6 md:p-8 bg-white overflow-y-auto overflow-x-hidden custom-scrollbar">
          <DialogHeader className="mb-6">
            <DialogTitle className="font-bold text-2xl text-left tracking-tight">Tambah Alamat Baru</DialogTitle>
            <DialogDescription className="text-left text-neutral-500">
              Cari nama jalan terlebih dahulu, kemudian pilih kecamatan yang sesuai.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Nama & Penerima */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Label Alamat</Label>
                <Input 
                  placeholder="Rumah / Kantor" 
                  className="rounded-xl h-11"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Nama Penerima</Label>
                <Input 
                  placeholder="Nama Lengkap"
                  className="rounded-xl h-11"
                  value={formData.receiver_name}
                  onChange={(e) => setFormData({...formData, receiver_name: e.target.value})}
                />
              </div>
            </div>

            {/* No Telepon */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">No. Telepon</Label>
              <Input 
                type="tel" 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="08xxxxxxxxxx" 
                className="rounded-xl h-11"
              />
            </div>

            {/* STEP 1: JALAN (TEXT WRAPPING FIXED) */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-black">1. Cari Nama Jalan & Kelurahan</Label>
              <Popover open={openStreetSearch} onOpenChange={setOpenStreetSearch}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-between rounded-xl h-auto min-h-11 py-2.5 font-normal border-neutral-200 hover:bg-neutral-50 px-3 flex items-center"
                  >
                    <span className="text-left text-neutral-700 whitespace-normal leading-snug pr-2">
                      {formData.street || "Ketik nama jalan..."}
                    </span>
                    <Navigation className="h-4 w-4 shrink-0 opacity-40" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 shadow-2xl border-neutral-100" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput placeholder="Cari jalan..." onValueChange={setSearchStreetQuery} className="h-11" />
                    <CommandList>
                      {isLoading && <div className="p-4 text-center text-sm text-neutral-500"><Loader2 className="animate-spin inline mr-2 h-4 w-4" /> Mencari...</div>}
                      <CommandEmpty className="p-4 text-sm text-neutral-500">Jalan tidak ditemukan.</CommandEmpty>
                      <CommandGroup>
                        {streetResults.map((s, i) => (
                          <CommandItem key={`${s.label}-${i}`} onSelect={() => handleSelectStreet(s)} className="cursor-pointer py-3 border-b last:border-none border-neutral-50">
                            <span className="text-sm">{s.label}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* STEP 2: KECAMATAN (TEXT WRAPPING FIXED) */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-black">2. Pilih Kecamatan</Label>
              <Popover open={openAreaSearch} onOpenChange={setOpenAreaSearch}>
                <PopoverTrigger asChild>
                  <Button 
                    disabled={!formData.street}
                    variant="outline" 
                    className={cn(
                      "w-full justify-between rounded-xl h-auto min-h-11 py-2.5 font-normal border-neutral-200 px-3 flex items-center", 
                      !formData.district && "text-muted-foreground"
                    )}
                  >
                    <span className="text-left whitespace-normal leading-snug pr-2">
                      {formData.district 
                        ? `${formData.district}, ${formData.city}, ${formData.province}` 
                        : "Pilih kecamatan setelah cari jalan..."}
                    </span>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-40" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 shadow-2xl border-neutral-100" align="start">
                  <Command>
                    <CommandList className="max-h-60">
                      <CommandGroup>
                        {areaResults.map((area, index) => (
                          <CommandItem 
                            key={`${area.id}-${index}`} 
                            onSelect={() => handleSelectArea(area)}
                            className="cursor-pointer py-3"
                          >
                            <div className="flex flex-col gap-0.5 text-left">
                              <span className="text-sm font-semibold">{area.name}</span>
                              <span className="text-[10px] text-neutral-400 uppercase tracking-tight">
                                {area.administrative_division_level_1_name} • {area.postal_code}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Kode Pos & Textarea */}
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Kode Pos</Label>
                <Input readOnly className="rounded-xl h-11 bg-neutral-50 border-neutral-200 text-neutral-500" value={formData.postalCode} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Detail Alamat (No, RT/RW, Patokan)</Label>
                <Textarea 
                  placeholder="Lengkapi detail alamat Anda..." 
                  className="rounded-xl min-h-[100px] py-3 resize-none border-neutral-200 focus:ring-1 focus:ring-black"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value.slice(0, 250)})}
                />
                <div className="text-[10px] text-right text-neutral-400 uppercase font-bold tracking-widest px-1">
                  {formData.address.length}/250 Karakter
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STICKY FOOTER */}
        <div className="p-6 bg-neutral-50 border-t border-neutral-100 shrink-0">
          <Button 
            onClick={handleSubmit} 
            disabled={!formData.district || !formData.address || !formData.phone}
            className="w-full rounded-full bg-black text-white hover:bg-neutral-800 font-bold h-12 transition-all shadow-lg active:scale-[0.96]"
          >
            Simpan Alamat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}