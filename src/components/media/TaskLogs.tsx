"use client";

import { useEffect, useRef, useState } from "react";

export function TaskLogs({
  logs,
  expanded: defaultExpanded = false,
}: {
  logs: string[];
  expanded?: boolean;
}) {
  const [open, setOpen] = useState(defaultExpanded);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, open]);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]
          hover:text-[var(--color-text-primary)] transition-colors"
      >
        <span className={`transition-transform ${open ? "rotate-90" : ""}`}>▶</span>
        FFmpeg 日志
        {logs.length > 0 && (
          <span className="opacity-50">({logs.length} 行)</span>
        )}
      </button>

      {open && (
        <div
          ref={scrollRef}
          className="mt-2 max-h-48 overflow-y-auto bg-black/40 rounded-xl p-3 font-mono text-xs
            leading-relaxed"
        >
          {logs.length === 0 ? (
            <p className="text-[var(--color-text-secondary)] italic">
              处理中，等待日志…
            </p>
          ) : (
            logs.map((line, i) => (
              <div key={i} className="text-green-400/80">
                {line}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
