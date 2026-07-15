"use client";

interface LogoProps {
  size?: number;
  className?: string;
  withWordmark?: boolean;
}

/** BLOQE mark: a 2×2 grid of LEGO studs in brand colors. */
export function Logo({ size = 28, className, withWordmark = true }: LogoProps) {
  const s = size;
  const r = s * 0.16;
  const colors = ["#e8542a", "#f5b82e", "#1e5aa8", "#2e8b57"];
  const pos = [
    [s * 0.3, s * 0.3],
    [s * 0.7, s * 0.3],
    [s * 0.3, s * 0.7],
    [s * 0.7, s * 0.7],
  ];
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <svg
        width={s}
        height={s}
        viewBox={`0 0 ${s} ${s}`}
        fill="none"
        aria-hidden="true"
        style={{ display: "block" }}
      >
        <rect
          x={s * 0.12}
          y={s * 0.12}
          width={s * 0.76}
          height={s * 0.76}
          rx={s * 0.12}
          fill="#11141a"
          stroke="rgba(244,241,234,0.16)"
          strokeWidth="1"
        />
        {pos.map((p, i) => (
          <g key={i}>
            <circle cx={p[0]} cy={p[1] + r * 0.4} r={r} fill="rgba(0,0,0,0.4)" />
            <circle cx={p[0]} cy={p[1]} r={r} fill={colors[i]} />
            <circle
              cx={p[0] - r * 0.3}
              cy={p[1] - r * 0.3}
              r={r * 0.4}
              fill="rgba(255,255,255,0.5)"
            />
          </g>
        ))}
      </svg>
      {withWordmark && (
        <span
          className="font-display font-extrabold tracking-tight text-[1.05rem] leading-none"
          style={{ letterSpacing: "-0.02em" }}
        >
          BLOQE
        </span>
      )}
    </span>
  );
}
