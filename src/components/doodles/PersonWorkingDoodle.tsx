const PersonWorkingDoodle = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 120 100"
    className={`doodle ${className}`}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Desk */}
    <path
      d="M20 70 L100 70"
      stroke="currentColor"
      strokeWidth="3"
    />
    <path d="M25 70 L25 85" stroke="currentColor" strokeWidth="3" />
    <path d="M95 70 L95 85" stroke="currentColor" strokeWidth="3" />
    
    {/* Laptop */}
    <path
      d="M40 70 L40 55 Q40 52 43 52 L77 52 Q80 52 80 55 L80 70"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    <path
      d="M35 70 L35 72 Q35 74 38 74 L82 74 Q85 74 85 72 L85 70"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    
    {/* Person - head */}
    <circle cx="60" cy="30" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
    
    {/* Person - body */}
    <path
      d="M60 40 L60 52"
      stroke="currentColor"
      strokeWidth="2"
    />
    
    {/* Person - arms reaching to laptop */}
    <path
      d="M60 45 L45 55"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M60 45 L75 55"
      stroke="currentColor"
      strokeWidth="2"
    />
    
    {/* Coffee cup */}
    <path
      d="M90 60 L90 68 Q90 70 88 70 L84 70 Q82 70 82 68 L82 60 L90 60"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
    />
    <path d="M90 63 Q94 63 94 66 Q94 69 90 69" stroke="currentColor" strokeWidth="1.5" fill="none" />
    
    {/* Steam from coffee */}
    <path d="M85 58 Q86 55 85 52" stroke="currentColor" strokeWidth="1" fill="none" />
    <path d="M88 58 Q89 54 88 50" stroke="currentColor" strokeWidth="1" fill="none" />
  </svg>
);

export default PersonWorkingDoodle;
