import type { Metadata } from "next";
import { Inter } from "next/font/google"; 
import "./globals.css";
import { ShoppingCart, User, Store, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";
import Footer from "@/components/Footer";
import { AuthProvider } from '@/context/AuthContext';
import Navbar from "@/components/Navbar";
import { GlobalProvider } from '@/context/GlobalContext';
import { Toaster } from "@/components/ui/sonner"
import GlobalConfirm from "@/components/modals/GlobalConfirm";
import { GoogleOAuthProvider } from '@react-oauth/google';
import  SupportButton  from "@/components/SupportButton";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Esbeg Store | Premium E-Commerce",
  description: "Experience the new standard of shopping",
  icons: {
    icon: [
      {
        url: '/assets/logo white.png', // Pastikan nama file tidak pakai spasi
        href: '/assets/logo white.png',
      },
    ],
    apple: [
      {
        url: '/assets/logo white.png',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased transition-colors duration-300`}>
        <AuthProvider>
          <GlobalProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            > 
              {/* --- NAVBAR --- */}
              <Navbar />
              

              {/* Menambahkan bg-background pada main agar konsisten dengan tema halaman */}
              <main className="min-h-screen bg-background text-foreground">
              <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
                {children}
              </GoogleOAuthProvider>
              </main>

              {/* Footer Elegan */}
              <Footer />
              <Toaster />
              <GlobalConfirm />
              <SupportButton />
            </ThemeProvider>
          </GlobalProvider>

        </AuthProvider>
      </body>
    </html>
  );
}