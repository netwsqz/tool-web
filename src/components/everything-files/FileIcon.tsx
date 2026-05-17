interface FileIconProps {
  className?: string;
}

export function FolderIcon({ className }: FileIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path
        d="M2 6a2 2 0 012-2h5l2 2h7a2 2 0 012 2v1H2V6z"
        strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M2 9h18l-1.5 9.5a2 2 0 01-2 1.5H5.5a2 2 0 01-2-1.5L2 9z"
        strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

export function FolderOpenIcon({ className }: FileIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path
        d="M2 6a2 2 0 012-2h5l2 2h7a2 2 0 012 2v1H2V6z"
        strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M2.5 9l1.2 10.5a2 2 0 002 1.5h12.6a2 2 0 002-1.5L21.5 9H2.5z"
        strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}
