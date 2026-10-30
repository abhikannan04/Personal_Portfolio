import { useEffect, useState } from "react";

// Subscribe to a CSS media query, e.g. useMediaQuery("(max-width: 500px)").
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handleChange = (event) => setMatches(event.matches);

    setMatches(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [query]);

  return matches;
};

// True while the referenced element is (nearly) on screen. Used to pause
// WebGL render loops that are scrolled out of view.
export const useInView = (ref, rootMargin = "200px") => {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin }
    );
    observer.observe(element);

    return () => observer.disconnect();
  }, [ref, rootMargin]);

  return inView;
};

// Becomes true the first time the element comes within `rootMargin` of the
// viewport (or after `idleDelay` ms) and stays true. Used to defer heavy 3D
// scenes, and their downloads, until the visitor is about to see them.
export const useNearViewport = (ref, rootMargin = "600px", idleDelay = null) => {
  const [near, setNear] = useState(false);

  // Optionally start anyway after `idleDelay` ms, so big assets download in
  // the background before the visitor reaches them.
  useEffect(() => {
    if (idleDelay == null || near) return undefined;
    const id = setTimeout(() => setNear(true), idleDelay);
    return () => clearTimeout(id);
  }, [idleDelay, near]);

  useEffect(() => {
    const element = ref.current;
    if (!element || near) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    observer.observe(element);

    return () => observer.disconnect();
  }, [ref, rootMargin, near]);

  return near;
};

// Window-wide pointer position normalised to [-1, 1] on both axes. A single
// shared object is mutated in place so useFrame loops can read it for free.
export const windowPointer = { x: 0, y: 0 };

if (typeof window !== "undefined") {
  window.addEventListener(
    "pointermove",
    (event) => {
      windowPointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      windowPointer.y = -((event.clientY / window.innerHeight) * 2 - 1);
    },
    { passive: true }
  );
}

// Cheap one-off WebGL capability check so the site degrades gracefully.
export const isWebGLAvailable = (() => {
  let cached;
  return () => {
    if (cached !== undefined) return cached;
    try {
      const canvas = document.createElement("canvas");
      cached = !!(
        window.WebGLRenderingContext &&
        (canvas.getContext("webgl2") || canvas.getContext("webgl"))
      );
    } catch (error) {
      cached = false;
    }
    return cached;
  };
})();
