"use client";

import React, { useState } from "react";

const ZoomImage = ({ src, alt }: { src: string; alt: string }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: any) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left - window.scrollX) / width) * 100;
    const y = ((e.pageY - top - window.scrollY) / height) * 100;
    setMousePos({ x, y });
  };

  return (
    <a 
      href={src} 
      target="_blank" 
      rel="noopener noreferrer"
      className="block w-full h-full"
      // Di desktop, kita cegah buka tab baru jika hanya ingin hover zoom
      // Tapi kalau diklik beneran, dia akan tetap buka tab baru
    >
      <div
        className="relative w-full h-full overflow-hidden cursor-zoom-in"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onMouseMove={handleMouseMove}
      >
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-transform duration-200 ease-out ${
            isHovering ? "md:scale-[2]" : "scale-100"
          }`}
          style={{
            transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
          }}
        />
      </div>
    </a>
  );
};

export default ZoomImage;