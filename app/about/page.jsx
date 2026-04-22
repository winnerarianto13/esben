"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import axiosInstance from "@/lib/axios";
import Loading from "@/components/Loading";

const OurStoryPage = () => {
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8 }
  };  

  const [data, setData] = useState(null);

  useEffect (() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get('/about');
        setData(response.data.config);
      } catch (error) {
        console.error("Error fetching data:", error);
        return null;
      }
    }
    fetchData();
  },[]);

  if (!data) {
    return <Loading />;
  }
  
  return (
    <div className="bg-white dark:bg-black text-black dark:text-white min-h-screen font-sans">
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 container mx-auto">
        <motion.div 
          initial="initial"
          animate="animate"
          variants={fadeIn}
          className="max-w-4xl"
        >
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter uppercase mb-6">
            {data.about_hero_title} <br />
          </h1>
          <p className="text-lg md:text-xl text-neutral-500 max-w-2xl leading-relaxed">
            {data.about_hero_description}
          </p>
        </motion.div>
      </section>

      {/* Image & Vision Section */}
      <section className="py-20 bg-neutral-50 dark:bg-neutral-900/50">
        <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="aspect-4/5 bg-neutral-200 dark:bg-neutral-800 rounded-3xl overflow-hidden relative group"
          >
            {/* Ganti src dengan gambar editorial brand kamu */}
            <img 
              src={data.about_history_image} 
              alt="About Esbeg" 
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all" />
          </motion.div>

          <div className="space-y-12">
            <div>
              <img src="/assets/logo hitam.png" alt=""  className="w-100"/>
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-[0.3em] text-neutral-400 uppercase">{data.about_history_subtitle}</span>
              <h2 className="text-3xl font-bold mt-4 mb-6 tracking-tight">{data.about_history_title}</h2>
              <p className="text-neutral-500 leading-relaxed whitespace-pre-line">
                {data.about_history_content}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-4xl font-black mb-2">{data.about_stats_1_value}</h3>
                <p className="text-xs text-neutral-400 uppercase tracking-widest font-bold">{data.about_stats_1_label}</p>
              </div>
              <div>
                <h3 className="text-4xl font-black mb-2">{data.about_stats_2_value}</h3>
                <p className="text-xs text-neutral-400 uppercase tracking-widest font-bold">{data.about_stats_2_label}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values - Horizontal Cards */}
      <section className="py-32 container mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-3xl font-bold tracking-tighter uppercase">{data.about_values_title}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { title: data.about_value_1_title, desc: data.about_value_1_description },
            { title: data.about_value_2_title, desc: data.about_value_2_description },
            { title: data.about_value_3_title, desc: data.about_value_3_description },
          ].map((item, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ y: -10 }}
              className="p-8 border border-neutral-100 dark:border-neutral-800 rounded-2xl hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-500"
            >
              <div className="text-xs font-bold mb-4 opacity-50">0{idx + 1}</div>
              <h3 className="text-xl font-bold mb-4 tracking-tight">{item.title}</h3>
              <p className="text-sm leading-relaxed opacity-70">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer Call to Action */}
      <section className="py-32 bg-black text-white text-center">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tighter uppercase mb-10">
            Siap Menemukan <br /> <span className="text-neutral-600">Gaya Anda?</span>
          </h2>
          <Link 
            href="/product" 
            className="inline-flex items-center gap-2 bg-white text-black px-10 py-5 rounded-full font-bold text-sm uppercase tracking-widest hover:scale-105 transition-transform"
          >
            Explore Product <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default OurStoryPage;