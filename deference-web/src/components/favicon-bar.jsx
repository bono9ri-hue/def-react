"use client";

import { useRef } from "react";
import { ChevronRight } from "lucide-react";

export function FaviconBar() {
  const scrollRef = useRef(null);

  const handleWheel = (e) => {
    if (scrollRef.current) {
      e.preventDefault();
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

  const domains = [
    "figma.com", 
    "pinterest.com", 
    "dribbble.com", 
    "behance.net", 
    "layers.to", 
    "mobbin.com", 
    "awwwards.com", 
    "lapa.ninja"
  ];

  return (
    <div className="relative flex items-center justify-center w-full max-w-2xl mx-auto">
      <div 
        ref={scrollRef} 
        onWheel={handleWheel}
        className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar scroll-smooth w-full py-2"
        style={{
          maskImage: "linear-gradient(to right, black 80%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, black 80%, transparent 100%)"
        }}
      >
        {domains.map((domain, index) => (
          <a 
            key={domain} 
            href={`https://${domain}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="relative flex items-center justify-center shrink-0 w-10 h-10 rounded-full bg-white border-2 border-background shadow-xs transition-transform duration-300 ease-out hover:scale-110 hover:z-10 focus:outline-none"
          >
            <img 
              src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`} 
              alt={`${domain} favicon`} 
              className="w-6 h-6 object-contain transition-opacity"
              loading="lazy"
              decoding="async"
            />
          </a>
        ))}
      </div>
      <ChevronRight className="absolute right-[-24px] top-1/2 -translate-y-1/2 w-4 h-4 shrink-0 text-muted-foreground opacity-50 pointer-events-none" />
    </div>
  );
}
