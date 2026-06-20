"use client";

import { useEffect, useRef } from "react";

interface AdBannerProps {
  adKey: string; // Remplace par ta vraie clé Adsterra (ex: depuis le dashboard, onglet "Get Code")
  width?: number;
  height?: number;
}

export default function AdBanner({ adKey, width = 320, height = 50 }: AdBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (!containerRef.current || loaded.current) return;
    loaded.current = true;

    const optionsScript = document.createElement("script");
    optionsScript.type = "text/javascript";
    optionsScript.innerHTML = `
      atOptions = {
        'key' : '${adKey}',
        'format' : 'iframe',
        'height' : ${height},
        'width' : ${width},
        'params' : {}
      };
    `;

    const invokeScript = document.createElement("script");
    invokeScript.src = `https://www.highperformanceformat.com/${adKey}/invoke.js`;
    invokeScript.type = "text/javascript";

    containerRef.current.appendChild(optionsScript);
    containerRef.current.appendChild(invokeScript);
  }, [adKey, width, height]);

  return (
    <div className="w-full flex justify-center my-4">
      <div ref={containerRef} style={{ width, height }} />
    </div>
  );
}