const CheckmarkDoodle = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 80 80"
    className={`doodle ${className}`}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Circle */}
    <circle
      cx="40"
      cy="40"
      r="32"
      stroke="currentColor"
      strokeWidth="3"
      fill="none"
      strokeDasharray="3 2"
    />
    {/* Checkmark */}
    <path
      d="M25 42 L35 52 L55 28"
      stroke="currentColor"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default CheckmarkDoodle;
