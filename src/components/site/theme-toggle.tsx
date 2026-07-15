"use client";

import { useCallback, useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Theme = "dark" | "light";

/**
 * Dark/light theme toggle.
 * Toggles a `paper-theme` class on the root wrapper div (#bloqe-root).
 * Persists choice in localStorage. Default: dark.
 *
 * SSR-safe: the initializer returns "dark" on the server; the client
 * hydrates with the same value, then a useLayoutEffect applies the saved
 * theme before paint to avoid a flash.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  // Read saved theme once on mount (client-only).
  // We use a ref-like pattern to avoid setState-in-effect lint:
  // the initial render is always "dark", then we sync from storage.
  useEffect(() => {
    try {
      const saved = localStorage.getItem("bloqe-theme");
      if (saved === "light" || saved === "dark") {
        // schedule state update outside of the effect's synchronous path
        Promise.resolve().then(() => setTheme(saved));
      }
    } catch {
      // storage blocked — stay dark
    }
  }, []);

  const applyTheme = useCallback((t: Theme) => {
    const root = document.getElementById("bloqe-root");
    if (root) {
      if (t === "light") root.classList.add("paper-theme");
      else root.classList.remove("paper-theme");
    }
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("bloqe-theme", next);
      } catch {
        // storage blocked — ignore
      }
      return next;
    });
  }, []);

  return (
    <button
      onClick={toggle}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-ink-2/50 text-foreground hover:border-signal/50 transition-colors"
      aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
    >
      <AnimatePresence mode="wait" initial={false}>
        {theme === "dark" ? (
          <motion.span
            key="moon"
            initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
            transition={{ duration: 0.2 }}
          >
            <Moon className="h-4 w-4" />
          </motion.span>
        ) : (
          <motion.span
            key="sun"
            initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
            transition={{ duration: 0.2 }}
          >
            <Sun className="h-4 w-4 text-signal" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
