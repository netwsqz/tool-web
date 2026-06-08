"use client";

type VinylDiscProps = {
  coverUrl?: string;
  isActive: boolean;
};

const GRADIENT_FALLBACK =
  "conic-gradient(from 0deg, var(--color-accent), color-mix(in srgb, var(--color-accent) 80%, var(--color-bg-deep)), color-mix(in srgb, var(--color-accent) 60%, var(--color-bg-deep)), color-mix(in srgb, var(--color-accent) 90%, var(--color-bg-deep)), var(--color-accent))";

const GROOVE_RINGS = [
  { size: "28%", speed: "8s", opacity: 0.06 },
  { size: "42%", speed: "12s", opacity: 0.05 },
  { size: "55%", speed: "18s", opacity: 0.04 },
  { size: "68%", speed: "24s", opacity: 0.03 },
];

export function VinylDisc({ coverUrl, isActive }: VinylDiscProps) {
  return (
    <div className="relative flex items-center justify-center">
      {/* Tonearm */}
      <div
        className="absolute -top-4 right-2 sm:-top-6 sm:right-4 z-20"
        style={{ willChange: "transform" }}
      >
        <svg
          width="120"
          height="200"
          viewBox="0 0 120 200"
          className="w-20 sm:w-28 md:w-32"
          style={{ overflow: "visible" }}
        >
          <g
            style={{
              transformOrigin: "100px 20px",
              transform: `rotate(${isActive ? -18 : -38}deg)`,
              transition: "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            {/* Pivot base — accent */}
            <circle
              cx="100"
              cy="20"
              r="10"
              fill="color-mix(in srgb, var(--color-accent) 15%, transparent)"
              stroke="color-mix(in srgb, var(--color-accent) 30%, transparent)"
              strokeWidth="1.5"
            />
            <circle cx="100" cy="20" r="4" fill="var(--color-accent)" />
            {/* Arm */}
            <line
              x1="96"
              y1="24"
              x2="8"
              y2="150"
              stroke="var(--color-foreground-muted)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Counterweight */}
            <rect
              x="88"
              y="6"
              width="8"
              height="6"
              rx="2"
              fill="var(--color-foreground-subtle)"
            />
            {/* Headshell */}
            <g transform="translate(8, 150)">
              <rect
                x="-2"
                y="0"
                width="12"
                height="20"
                rx="3"
                fill="color-mix(in srgb, var(--color-accent) 10%, transparent)"
                stroke="color-mix(in srgb, var(--color-accent) 20%, transparent)"
                strokeWidth="0.8"
              />
              <line
                x1="2"
                y1="20"
                x2="0"
                y2="28"
                stroke="var(--color-foreground-subtle)"
                strokeWidth="0.8"
                strokeLinecap="round"
              />
              {/* Stylus — glowing when active */}
              <circle
                cx="0"
                cy="29"
                r="1.5"
                fill="var(--color-accent)"
                opacity={isActive ? 1 : 0.3}
              />
              {isActive && (
                <circle
                  cx="0"
                  cy="29"
                  r="4"
                  fill="none"
                  stroke="var(--color-accent)"
                  opacity={0.3}
                >
                  <animate
                    attributeName="r"
                    values="4;7;4"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.3;0;0.3"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
            </g>
          </g>
        </svg>
      </div>

      {/* Glow behind disc — pulsing accent when active */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          backgroundImage: coverUrl ? `url(${coverUrl})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(60px)",
          opacity: isActive ? 0.3 : 0.15,
          transform: `scale(${isActive ? 1.2 : 1.1})`,
          transition: "opacity 0.8s ease, transform 0.8s ease",
          willChange: "transform, opacity",
          ...(isActive && {
            animation: "amp-glow-pulse 3s ease-in-out infinite",
          }),
        }}
      />
      {isActive && !coverUrl && (
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--color-accent) 15%, transparent), transparent 70%)",
            filter: "blur(40px)",
            animation: "amp-glow-pulse 3s ease-in-out infinite",
          }}
        />
      )}

      {/* Vinyl disc */}
      <div
        className={`relative rounded-full overflow-hidden size-48 sm:size-56 md:size-64 lg:size-72 xl:size-80 2xl:size-96 ${isActive ? "animate-spin-slow" : ""}`}
        style={{
          backgroundImage: coverUrl ? `url(${coverUrl})` : GRADIENT_FALLBACK,
          backgroundSize: "cover",
          backgroundPosition: "center",
          boxShadow: "0 8px 60px color-mix(in srgb, var(--color-bg-deep) 50%, transparent)",
          border: "1px solid var(--color-border)",
          willChange: "transform",
        }}
      >
        {/* Vinyl groove rings — animated concentric circles */}
        {GROOVE_RINGS.map((ring) => (
          <div
            key={ring.size}
            className={`absolute inset-0 rounded-full ${isActive ? "animate-spin-slow" : ""}`}
            style={{
              margin: ring.size,
              border: "1px solid color-mix(in srgb, var(--color-bg-deep), transparent 85%)",
              opacity: ring.opacity,
              animationDuration: ring.speed,
              animationDirection: "reverse",
            }}
          />
        ))}

        {/* Light sweep reflection */}
        {isActive && (
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "linear-gradient(135deg, transparent 30%, color-mix(in srgb, var(--color-foreground) 6%, transparent) 45%, transparent 55%)",
              animation: "amp-light-sweep 4s ease-in-out infinite",
              willChange: "transform",
            }}
          />
        )}

        {/* Vinyl shading overlay */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at center, transparent 32%, color-mix(in srgb, var(--color-bg-deep) 25%, transparent) 33%, transparent 34%, color-mix(in srgb, var(--color-bg-deep) 18%, transparent) 48%, transparent 49%, color-mix(in srgb, var(--color-bg-deep) 12%, transparent) 62%, transparent 63%, color-mix(in srgb, var(--color-bg-deep) 10%, transparent) 75%, transparent 76%)",
          }}
        />
        <div
          className="absolute inset-[15%] rounded-full"
          style={{
            background:
              "radial-gradient(circle at center, transparent 60%, color-mix(in srgb, var(--color-foreground) 12%, transparent) 61%, transparent 62%)",
          }}
        />

        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="size-8 sm:size-10 md:size-12 rounded-full flex items-center justify-center"
            style={{
              background: coverUrl
                ? "radial-gradient(circle at 35% 35%, var(--color-bg-elevated), var(--color-bg-base))"
                : "radial-gradient(circle at 35% 35%, var(--color-accent), color-mix(in srgb, var(--color-accent) 60%, var(--color-bg-deep)))",
              boxShadow:
                "inset 0 1px 2px color-mix(in srgb, var(--color-foreground) 15%, transparent), 0 2px 8px color-mix(in srgb, var(--color-bg-deep) 30%, transparent)",
            }}
          >
            <div
              className="size-2.5 sm:size-3.5 rounded-full"
              style={{
                background: coverUrl ? "var(--color-bg-deep)" : "var(--color-foreground)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
