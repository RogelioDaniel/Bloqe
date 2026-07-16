"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { navigateWithWall } from "@/components/site/brick-transition";

/**
 * Floating "back to top" button that appears after scrolling down.
 * Usa la animación del muro de bloques para volver arriba (mismo efecto
 * que la navegación entre secciones), en vez de un scroll suave.
 */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 1200);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          transition={{ duration: 0.2 }}
          onClick={() => navigateWithWall("#top")}
          className="brick-press group fixed bottom-6 right-6 z-50 flex h-11 w-[3.5rem] items-center justify-center rounded-md bg-signal text-signal-foreground shadow-brick hover:bg-signal-2 transition-colors"
          aria-label="Volver arriba"
        >
          {/* studs del brick */}
          <span
            aria-hidden
            className="absolute -top-[5px] inset-x-0 flex justify-evenly"
          >
            {[0, 1].map((i) => (
              <span
                key={i}
                className="h-2.5 w-2.5 rounded-full bg-signal transition-colors group-hover:bg-signal-2"
                style={{
                  boxShadow:
                    "inset 0 2px 2px rgba(255,255,255,0.4), inset 0 -1px 2px rgba(0,0,0,0.35)",
                }}
              />
            ))}
          </span>
          <ArrowUp className="h-5 w-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
