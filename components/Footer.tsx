import { Facebook, Instagram, Twitter, Linkedin } from "lucide-react";
import Link from "next/link";
const Footer = () => {
  return (
    <footer className="border-t pt-16 pb-8">
      <div className="container mx-auto px-6">
        {/* Top Section: Links & Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Column 1: Customer Service */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-6">Layanan Pelanggan</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="hover:text-black cursor-pointer transition-colors"><Link href="#">Bantuan</Link></li>
              <li className="hover:text-black cursor-pointer transition-colors">Pengembalian Barang & Dana</li>
            </ul>
          </div>

          {/* Column 2: Payment & Shipping */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Payment Methods */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest mb-6">Pembayaran</h4>
                <div className="flex flex-wrap gap-3">
                  {/* Gunakan placeholder box atau logo asli jika ada */}
                  {['https://down-id.img.susercontent.com/file/id-11134258-7rasa-m3elfqc3cpsg90',
                    'https://down-id.img.susercontent.com/file/id-11134258-7rasg-m3elgbu7vvkge8', 
                    'https://down-id.img.susercontent.com/file/id-11134258-7rasc-m3elfssvqtqn58', 
                    'https://down-id.img.susercontent.com/file/id-11134258-7rask-m3elfv3kdsb4ae', 
                    'https://down-id.img.susercontent.com/file/id-11134258-7rasd-m3elh2ewzwnj27', 
                    'https://down-id.img.susercontent.com/file/id-11134258-7rasi-m3elgeem4oo3e8'].map((pay) => (
                    <div key={pay} className="w-12 h-8  rounded flex items-center justify-center text-[10px] font-bold shadow-sm dark:shadow-neutral-800 transition-all p-1">
                      <img src={pay} alt="logo"></img>
                    </div>
                  ))}
                </div>
              </div>
              {/* Shipping Methods */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest mb-6">Pengiriman</h4>
                <div className="flex flex-wrap gap-3">
                  {['https://down-id.img.susercontent.com/file/id-11134258-7rasb-m3elkjsfixy0e0',
                   'https://down-id.img.susercontent.com/file/id-11134258-7rase-m3elkn1irjxb9f', 
                   'https://down-id.img.susercontent.com/file/id-11134258-7rase-m3ell0woh4yg37', 
                   'https://down-id.img.susercontent.com/file/id-11134258-7ra0u-mcugpj7nj6b9b1', 
                   'https://down-id.img.susercontent.com/file/id-11134258-7rasm-m3elk9oyat27a6'].map((ship) => (
                    <div key={ship} className="w-12 h-8  rounded flex items-center justify-center text-[10px] font-bold shadow-sm dark:shadow-neutral-800 transition-all p-1">
                      <img src={ship} alt="logo"></img>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Column 4: Social Media */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-6">Ikuti Kami</h4>
            <div className="flex flex-col gap-4">
              <a href="#" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-black dark:hover:text-white transition-colors">
                <Instagram size={18} /> Instagram
              </a>
              <a href="#" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-black dark:hover:text-white transition-colors">
                <Facebook size={18} /> Facebook
              </a>
              <a href="#" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-black  dark:hover:text-white transition-colors">
                <Twitter size={18} /> Twitter
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section: Copyright */}
        <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            © 2026 ESBEG STORE — DEFINED BY ELEGANCE
          </p>
          <div className="flex gap-6 text-[10px] uppercase tracking-widest text-muted-foreground">
            <span className="cursor-pointer hover:text-black">Kebijakan Privasi</span>
            <span className="cursor-pointer hover:text-black">Syarat & Ketentuan</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;