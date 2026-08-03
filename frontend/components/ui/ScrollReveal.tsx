"use client";

import React from "react";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
}

export default function ScrollReveal({
  children,
  className = "",
  delayMs = 0,
  direction = "up",
}: ScrollRevealProps) {
  const [ref, isVisible] = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1,
    triggerOnce: true,
  });

  const getDirectionClasses = () => {
    switch (direction) {
      case "up":
        return isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0";
      case "down":
        return isVisible ? "translate-y-0 opacity-100" : "-translate-y-6 opacity-0";
      case "left":
        return isVisible ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0";
      case "right":
        return isVisible ? "translate-x-0 opacity-100" : "-translate-x-6 opacity-0";
      case "none":
        return isVisible ? "opacity-100" : "opacity-0";
      default:
        return isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0";
    }
  };

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delayMs}ms` }}
      className={`transition-all duration-700 ease-out transform-gpu ${getDirectionClasses()} ${className}`}
    >
      {children}
    </div>
  );
}
