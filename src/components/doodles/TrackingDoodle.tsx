const TrackingDoodle = ({ className = "" }: { className?: string }) => (
    <svg
        viewBox="0 0 80 80"
        className={`doodle ${className}`}
        xmlns="http://www.w3.org/2000/svg"
    >
        {/* Clipboard body */}
        <rect
            x="16" y="14" width="48" height="56" rx="4"
            stroke="currentColor"
            strokeWidth="3"
            fill="currentColor"
            fillOpacity="0.08"
        />
        {/* Clipboard clip */}
        <rect
            x="28" y="8" width="24" height="12" rx="3"
            stroke="currentColor"
            strokeWidth="2.5"
            fill="currentColor"
            fillOpacity="0.15"
        />
        {/* Checklist line 1 - checked */}
        <path
            d="M24 34 L29 39 L37 29"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <line x1="42" y1="34" x2="56" y2="34" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        {/* Checklist line 2 - checked */}
        <path
            d="M24 48 L29 53 L37 43"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <line x1="42" y1="48" x2="56" y2="48" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        {/* Checklist line 3 - pending */}
        <rect
            x="24" y="57" width="12" height="12" rx="2"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeDasharray="3 2"
        />
        <line x1="42" y1="63" x2="56" y2="63" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
);

export default TrackingDoodle;
