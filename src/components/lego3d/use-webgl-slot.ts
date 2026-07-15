"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Global semaphore that limits the number of simultaneously mounted
 * WebGL contexts on the page. Browsers typically allow ~16 WebGL contexts;
 * we cap lower to leave headroom.
 *
 * Pass `active: true` when you want a slot (e.g. card is in viewport).
 * The slot is released when `active` becomes false or the component unmounts.
 */
const MAX_CONTEXTS = 7;
let activeCount = 0;
const waiters: Array<() => void> = [];

function tryDrain() {
  while (waiters.length > 0 && activeCount < MAX_CONTEXTS) {
    activeCount++;
    const fn = waiters.shift()!;
    fn();
  }
}

export function useWebGLSlot(active: boolean): boolean {
  const [hasSlot, setHasSlot] = useState(false);
  const heldRef = useRef(false);

  useEffect(() => {
    if (active && !heldRef.current) {
      if (activeCount < MAX_CONTEXTS) {
        activeCount++;
        heldRef.current = true;
        setHasSlot(true);
      } else {
        // wait for a slot
        setHasSlot(false);
        const fn = () => {
          if (!heldRef.current) {
            heldRef.current = true;
            setHasSlot(true);
          }
        };
        waiters.push(fn);
        return () => {
          const idx = waiters.indexOf(fn);
          if (idx >= 0) waiters.splice(idx, 1);
        };
      }
    } else if (!active && heldRef.current) {
      // release the slot
      heldRef.current = false;
      setHasSlot(false);
      activeCount = Math.max(0, activeCount - 1);
      tryDrain();
    }
     
  }, [active]);

  // release on unmount
  useEffect(() => {
    return () => {
      if (heldRef.current) {
        heldRef.current = false;
        activeCount = Math.max(0, activeCount - 1);
        tryDrain();
      }
    };
  }, []);

  return active && hasSlot;
}
