const DocumentDoodle = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 80 100"
    className={`doodle ${className}`}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Paper with folded corner */}
    <path
      d="M15 10 L55 10 L65 20 L65 90 Q65 92 63 92 L17 92 Q15 92 15 90 L15 10"
      stroke="currentColor"
      strokeWidth="3"
      fill="none"
    />
    {/* Folded corner */}
    <path
      d="M55 10 L55 20 L65 20"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    {/* Lines representing text */}
    <path d="M25 35 L55 35" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" />
    <path d="M25 48 L55 48" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" />
    <path d="M25 61 L45 61" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" />
    <path d="M25 74 L50 74" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" />
  </svg>
);

export default DocumentDoodle;
