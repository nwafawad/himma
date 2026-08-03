"use client";

import { useEffect, useState, useRef, RefObject } from "react";

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  triggerOnce?: boolean;
}

export function useIntersectionObserver<T extends HTMLElement = HTMLDivElement>(
  options: UseIntersectionObserverOptions = {}
): [RefObject<T>, boolean] {
  const { threshold = 0.1, root = null, rootMargin = "0px", triggerOnce = true } = options;
  const targetRef = useRef<T>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = targetRef.current;
    if (!element) return;

    // Fallback if IntersectionObserver is not supported
    if (typeof IntersectionObserver === "undefined") {
      setIsIntersecting(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          if (triggerOnce) {
            observer.unobserve(entry.target);
          }
        } else if (!triggerOnce) {
          setIsIntersecting(false);
        }
      },
      { threshold, root, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, root, rootMargin, triggerOnce]);

  return [targetRef, isIntersecting];
}
