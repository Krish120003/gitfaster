"use client";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function AnimatedName() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className="whitespace-nowrap">
        By <span className="relative">krish.gg</span>
      </span>
      <div
        className={cn(
          "flex flex-col items-center space-y-2 transition-all duration-300 absolute",
          "left-[calc(100%-8ch)] top-6",
          isHovered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
        )}
      >
        <span className="text-muted-foreground">&</span>
        <a
          href="https://arian.gg"
          target="_blank"
          className="hover:underline whitespace-nowrap"
        >
          arian.gg
        </a>
      </div>
    </div>
  );
}
