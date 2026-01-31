const RocketDoodle = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 80 100"
    className={`doodle ${className}`}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Rocket body */}
    <path
      d="M40 10 Q30 30 30 50 L30 65 Q30 70 35 70 L45 70 Q50 70 50 65 L50 50 Q50 30 40 10"
      stroke="currentColor"
      strokeWidth="3"
      fill="none"
    />
    
    {/* Window */}
    <circle cx="40" cy="40" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
    <circle cx="40" cy="40" r="4" fill="currentColor" opacity="0.3" />
    
    {/* Left fin */}
    <path
      d="M30 55 L20 70 L30 65"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    
    {/* Right fin */}
    <path
      d="M50 55 L60 70 L50 65"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    
    {/* Flames */}
    <path
      d="M35 70 Q37 80 35 90 Q40 82 40 85 Q40 82 45 90 Q43 80 45 70"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    
    {/* Stars around */}
    <circle cx="15" cy="25" r="2" fill="currentColor" />
    <circle cx="65" cy="30" r="1.5" fill="currentColor" />
    <circle cx="70" cy="50" r="2" fill="currentColor" />
    <path d="M10 50 L12 47 L14 50 L17 52 L14 54 L12 57 L10 54 L7 52 Z" fill="currentColor" opacity="0.6" />
  </svg>
);

export default RocketDoodle;
