import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button'; // Sesuaikan path button Anda

// Gunakan interface Product yang sudah kita buat sebelumnya
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

interface ProductCardProps {
  product: Product;
  formatCurrency: (value: number) => string;
  onQuickAdd: (product: Product) => void;
}

const ProductCard = ({ product, formatCurrency, onQuickAdd }: ProductCardProps) => {
  const discountPercentage = product.compare_at_price > product.price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  return (
    <motion.div
      layout
      key={`${product.slug}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="group"
    >
      {/* IMAGE CONTAINER */}
      <div className="relative aspect-3/4 overflow-hidden rounded-lg bg-[#f5f5f5] mb-4">
        {product.tag && (
          <div className="absolute top-3 left-3 z-10">
            <span className="bg-white px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-black shadow-sm">
              {product.tag}
            </span>
          </div>
        )}

        <Link
          href={`/product/${product.slug}`}
          className="relative block aspect-3/4 overflow-hidden group"
        >
          <Image
            src={`${process.env.NEXT_PUBLIC_STORAGE_URL}${product?.primary_image?.image_url}`}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
            className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/+F9PQAI8AKpTiazrwAAAABJRU5ErkJggg=="
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
        </Link>

        {/* QUICK ADD BUTTON (DESKTOP ONLY) */}
        <div className="hidden lg:block absolute bottom-4 inset-x-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-in-out">
          <Button
            onClick={(e) => {
              e.preventDefault();
              onQuickAdd(product);
            }}
            className="w-full bg-white text-black hover:bg-black hover:text-white transition-colors duration-300 rounded-lg h-12 text-[10px] font-bold uppercase tracking-[0.2em] border-none shadow-xl"
          >
            Quick Add +
          </Button>
        </div>
      </div>

      {/* PRODUCT INFO */}
      <div className="space-y-2 px-1">
        <Link href={`/product/${product.slug}`} className="block group/text">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 my-2">
              <div className="px-2 bg-black text-white dark:bg-white dark:text-black rounded text-[11px] md:text-sm font-bold tracking-wide uppercase whitespace-nowrap">
                {product.brand.name}
              </div>
              <p className="text-[10px] text-neutral-400 dark:text-neutral-500 tracking-widest uppercase font-bold ring-1 ring-neutral-200 dark:ring-neutral-800 py-0.5 px-2 rounded whitespace-nowrap">
                {product.brand.category.name}
              </p>
            </div>

            <h3 className="text-sm font-bold tracking-wide uppercase leading-tight line-clamp-2 dark:text-white group-hover:text-neutral-600">
              {product.name}
            </h3>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {product.compare_at_price > product.price && (
                <>
                  <p className="text-xs font-bold text-neutral-300 dark:text-neutral-600 line-through">
                    {formatCurrency(product.compare_at_price)}
                  </p>
                  <div className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-black rounded-sm">
                    -{discountPercentage}%
                  </div>
                </>
              )}
              <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                {formatCurrency(product.price)}
              </p>
            </div>

            {product.sold_count > 0 && (
              <div className="flex items-center gap-1 text-neutral-500">
                <span className="text-xs">{product.sold_count}</span>
                <span className="text-xs">Terjual</span>
              </div>
            )}
          </div>
        </Link>

        {/* BUTTON BELI (MOBILE ONLY) */}
        <div className="lg:hidden pt-2">
          <Button
            onClick={(e) => {
              e.preventDefault();
              onQuickAdd(product);
            }}
            className="w-full bg-black text-white dark:bg-neutral-800 dark:text-white active:bg-neutral-800 h-10 text-[10px] font-bold uppercase tracking-[0.2em] border-none"
          >
            Beli
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;