export function GlassPanel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`glass rounded-3xl p-6 ${className}`}>{children}</div>
  );
}
