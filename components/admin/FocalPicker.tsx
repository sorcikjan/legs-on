"use client";

import { useState } from "react";

/** Kliknutím do fotky se nastaví bod zájmu: kolem něj se dělají výřezy (16:9 pro Google Discover, čtverec…). */
export function FocalPicker({ src, x, y }: { src: string; x: number | null; y: number | null }) {
  const [point, setPoint] = useState({ x: x ?? 0.5, y: y ?? 0.5 });
  return (
    <div>
      <div
        className="relative cursor-crosshair select-none"
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setPoint({ x: Math.round(((e.clientX - r.left) / r.width) * 100) / 100, y: Math.round(((e.clientY - r.top) / r.height) * 100) / 100 });
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="block h-auto w-full" draggable={false} />
        <span
          className="pointer-events-none absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_2px_#121212]"
          style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
        />
      </div>
      <input type="hidden" name="focal_x" value={point.x} />
      <input type="hidden" name="focal_y" value={point.y} />
      <p className="m-0 mt-1 text-[13px] text-muted">Klikni na to podstatné na fotce (obličej, kolo). Výřezy se udělají kolem toho bodu.</p>
    </div>
  );
}

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-outline"
      onClick={() => navigator.clipboard.writeText(value).then(() => setCopied(true))}
    >
      {copied ? "Zkopírováno" : "Kopírovat adresu"}
    </button>
  );
}
