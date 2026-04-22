"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Check, ChevronsUpDown, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import axiosInstance from "@/lib/axios"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter
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
import { a, label } from "motion/react-client"
import { time } from "console"

interface DataWilayah {
  kode: string;
  nama: string;
}

interface DataKodePos {
  kode: string;
  kodepos: string;
}

interface AddAddressModalProps {
  onSuccess?: () => void; // Fungsi ini akan memicu getAddress() di page utama
}

export function AddAddressModal({ onSuccess }: AddAddressModalProps) {
  const [open, setOpen] = useState(false)
  
  // State untuk Popover masing-masing level
  const [openProv, setOpenProv] = useState(false)
  const [openKota, setOpenKota] = useState(false)
  const [openKec, setOpenKec] = useState(false)
  const [openKel, setOpenKel] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    address: "",
    province: "",
    city: "",
    district: "",
    village: "",
    postalCode: "",
    receiver_name: "",
    phone: ""
  })

  const [dataWilayah, setDataWilayah] = useState<DataWilayah[]>([]);
  const [dataKodePos, setDataKodePos] = useState<DataKodePos[]>([]);

  useEffect(() => {
      const getShippingArea = async () => {
        try {
          const res = await axiosInstance.get('/shipping/search-area', {
            params: {
              input: 'coblong'
            }
          });
          // if (res.status === 200) {
          //   console.log("SA",res.data);
            
          // }
        } catch (error :any) {
          console.error("Fetch Error:", error.response);
        }
      }
      getShippingArea();
  }, [])

  // Load Data JSON
  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [resWilayah, resKodePos] = await Promise.all([
          fetch('/data/wilayah.json'),
          fetch('/data/kodepos_wilayah.json')
        ]);
        
        if (!resWilayah.ok || !resKodePos.ok) throw new Error("Gagal mengambil data");

        const wilayah = await resWilayah.json();
        const kodepos = await resKodePos.json();
        
        setDataWilayah(wilayah);
        setDataKodePos(kodepos);
      } catch (error) {
        console.error("Fetch Error:", error);
      }
    }
    loadAllData();
  }, [])

  // --- LOGIKA FILTERING (MEMBAGI KODE BERDASARKAN TITIK) ---

  const listProvinsi = useMemo(() => 
    dataWilayah.filter(item => !item.kode.includes('.')), 
    [dataWilayah]
  );

  const listKota = useMemo(() => {
    const prov = listProvinsi.find(p => p.nama === formData.province);
    if (!prov) return [];
    return dataWilayah.filter(item => 
      item.kode.startsWith(prov.kode + '.') && item.kode.split('.').length === 2
    );
  }, [formData.province, listProvinsi, dataWilayah]);

  const listKecamatan = useMemo(() => {
    const kota = listKota.find(k => k.nama === formData.city);
    if (!kota) return [];
    return dataWilayah.filter(item => 
      item.kode.startsWith(kota.kode + '.') && item.kode.split('.').length === 3
    );
  }, [formData.city, listKota, dataWilayah]);

  const listKelurahan = useMemo(() => {
    const kec = listKecamatan.find(k => k.nama === formData.district);
    if (!kec) return [];
    return dataWilayah.filter(item => 
      item.kode.startsWith(kec.kode + '.') && item.kode.split('.').length === 4
    );
  }, [formData.district, listKecamatan, dataWilayah]);

  // --- HANDLER KHUSUS KELURAHAN (AUTO-FILL KODE POS) ---
  const handleKelurahanSelect = (namaKelurahan: string) => {
    const selectedKel = listKelurahan.find(k => k.nama === namaKelurahan);
    if (selectedKel) {
      const foundPos = dataKodePos.find(kp => kp.kode === selectedKel.kode);
      setFormData(prev => ({
        ...prev,
        village: namaKelurahan,
        postalCode: foundPos ? foundPos.kodepos : ""
      }));
    }
  };

  const handleSubmit = async () => { // Tambahkan async
    try {
      const finalData = {
        address_line: formData.address,
        province: formData.province,
        city: formData.city,
        district: formData.district,
        subdistrict: formData.village,
        postal_code: formData.postalCode,
        phone:  formData.phone,
        label: formData.title,
        receiver_name: formData.receiver_name
      }
      const response = await axiosInstance.post('/addresses', finalData); // Tambahkan await
      setOpen(false); 
      if (onSuccess) {
        onSuccess();
        toast.success("Berhasil Tambah Alamat", { position: "top-center",className: "mt-15" });
      }
    } catch (error: any) {
      // Logika untuk mendeteksi isi error 422
      if (error.response && error.response.status === 422) {
        console.error("Validasi Gagal (422):", error.response.data.errors);
        // Tips: Biasanya Laravel/Express mengirim detail di error.response.data.errors
        alert("Cek kembali data Anda: " + JSON.stringify(error.response.data.errors));
      } else {
        console.error("Error Lainnya:", error.message);
      }
    }
  }

  // --- SUB-COMPONENT COMBOBOX ---
  const WilayahSelect = ({ 
    label, value, onSelect, items, placeholder, disabled, openState, setOpenState 
  }: any) => (
    <div className="grid gap-2">
      <Label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">{label}</Label>
      <Popover open={openState} onOpenChange={setOpenState}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            role="combobox" 
            disabled={disabled}
            className={cn(
              "w-full justify-between rounded-xl font-normal border-neutral-200 h-11",
              !value && "text-muted-foreground"
            )}
          >
            <span className="truncate">{value || placeholder}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-70 p-0 shadow-lg border-neutral-200" align="start">
          <Command>
            <CommandInput placeholder={`Cari ${label}...`} className="h-10" />
            <CommandList className="max-h-62.5">
              <CommandEmpty>Data tidak ditemukan.</CommandEmpty>
              <CommandGroup>
                {items.map((item: DataWilayah) => (
                  <CommandItem
                    key={item.kode}
                    value={item.nama}
                    onSelect={() => {
                      onSelect(item.nama)
                      setOpenState(false)
                    }}
                    className="cursor-pointer"
                  >
                    <Check className={cn("mr-2 h-4 w-4", value === item.nama ? "opacity-100" : "opacity-0")} />
                    {item.nama}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-xs font-bold hover:underline flex items-center gap-1">
          <MapPin size={12} /> Tambah
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-162.5 rounded-2xl overflow-hidden p-0">
        <div className="p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="font-bold text-2xl text-left">Tambah Alamat Baru</DialogTitle>
            <DialogDescription className="sr-only">
              Lengkapi formulir di bawah ini untuk menambahkan detail alamat pengiriman baru Anda.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5">
            {/* Nama Alamat */}
            <div className="grid gap-2">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Nama Alamat</Label>
              <Input 
                placeholder="Contoh: Rumah Utama, Kantor, Apartemen" 
                className="rounded-xl border-neutral-200 h-11 focus-visible:ring-black"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Nama Lengkap Penerima</Label>
              <Input 
                className="rounded-xl border-neutral-200 h-11 focus-visible:ring-black"
                value={formData.receiver_name}
                onChange={(e) => setFormData({...formData, receiver_name: e.target.value})}
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">No. Telepon</Label>
              <Input 
                id="form-phone"
                type="tel" 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="+62 899 9999 999" 
                className="rounded-xl border-neutral-200 h-11 focus-visible:ring-black"
              />

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
              <WilayahSelect 
                label="Provinsi" 
                value={formData.province} 
                items={listProvinsi} 
                placeholder="Pilih Provinsi"
                openState={openProv} setOpenState={setOpenProv}
                onSelect={(val: string) => setFormData({...formData, province: val, city: "", district: "", village: "", postalCode: ""})}
              />

              <WilayahSelect 
                label="Kota / Kabupaten" 
                value={formData.city} 
                items={listKota} 
                placeholder="Pilih Kota"
                disabled={!formData.province}
                openState={openKota} setOpenState={setOpenKota}
                onSelect={(val: string) => setFormData({...formData, city: val, district: "", village: "", postalCode: ""})}
              />

              <WilayahSelect 
                label="Kecamatan" 
                value={formData.district} 
                items={listKecamatan} 
                placeholder="Pilih Kecamatan"
                disabled={!formData.city}
                openState={openKec} setOpenState={setOpenKec}
                onSelect={(val: string) => setFormData({...formData, district: val, village: "", postalCode: ""})}
              />

              <WilayahSelect 
                label="Kelurahan / Desa" 
                value={formData.village} 
                items={listKelurahan} 
                placeholder="Pilih Kelurahan"
                disabled={!formData.district}
                openState={openKel} setOpenState={setOpenKel}
                onSelect={handleKelurahanSelect}
              />

              <div className="grid gap-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Kode Pos</Label>
                <Input 
                  placeholder="12345" 
                  className="rounded-xl border-neutral-200 h-11 bg-neutral-50/50"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({...formData, postalCode: e.target.value})}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Alamat Lengkap</Label>
              <Textarea 
                placeholder="Tuliskan nama jalan, blok, nomor rumah, atau patokan..." 
                className="rounded-xl border-neutral-200 min-h-25 focus-visible:ring-black resize-none"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value.slice(0, 400)})}
                maxLength={250}
              />
              <span className="text-xs text-neutral-400 mx-2">{formData.address.length}/250</span>
            </div>
          </div>
        </div>
        <div className="div">

        </div>

        <div className="bg-neutral-50 dark:bg-neutral-900 p-6 flex justify-end">
          <Button 
            onClick={handleSubmit} 
            className="w-full rounded-full bg-black text-white hover:bg-neutral-800 font-bold h-12 transition-all"
          >
            Simpan Alamat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}