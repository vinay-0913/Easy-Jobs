const BriefcaseDoodle = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 100 100"
    className={`doodle ${className}`}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M20 35 L20 75 Q20 80 25 80 L75 80 Q80 80 80 75 L80 35 Q80 30 75 30 L25 30 Q20 30 20 35"
      stroke="currentColor"
      strokeWidth="3"
    />
    <path
      d="M35 30 L35 25 Q35 20 40 20 L60 20 Q65 20 65 25 L65 30"
      stroke="currentColor"
      strokeWidth="3"
    />
    <path
      d="M15 45 L85 45"
      stroke="currentColor"
      strokeWidth="2"
      strokeDasharray="4 4"
    />
    <circle cx="50" cy="50" r="5" fill="currentColor" />
  </svg>
);

export default BriefcaseDoodle;
