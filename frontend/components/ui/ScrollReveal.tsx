"use client";

import React from "react";
import { motion } from "framer-motion";

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
  const getDirectionVariants = () => {
    switch (direction) {
      case "up":
        return { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };
      case "down":
        return { initial: { opacity: 0, y: -16 }, animate: { opacity: 1, y: 0 } };
      case "left":
        return { initial: { opacity: 0, x: 16 }, animate: { opacity: 1, x: 0 } };
      case "right":
        return { initial: { opacity: 0, x: -16 }, animate: { opacity: 1, x: 0 } };
      case "none":
        return { initial: { opacity: 0 }, animate: { opacity: 1 } };
      default:
        return { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };
    }
  };

  const variants = getDirectionVariants();

  return (
    <motion.div
      initial={variants.initial}
      whileInView={variants.animate}
      viewport={{ once: true, margin: "0px 0px -40px 0px" }}
      transition={{ duration: 0.5, delay: delayMs / 1000, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
