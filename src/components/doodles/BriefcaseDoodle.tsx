const BriefcaseDoodle = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={`${className}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
  >
    <rect
      x="2" y="7" width="20" height="14" rx="2"
      stroke="currentColor"
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <path
      d="M16 7V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M12 12V14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M2 12H22"
      stroke="currentColor"
      strokeWidth="2"
    />
  </svg>
);

export default BriefcaseDoodle;

