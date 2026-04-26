interface KnobRowProps {
  children: React.ReactNode;
  className?: string;
}

export function KnobRow({ children, className }: KnobRowProps) {
  return (
    <div className={`flex flex-wrap items-start justify-center gap-3 ${className ?? ""}`}>
      {children}
    </div>
  );
}
