"use client";

import { Component, type ReactNode } from "react";
import { Boxes } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Error boundary that catches WebGL context-loss crashes and other
 * runtime errors from Three.js scenes, showing a graceful fallback
 * instead of crashing the whole page.
 */
export class SceneErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // Common with WebGL context loss — swallow silently, show fallback.
    if (typeof window !== "undefined") {
      console.warn("3D scene error (likely WebGL context loss):", (error as Error)?.message);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Boxes className="h-7 w-7 text-signal/50" />
              <span className="label-mono text-[0.6rem]">modelo 3D no disponible</span>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
