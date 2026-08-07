function Svg({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

export const IconIssue = () => (
  <Svg>
    <path d="M7 3.5h7l3 3v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1Z" stroke="currentColor" />
    <path d="M14 3.5v3h3" stroke="currentColor" />
    <path d="M9 13h6M9 16.5h4" stroke="currentColor" />
  </Svg>
);

export const IconCertify = () => (
  <Svg>
    <path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3Z" stroke="currentColor" />
    <path d="m9.2 12 1.9 1.9L15 10" stroke="currentColor" />
  </Svg>
);

export const IconScan = () => (
  <Svg>
    <path d="M4 8V5a1 1 0 0 1 1-1h3M20 8V5a1 1 0 0 0-1-1h-3M4 16v3a1 1 0 0 0 1 1h3M20 16v3a1 1 0 0 1-1 1h-3" stroke="currentColor" />
    <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" />
  </Svg>
);

export const IconLink = () => (
  <Svg>
    <path d="M9.5 14.5 14.5 9.5" stroke="currentColor" />
    <path d="M11 6.5 12.6 4.9a3 3 0 0 1 4.24 4.25L15.2 10.8M13 17.5l-1.6 1.6a3 3 0 0 1-4.24-4.25L8.8 13.2" stroke="currentColor" />
  </Svg>
);

export const IconFingerprint = () => (
  <Svg>
    <path d="M12 4a8 8 0 0 0-8 8c0 2 .3 3.6.9 5" stroke="currentColor" />
    <path d="M12 4a8 8 0 0 1 8 8c0 1-.05 1.9-.2 2.7" stroke="currentColor" />
    <path d="M8.5 20a12 12 0 0 1-1.4-4.6M12 7.5a4.5 4.5 0 0 0-4.5 4.5c0 2.4.4 4.2 1.1 5.6M12 7.5a4.5 4.5 0 0 1 4.5 4.5c0 .8-.05 1.5-.15 2.1M12 11a1 1 0 0 0-1 1c0 2.8.6 4.7 1.4 6.1" stroke="currentColor" />
  </Svg>
);

export const IconFlag = () => (
  <Svg>
    <path d="M6 3.5v17" stroke="currentColor" />
    <path d="M6 4.5h11l-2.5 3.5L17 11.5H6" stroke="currentColor" />
  </Svg>
);

export const IconDevices = () => (
  <Svg>
    <rect x="3" y="4" width="12" height="9" rx="1.2" stroke="currentColor" />
    <path d="M6 17h6" stroke="currentColor" />
    <rect x="16.5" y="8.5" width="5" height="9" rx="1.2" stroke="currentColor" />
  </Svg>
);

export const IconChecklist = () => (
  <Svg>
    <rect x="4.5" y="3.5" width="15" height="17" rx="2" stroke="currentColor" />
    <path d="m8 9 1.4 1.4L12 7.8M8 15h1.4M13 9h4M13 15h4" stroke="currentColor" />
  </Svg>
);
