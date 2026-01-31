const TargetDoodle = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 80 80"
    className={`doodle ${className}`}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Outer circle */}
    <circle
      cx="40"
      cy="40"
      r="30"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeDasharray="5 3"
    />
    
    {/* Middle circle */}
    <circle
      cx="40"
      cy="40"
      r="20"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    
    {/* Inner circle */}
    <circle
      cx="40"
      cy="40"
      r="10"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    
    {/* Bullseye */}
    <circle cx="40" cy="40" r="4" fill="currentColor" />
    
    {/* Arrow */}
    <path
      d="M65 15 L42 38"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <path
      d="M65 15 L55 17 L63 25 Z"
      fill="currentColor"
    />
    <path
      d="M65 15 L70 10"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M68 18 L73 13"
      stroke="currentColor"
      strokeWidth="2"
    />
  </svg>
);

export default TargetDoodle;
